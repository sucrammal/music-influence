import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Attempting to write to DB...');
    try {
        // Try to update a non-existent artist or just count
        const count = await prisma.artist.count();
        console.log(`Current artist count: ${count}`);

        // Try a write
        const testSlug = 'test_db_write_' + Date.now();
        await prisma.artist.create({
            data: {
                name: 'Test Artist',
                slug: testSlug,
            },
        });
        console.log('Successfully wrote to DB!');

        // Cleanup
        await prisma.artist.delete({
            where: { slug: testSlug },
        });
        console.log('Successfully cleaned up!');
    } catch (e) {
        console.error('Error writing to DB:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
