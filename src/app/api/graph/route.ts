import { NextResponse } from 'next/server';
import { buildGraph } from '@/lib/graph/buildGraph';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const depthParam = searchParams.get('depth');

    if (!slug) {
        return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    const depth = depthParam ? parseInt(depthParam, 10) : 2;

    try {
        const graph = await buildGraph(slug, depth);
        return NextResponse.json(graph);
    } catch (error) {
        console.error('Graph build error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
