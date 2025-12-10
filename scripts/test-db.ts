
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting DB verification...');

    // Create dummy artist
    const artist = await prisma.artist.create({
        data: {
            name: 'Test Artist',
            slug: 'test-artist',
            summary: 'A test artist for verification.',
        },
    });
    console.log('Created Artist:', artist);

    // Create another dummy artist
    const artist2 = await prisma.artist.create({
        data: {
            name: 'Influencer Artist',
            slug: 'influencer-artist',
        },
    });
    console.log('Created Artist 2:', artist2);

    // Create dummy influence
    const influence = await prisma.influence.create({
        data: {
            fromArtistId: artist2.id,
            toArtistId: artist.id,
            relationType: 'influenced_by',
            source: 'manual_test',
        },
    });
    console.log('Created Influence:', influence);

    // Read back
    const readArtist = await prisma.artist.findUnique({
        where: { id: artist.id },
        include: {
            influencesReceived: {
                include: {
                    fromArtist: true,
                },
            },
        },
    });

    console.log('Read back Artist with influences:', JSON.stringify(readArtist, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
