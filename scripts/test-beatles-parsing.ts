
import { fetchInfluencesForArtist } from '../src/lib/wiki/fetchInfluences';
import { fetchArtistPageBySlug } from '../src/lib/wiki/fetchArtistPage';

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';

async function main() {
    const slug = 'The_Beatles';
    console.log(`Checking influences for: ${slug}`);

    // 1. Inspect Headers
    console.log('Fetching wikitext to inspect headers...');
    const params = new URLSearchParams({
        action: 'parse',
        page: slug.replace(/_/g, ' '),
        prop: 'wikitext',
        format: 'json',
        origin: '*',
        redirects: '1',
    });
    const res = await fetch(`${WIKI_API_URL}?${params.toString()}`);
    const data = await res.json();
    const wikitext = data.parse?.wikitext['*'] || '';

    const headerRegex = /(={2,})\s*(.+?)\s*\1/g;
    let match;
    console.log('\n--- HEADERS ---');
    while ((match = headerRegex.exec(wikitext)) !== null) {
        const header = match[2].trim();
        if (/influence/i.test(header) || /legacy/i.test(header) || /style/i.test(header)) {
            console.log(`[MATCH] ${header}`);
        } else {
            // console.log(`[SKIP] ${header}`); // Commented out to reduce noise
        }
    }

    // 2. Run Extraction
    console.log('\n--- EXTRACTION ---');
    await fetchArtistPageBySlug(slug);
    const influences = await fetchInfluencesForArtist(slug);
    console.log(`Found ${influences.length} influences.`);

    const influencedBy = influences.filter(i => i.type === 'influenced_by').map(i => i.target);
    const influenced = influences.filter(i => i.type === 'influenced').map(i => i.target);

    console.log(`\nInfluenced By (They were influenced by): ${influencedBy.length}`);
    console.log(influencedBy.slice(0, 10).join(', '));

    console.log(`\nInfluenced (They influenced): ${influenced.length}`);
    console.log(influenced.slice(0, 10).join(', '));
}

main().catch(console.error);
