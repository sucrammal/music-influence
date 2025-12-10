
import { prisma } from '../src/lib/db';

async function main() {
    const slug = 'The_Beatles';
    console.log(`Inspecting DB edges for ${slug}...`);

    const artist = await prisma.artist.findUnique({
        where: { slug },
        include: {
            influencesGiven: { include: { toArtist: true } },
            influencesReceived: { include: { fromArtist: true } }
        }
    });

    if (!artist) {
        console.log('Artist not found in DB.');
        return;
    }

    console.log(`\nInfluences Given (I am influenced by X): ${artist.influencesGiven.length}`);
    artist.influencesGiven.forEach(i => {
        console.log(`- ${i.toArtist.name} (${i.toArtist.slug}) [Fetched: ${i.toArtist.lastFetched ? 'Yes' : 'No'}]`);
    });

    console.log(`\nInfluences Received (X is influenced by me): ${artist.influencesReceived.length}`);
    artist.influencesReceived.forEach(i => {
        console.log(`- ${i.fromArtist.name} (${i.fromArtist.slug}) [Fetched: ${i.fromArtist.lastFetched ? 'Yes' : 'No'}]`);
    });
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
