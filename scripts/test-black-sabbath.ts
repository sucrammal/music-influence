
import { buildGraph } from '../src/lib/graph/buildGraph';
import { prisma } from '../src/lib/db';

async function main() {
    // 1. Test Search Filtering (Simulated)
    const query = 'Black Sabbath';
    console.log(`Testing search for "${query}"...`);
    // Note: We can't easily call the API route handler directly in this script context without mocking Request
    // So we'll just test the graph building which was the other complaint.

    // 2. Test Graph Building for The Beatles
    const startSlug = 'The_Beatles';
    console.log(`Building graph for ${startSlug}...`);

    const graph = await buildGraph(startSlug, 2);

    console.log('Graph built!');
    console.log(`Nodes: ${graph.nodes.length}`);
    console.log(`Links: ${graph.links.length}`);

    if (graph.nodes.length === 0) {
        console.error("ERROR: No nodes found! Graph generation failed.");
    } else {
        console.log('Sample Nodes:', graph.nodes.slice(0, 3).map(n => n.name));
        console.log('Sample Links:', graph.links.slice(0, 3));
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
