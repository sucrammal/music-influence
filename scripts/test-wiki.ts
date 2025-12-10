
import { fetchArtistPageBySlug } from '../src/lib/wiki/fetchArtistPage';
import { fetchInfluencesForArtist } from '../src/lib/wiki/fetchInfluences';
import { prisma } from '../src/lib/db';

async function main() {
    const slug = 'Nirvana_(band)';
    console.log(`Fetching page for ${slug}...`);

    const artist = await fetchArtistPageBySlug(slug);
    console.log('Artist fetched:', artist?.name);

    if (artist) {
        console.log(`Fetching influences for ${slug}...`);
        const influences = await fetchInfluencesForArtist(slug);
        console.log(`Found ${influences.length} influence connections.`);
        console.log('Sample influences:', influences.slice(0, 5));
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
