import { prisma } from '@/lib/db';

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';

interface WikiPageResult {
    pageid: number;
    title: string;
    extract: string;
    thumbnail?: {
        source: string;
        width: number;
        height: number;
    };
    fullurl: string;
}

export async function fetchArtistPageBySlug(slug: string) {
    // 1. Check DB first
    const existing = await prisma.artist.findUnique({
        where: { slug },
    });

    if (existing && existing.lastFetched) {
        // TODO: Add staleness check if needed (e.g., > 30 days)
        return existing;
    }

    // 2. Fetch from Wikipedia
    // We'll use the 'extracts', 'pageimages', 'info', 'categories', and 'revisions' (for wikitext/infobox check)
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        titles: slug.replace(/-/g, ' '),
        prop: 'extracts|pageimages|info|categories|revisions',
        rvprop: 'content', // Fetch wikitext
        exintro: 'true',
        explaintext: 'true',
        pithumbsize: '500',
        inprop: 'url',
        redirects: '1',
        origin: '*',
        cllimit: 'max', // Get all categories
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
        const data = await response.json();

        const pages = data.query?.pages;
        if (!pages) return null;

        const pageId = Object.keys(pages)[0];
        if (pageId === '-1') return null; // Not found

        const page = pages[pageId];
        const wikitext = page.revisions?.[0]?.['*'] || '';
        const categories = page.categories || [];

        // Validation: Is this a musical artist?
        // 1. Check Infobox
        const hasMusicalInfobox = /{{Infobox musical artist/i.test(wikitext) || /{{Infobox person/i.test(wikitext) || /{{Infobox band/i.test(wikitext);

        // 2. Check Categories (fallback)
        const musicKeywords = ['musicians', 'singers', 'bands', 'rappers', 'orchestras', 'songwriters', 'musical groups'];
        const hasMusicCategory = categories.some((c: any) =>
            musicKeywords.some(k => c.title.toLowerCase().includes(k))
        );

        if (!hasMusicalInfobox && !hasMusicCategory) {
            console.log(`Skipping ${page.title}: Not identified as a musical artist.`);
            return null;
        }

        // 3. Upsert into DB
        // Normalize slug from title for consistency
        const canonicalSlug = page.title.replace(/ /g, '_');

        const artist = await prisma.artist.upsert({
            where: { slug: canonicalSlug },
            update: {
                name: page.title,
                summary: page.extract,
                imageUrl: page.thumbnail?.source,
                wikiUrl: page.fullurl,
                lastFetched: new Date(),
            },
            create: {
                name: page.title,
                slug: canonicalSlug,
                summary: page.extract,
                imageUrl: page.thumbnail?.source,
                wikiUrl: page.fullurl,
                lastFetched: new Date(),
            },
        });

        return artist;
    } catch (error) {
        console.error(`Error fetching artist ${slug}:`, error);
        return null;
    }
}
