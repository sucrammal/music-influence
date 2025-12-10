
import { fetchInfluencesForArtist } from '../src/lib/wiki/fetchInfluences';
import { fetchArtistPageBySlug } from '../src/lib/wiki/fetchArtistPage';
import { prisma } from '../src/lib/db';

async function main() {
    const rootSlug = 'Black_Sabbath';
    console.log(`1. Fetching influences for root: ${rootSlug}`);

    const rootInfluences = await fetchInfluencesForArtist(rootSlug);
    console.log(`Found ${rootInfluences.length} raw influences for ${rootSlug}`);

    // Get the actual neighbors from DB to simulate buildGraph
    const rootArtist = await prisma.artist.findUnique({
        where: { slug: rootSlug },
        include: {
            influencesGiven: { include: { toArtist: true } },
            influencesReceived: { include: { fromArtist: true } }
        }
    });

    if (!rootArtist) {
        console.error("Root artist not found in DB!");
        return;
    }

    const neighbors = [
        ...rootArtist.influencesGiven.map(i => ({ name: i.toArtist.name, slug: i.toArtist.slug })),
        ...rootArtist.influencesReceived.map(i => ({ name: i.fromArtist.name, slug: i.fromArtist.slug }))
    ];

    console.log(`\n2. Root has ${neighbors.length} neighbors in DB.`);

    // Check first 3 neighbors
    for (const neighbor of neighbors.slice(0, 3)) {
        console.log(`\n--- Checking Neighbor: ${neighbor.name} (${neighbor.slug}) ---`);

        // Validate
        const valid = await fetchArtistPageBySlug(neighbor.slug);
        if (!valid) {
            console.log(`  -> INVALID (not a musical artist)`);
            continue;
        }
        console.log(`  -> Validated as: ${valid.name}`);

        // Fetch their influences
        const neighborInfluences = await fetchInfluencesForArtist(neighbor.slug);
        console.log(`  -> Found ${neighborInfluences.length} influences via Wiki fetch.`);

        if (neighborInfluences.length === 0) {
            console.log(`  -> WARNING: No influences found! This node will be a leaf.`);
        } else {
            console.log(`  -> Sample: ${neighborInfluences.slice(0, 3).map(i => i.target).join(', ')}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
