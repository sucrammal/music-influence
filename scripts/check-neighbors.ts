
import { fetchInfluencesForArtist } from '../src/lib/wiki/fetchInfluences';
import { fetchArtistPageBySlug } from '../src/lib/wiki/fetchArtistPage';

async function main() {
    const artistsToCheck = ['Cream_(band)', 'Blue_Cheer', 'The_Beatles'];

    for (const slug of artistsToCheck) {
        console.log(`\n--- Checking: ${slug} ---`);

        const valid = await fetchArtistPageBySlug(slug);
        if (!valid) {
            console.log(`  -> INVALID`);
            continue;
        }
        console.log(`  -> Validated as: ${valid.name}`);

        const influences = await fetchInfluencesForArtist(slug);
        console.log(`  -> Found ${influences.length} influences.`);
        if (influences.length > 0) {
            console.log(`  -> Sample: ${influences.slice(0, 5).map(i => i.target).join(', ')}`);
        }
    }
}

main().catch(console.error);
