import { prisma } from '@/lib/db';
import { fetchArtistPageBySlug } from '@/lib/wiki/fetchArtistPage';
import { fetchInfluencesForArtist } from '@/lib/wiki/fetchInfluences';

const MAX_NODES = 200;
const MAX_EDGES = 450;
const MAX_INFLUENCES_PER_ARTIST = 10;

interface GraphNode {
    id: string; // We'll use slug as the ID for the frontend
    name: string;
    depth: number;
    imageUrl?: string;
    wikiUrl?: string;
}

interface GraphLink {
    source: string;
    target: string;
    relationType: string;
}

interface GraphResponse {
    nodes: GraphNode[];
    links: GraphLink[];
    truncated: boolean;
}

export async function buildGraph(startSlug: string, maxDepth: number = 2): Promise<GraphResponse> {
    // Clamp depth
    const depth = Math.max(1, Math.min(maxDepth, 3));

    const nodes = new Map<string, GraphNode>();
    const links: GraphLink[] = [];
    const visited = new Set<string>();
    const queue: { slug: string; depth: number }[] = [];

    // 1. Fetch Root Artist
    const rootArtist = await fetchArtistPageBySlug(startSlug);
    if (!rootArtist) {
        return { nodes: [], links: [], truncated: false };
    }

    queue.push({ slug: rootArtist.slug, depth: 0 });
    visited.add(rootArtist.slug);
    nodes.set(rootArtist.slug, {
        id: rootArtist.slug,
        name: rootArtist.name,
        depth: 0,
        imageUrl: rootArtist.imageUrl || undefined,
        wikiUrl: rootArtist.wikiUrl || undefined,
    });

    let truncated = false;

    // BFS
    while (queue.length > 0) {
        if (nodes.size >= MAX_NODES || links.length >= MAX_EDGES) {
            truncated = true;
            break;
        }

        const current = queue.shift()!;

        if (current.depth >= depth) continue;

        // Fetch influences
        // This function now returns edges but we might need to verify the targets
        // The current fetchInfluences logic creates shell artists in the DB.
        // We rely on fetchArtistPage to validate them when we visit them.
        // However, fetchInfluences creates edges to them immediately.
        // We should only traverse edges that point to valid artists.

        // Actually, fetchInfluences returns a list of { target: string, type: string }
        // It also creates the edges in the DB.
        // We should query the DB for edges because fetchInfluences might have been called before.

        // First, ensure we have fresh influences if needed
        // Check if we need to fetch from Wiki (e.g. if lastFetched is old or no edges)
        // For now, we always try to fetch if we haven't recently?
        // Let's rely on fetchInfluences internal logic (it doesn't check staleness yet, but we can add it later)
        // For this MVP, we call it.

        await fetchInfluencesForArtist(current.slug);

        // Now query DB for edges
        const artist = await prisma.artist.findUnique({
            where: { slug: current.slug },
            include: {
                influencesGiven: { include: { toArtist: true } },
                influencesReceived: { include: { fromArtist: true } },
            },
        });

        if (!artist) continue;

        // Process outgoing (influenced -> toArtist)
        // "Influences" means Current -> Target (Current is influenced by Target? No.)
        // Wait, "Influences" section usually lists people the artist influenced? Or was influenced by?
        // "Influences": "The Beatles were influenced by Elvis". So Beatles -> Elvis.
        // "Influenced": "The Beatles influenced Oasis". So Beatles -> Oasis.

        // In our DB:
        // Influence: fromArtist -> toArtist.
        // relationType = 'influenced_by' usually means "fromArtist is influenced by toArtist".
        // Wait, let's stick to one direction.
        // If A is influenced by B, we store A -> B with type "influenced_by"?
        // Or B -> A with type "influenced"?
        // The rules say: "fromArtist --(influenced_by)--> toArtist".
        // So if A is influenced by B, it is A -> B.

        // Let's look at neighbors.
        const neighbors: { artist: any; rel: string; dir: 'from' | 'to' }[] = [];

        // influencesGiven: I am 'from'. I am influenced by 'to'.
        // So 'to' is the influence.
        for (const edge of artist.influencesGiven) {
            neighbors.push({ artist: edge.toArtist, rel: edge.relationType, dir: 'to' });
        }

        // influencesReceived: I am 'to'. 'from' is influenced by me.
        // So 'from' is the follower.
        for (const edge of artist.influencesReceived) {
            neighbors.push({ artist: edge.fromArtist, rel: edge.relationType, dir: 'from' });
        }

        // Sort neighbors by some criteria? Or just take first N.
        // We limit per artist.
        const limitedNeighbors = neighbors.slice(0, MAX_INFLUENCES_PER_ARTIST);

        for (const neighbor of limitedNeighbors) {
            const neighborSlug = neighbor.artist.slug;

            // If not visited, add to queue
            if (!visited.has(neighborSlug)) {
                // Validate artist if it's a shell (no lastFetched)
                if (!neighbor.artist.lastFetched) {
                    const validArtist = await fetchArtistPageBySlug(neighborSlug);
                    if (!validArtist) {
                        // Invalid artist (e.g. "Seattle"), skip
                        continue;
                    }
                    // Update neighbor object with fetched data
                    neighbor.artist = validArtist;
                }

                visited.add(neighborSlug);
                nodes.set(neighborSlug, {
                    id: neighborSlug,
                    name: neighbor.artist.name,
                    depth: current.depth + 1,
                    imageUrl: neighbor.artist.imageUrl || undefined,
                    wikiUrl: neighbor.artist.wikiUrl || undefined,
                });
                queue.push({ slug: neighborSlug, depth: current.depth + 1 });
            }

            // Add link
            // We always add the link if both nodes are in the graph (or will be)
            // Since we just added the neighbor (or it was already visited), it's valid.

            // Direction:
            // If neighbor is 'to' (I am influenced by neighbor), link is Source(Me) -> Target(Neighbor).
            // If neighbor is 'from' (Neighbor is influenced by me), link is Source(Neighbor) -> Target(Me).

            const link = neighbor.dir === 'to'
                ? { source: current.slug, target: neighborSlug, relationType: neighbor.rel }
                : { source: neighborSlug, target: current.slug, relationType: neighbor.rel };

            // Avoid duplicate links
            const linkExists = links.some(l => l.source === link.source && l.target === link.target);
            if (!linkExists) {
                links.push(link);
            }
        }
    }

    return {
        nodes: Array.from(nodes.values()),
        links,
        truncated,
    };
}
