
import { fetchArtistPageBySlug } from '../src/lib/wiki/fetchArtistPage';

async function main() {
    const slugs = [
        'The_Beatles',
        'Pablo_Picasso',
        'Philip_Larkin',
        'Carl_Perkins',
        'Little_Richard',
        'Elvis_Presley'
    ];

    console.log("Checking validation logic for specific slugs...");

    for (const slug of slugs) {
        console.log(`\n--- Testing: ${slug} ---`);
        const result = await fetchArtistPageBySlug(slug);
        if (result) {
            console.log(`✅ VALID: ${result.name}`);
            console.log(`   Summary: ${result.summary?.substring(0, 50)}...`);
        } else {
            console.log(`❌ INVALID (Returned null)`);
        }
    }
}

main().catch(console.error);
