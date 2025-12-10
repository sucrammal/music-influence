import { prisma } from '@/lib/db';
import { fetchArtistPageBySlug } from './fetchArtistPage';

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';

// Helper to clean wiki links [[Link|Text]] -> Link
function parseWikiLinks(text: string): string[] {
    const links: string[] = [];
    const regex = /\[\[([^\]]+)\]\]/g;

    const ignoredTerms = [
        'The Guardian', 'Rolling Stone', 'AllMusic', 'Billboard', 'NME',
        'Wikipedia', 'Category:', 'File:', 'Image:', 'Help:', 'Portal:',
        'United Kingdom', 'United States', 'London', 'Liverpool', 'England',
        'RIAA', 'BBC', 'MTV', 'Grammy', 'Academy Award', 'Star-Club',
        'List of'
    ];

    let match;
    while ((match = regex.exec(text)) !== null) {
        const content = match[1];
        // Handle [[Target|Label]]
        const target = content.split('|')[0].trim();

        if (target && !ignoredTerms.some(term => target.includes(term))) {
            links.push(target);
        }
    }
    return links;
}

export async function fetchInfluencesForArtist(slug: string) {
    // 1. Fetch raw wikitext to parse Infobox
    const params = new URLSearchParams({
        action: 'parse',
        page: slug.replace(/_/g, ' '),
        prop: 'wikitext',
        format: 'json',
        origin: '*',
        redirects: '1',
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
        const data = await response.json();

        if (!data.parse || !data.parse.wikitext) return [];

        const wikitext = data.parse.wikitext['*'];
        const artistTitle = data.parse.title;

        // Ensure the artist exists in our DB (using the canonical title)
        const artistSlug = artistTitle.replace(/ /g, '_');
        const artist = await fetchArtistPageBySlug(artistSlug);
        if (!artist) return [];

        const influences: string[] = [];
        const influencedBy: string[] = [];

        // 2. Parse Infobox
        // We look for | followed by the key, then =, then content until the next | or }}
        // This regex captures multiline content non-greedily until it sees a new parameter start or end of infobox
        const infoboxRegex = /\|\s*(influences|influenced)\s*=\s*([\s\S]*?)(?=(\n\s*\||\}\}))/gi;
        let match;
        while ((match = infoboxRegex.exec(wikitext)) !== null) {
            const type = match[1].toLowerCase();
            const content = match[2];
            const links = parseWikiLinks(content);

            if (type === 'influences') {
                influences.push(...links);
            } else if (type === 'influenced') {
                influencedBy.push(...links);
            }
        }

        // 3. Parse Sections dynamically
        // We look for any section header that contains "influence"
        // Regex: == Header == ... content ...
        // We iterate through the text to find headers and their content.

        // Split text by headers (== Header ==)
        // This regex captures the header name and the following content
        const sectionSplitRegex = /(={2,})\s*(.+?)\s*\1([\s\S]*?)(?=(?:={2,})|$)/g;

        let sectionMatch;
        while ((sectionMatch = sectionSplitRegex.exec(wikitext)) !== null) {
            const header = sectionMatch[2].trim();
            const content = sectionMatch[3];

            if (/influence/i.test(header)) {
                const links = parseWikiLinks(content);

                // Determine direction
                // "Influenced by" -> influenced (Target -> Me)
                // "Influences" or "Musical style and influences" -> influences (Me -> Target)
                // "Influenced" (ambiguous, but usually means who they influenced if it's a standalone section? 
                // Actually "Influenced" section usually lists people they influenced.)

                if (/influenced by/i.test(header)) {
                    influencedBy.push(...links);
                } else {
                    // Default to "influences" (Me -> Target) for "Influences", "Musical style and influences"
                    // But wait, if the header is just "Influenced", it might mean "Artists influenced by X".
                    // Let's be careful.
                    // If header contains "influenced" but NOT "by", it likely means "Influenced [others]".
                    if (/influenced/i.test(header) && !/by/i.test(header)) {
                        // "Influenced" -> Me -> Target (I influenced them)
                        // Wait, my logic for 'influencedBy' array above was:
                        // influencedBy.push(...links) -> Handle "Influenced" (This artist influenced Y)
                        // So 'influencedBy' array holds Y.
                        // My code says:
                        // // Handle "Influenced" (This artist influenced Y)
                        // // Edge: Artist -> Y
                        // for (const targetName of influencedBy) ...

                        // So yes, if header is "Influenced", we add to influencedBy array.
                        influencedBy.push(...links);
                    } else {
                        // "Influences", "Musical style and influences" -> Me is influenced by Target
                        // My code says:
                        // // Handle "Influences" (This artist is influenced by X)
                        // // Edge: X -> Artist
                        // for (const targetName of uniqueInfluences) ...

                        // So 'influences' array holds X.
                        influences.push(...links);
                    }
                }
            }
        }

        // Deduplicate
        const uniqueInfluences = Array.from(new Set(influences));
        const uniqueInfluencedBy = Array.from(new Set(influencedBy));

        // 4. Process and save relationships
        const results = [];

        // Handle "Influences" (This artist is influenced by X)
        // Edge: X -> Artist
        for (const targetName of uniqueInfluences) {
            const targetSlug = targetName.replace(/ /g, '_');
            // We need to ensure the target artist exists or at least create a placeholder
            // For performance, we might just create a shell artist and fetch details later (BFS)

            let targetArtist = await prisma.artist.findUnique({ where: { slug: targetSlug } });
            if (!targetArtist) {
                targetArtist = await prisma.artist.create({
                    data: {
                        name: targetName,
                        slug: targetSlug,
                    }
                });
            }

            // Create edge: Target -> Current
            await prisma.influence.create({
                data: {
                    fromArtistId: targetArtist.id,
                    toArtistId: artist.id,
                    relationType: 'influenced_by',
                    source: 'wikipedia_infobox',
                }
            });
            results.push({ target: targetName, type: 'influenced_by' });
        }

        // Handle "Influenced" (This artist influenced Y)
        // Edge: Artist -> Y
        for (const targetName of influencedBy) {
            const targetSlug = targetName.replace(/ /g, '_');

            let targetArtist = await prisma.artist.findUnique({ where: { slug: targetSlug } });
            if (!targetArtist) {
                targetArtist = await prisma.artist.create({
                    data: {
                        name: targetName,
                        slug: targetSlug,
                    }
                });
            }

            // Create edge: Current -> Target
            await prisma.influence.create({
                data: {
                    fromArtistId: artist.id,
                    toArtistId: targetArtist.id,
                    relationType: 'influenced_by',
                    source: 'wikipedia_infobox',
                }
            });
            results.push({ target: targetName, type: 'influenced' });
        }

        return results;

    } catch (error) {
        console.error(`Error fetching influences for ${slug}:`, error);
        return [];
    }
}
