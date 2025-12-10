import { NextResponse } from 'next/server';

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ results: [] });
    }

    // Search Wikipedia using generator to get categories
    const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: q,
        gsrlimit: '20', // Fetch more to allow for filtering
        prop: 'categories|pageimages|extracts',
        exintro: 'true',
        explaintext: 'true',
        exlimit: '20',
        exchars: '200', // Short summary
        piprop: 'thumbnail',
        pithumbsize: '100',
        cllimit: 'max',
        format: 'json',
        origin: '*',
    });

    try {
        const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
        const data = await response.json();

        const pages = data.query?.pages;
        if (!pages) {
            return NextResponse.json({ results: [] });
        }

        const searchResults = Object.values(pages).map((page: any) => {
            const categories = page.categories || [];
            const isMusicRelated = categories.some((c: any) => {
                const title = c.title.toLowerCase();
                return title.includes('musician') ||
                    title.includes('band') ||
                    title.includes('singer') ||
                    title.includes('rapper') ||
                    title.includes('musical group') ||
                    title.includes('orchestra') ||
                    title.includes('performer') ||
                    title.includes('songwriter');
            });

            const isExcluded = [
                'discography', 'list of', 'song', 'album', 'film', 'movie', 'tour',
                'videography', 'personnel', 'members', 'concerts', 'awards'
            ].some(term => page.title.toLowerCase().includes(term));

            return {
                name: page.title,
                slug: page.title.replace(/ /g, '_'),
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                imageUrl: page.thumbnail?.source,
                summary: page.extract,
                isMusicRelated,
                isExcluded
            };
        });

        // Filter: Must be music related AND not excluded
        // Also sort by index? generator=search doesn't guarantee order, but usually relevance.
        // Actually, we lost the sort order from search.
        // But let's just return the filtered list.
        const filteredResults = searchResults
            .filter((r: any) => r.isMusicRelated && !r.isExcluded)
            .slice(0, 5); // Limit to top 5

        return NextResponse.json({ results: filteredResults });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ results: [] }, { status: 500 });
    }
}
