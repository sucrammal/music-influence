
import { fetchInfluencesForArtist } from '../src/lib/wiki/fetchInfluences';
import { fetchArtistPageBySlug } from '../src/lib/wiki/fetchArtistPage';

async function main() {
    const slug = 'Rage_Against_the_Machine';
    console.log(`Checking influences for: ${slug}`);

    // Ensure artist exists
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
