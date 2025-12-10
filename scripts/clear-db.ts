
import { prisma } from '../src/lib/db';

async function main() {
    console.log('Clearing database...');
    await prisma.influence.deleteMany({});
    await prisma.artist.deleteMany({});
    console.log('Database cleared.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
