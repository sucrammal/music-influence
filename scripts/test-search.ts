
import { GET } from '../src/app/api/search-artists/route';

async function main() {
    const query = 'Black Sabbath';
    console.log(`Testing search API for "${query}"...`);

    // Mock Request
    const req = new Request(`http://localhost:3000/api/search-artists?q=${encodeURIComponent(query)}`);

    const res = await GET(req);
    const data = await res.json();

    console.log(`Found ${data.results.length} results:`);
    data.results.forEach((r: any) => {
        console.log(`- ${r.name} (Music: ${r.isMusicRelated}, Excluded: ${r.isExcluded})`);
    });
}

main().catch(console.error);
