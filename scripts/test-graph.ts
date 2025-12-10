
import { buildGraph } from '../src/lib/graph/buildGraph';
import { prisma } from '../src/lib/db';

async function main() {
    const startSlug = 'Nirvana_(band)';
    console.log(`Building graph for ${startSlug}...`);

    const graph = await buildGraph(startSlug, 2);

    console.log('Graph built!');
    console.log(`Nodes: ${graph.nodes.length}`);
    console.log(`Links: ${graph.links.length}`);
    console.log(`Truncated: ${graph.truncated}`);

    console.log('Sample Nodes:', graph.nodes.slice(0, 3));
    console.log('Sample Links:', graph.links.slice(0, 3));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
