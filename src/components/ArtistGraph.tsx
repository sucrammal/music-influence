'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// Dynamic import for client-side only rendering
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface GraphNode {
    id: string;
    name: string;
    depth: number;
    imageUrl?: string;
    val?: number; // For node size
}

interface GraphLink {
    source: string;
    target: string;
    relationType: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

interface ArtistGraphProps {
    data: GraphData;
    onNodeClick: (node: GraphNode) => void;
}

export default function ArtistGraph({ data, onNodeClick }: ArtistGraphProps) {
    const graphRef = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setDimensions({
                    width: clientWidth || 800,
                    height: clientHeight || 600
                });
            }
        };

        // Initial measure
        updateDimensions();

        // Observer
        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Process data for display
    const displayData = {
        nodes: data.nodes.map(n => ({
            ...n,
            val: n.depth === 0 ? 30 : (n.depth === 1 ? 15 : 8), // Increased sizes
            color: n.depth === 0 ? '#ef4444' : (n.depth === 1 ? '#3b82f6' : '#9ca3af'),
        })),
        links: data.links.map(l => ({ ...l })),
    };

    // Find root node for key (forces remount on new search)
    const rootNode = data.nodes.find(n => n.depth === 0);
    const graphKey = rootNode ? rootNode.id : 'empty';

    useEffect(() => {
        if (graphRef.current) {
            // Tune physics
            graphRef.current.d3Force('charge').strength(-300); // More repulsion
            graphRef.current.d3Force('link').distance(70); // Longer links

            // Slight delay to allow render then zoom
            setTimeout(() => {
                graphRef.current.zoomToFit(400, 50);
            }, 200);
        }
    }, [data]);

    return (
        <div ref={containerRef} className="w-full h-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <ForceGraph2D
                key={graphKey} // Force remount when root artist changes
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={displayData}
                nodeLabel="name"
                nodeColor="color"
                nodeRelSize={8}
                linkColor={() => '#cbd5e1'}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                onNodeClick={(node: any) => onNodeClick(node)}
                cooldownTicks={100}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
            />
        </div>
    );
}
