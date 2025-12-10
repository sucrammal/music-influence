'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useMemo } from 'react';

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

export interface ColorTheme {
    depth0: string;
    depth1: string;
    depth2: string;
    depth3: string;
}

interface ArtistGraphProps {
    data: GraphData;
    onNodeClick: (node: GraphNode) => void;
    selectedNode?: GraphNode | null;
    colorTheme?: ColorTheme;
}

export default function ArtistGraph({
    data,
    onNodeClick,
    selectedNode,
    colorTheme = { depth0: '#ef4444', depth1: '#3b82f6', depth2: '#9ca3af', depth3: '#d1d5db' } // Default theme
}: ArtistGraphProps) {
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

    // Process data for display - Memoize to prevent recreation on every render (like theme changes)
    const displayData = useMemo(() => ({
        nodes: data.nodes.map(n => ({
            ...n,
            val: n.depth === 0 ? 30 : (n.depth === 1 ? 15 : 8), // Increased sizes
            // color removed here, handled by accessor
        })),
        links: data.links.map(l => ({ ...l })),
    }), [data]);

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
                if (graphRef.current) {
                    graphRef.current.zoomToFit(400, 50);
                }
            }, 200);
        }
    }, [data]);

    return (
        <div ref={containerRef} className="w-full h-full overflow-hidden bg-gray-50">
            <ForceGraph2D
                key={graphKey} // Force remount when root artist changes
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={displayData}
                // nodeLabel="name" // Removed to prevent duplicate tooltip
                nodeColor={(node: any) => {
                    return node.depth === 0 ? colorTheme.depth0 : (node.depth === 1 ? colorTheme.depth1 : (node.depth === 2 ? colorTheme.depth2 : colorTheme.depth3));
                }}
                nodeRelSize={8}
                linkColor={() => '#cbd5e1'}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                onNodeClick={(node: any) => onNodeClick(node)}
                cooldownTicks={100}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    const isSelected = selectedNode && node.id === selectedNode.id;

                    // Match the nodeRelSize={8} passed to ForceGraph2D
                    // Default radius is Math.sqrt(val) * relSize
                    const radius = Math.sqrt(node.val || 1) * 8;

                    // Draw Selection Ring
                    if (isSelected) {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, radius * 1.2, 0, 2 * Math.PI, false);
                        ctx.strokeStyle = '#fbbf24'; // Amber border
                        ctx.lineWidth = 3 / globalScale;
                        ctx.stroke();

                        // Optional: Inner glow
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, radius * 1.2, 0, 2 * Math.PI, false);
                        ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
                        ctx.fill();
                    }

                    // Draw Label
                    // Always show for Depth 0 & 1. Show for others if selected or zoomed in.
                    if (isSelected || node.depth <= 1 || globalScale > 1.2) {
                        ctx.font = `${fontSize}px Sans-Serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'black';

                        // Add a small white stroke for readability against edges
                        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                        ctx.lineWidth = 2 / globalScale;
                        ctx.strokeText(label, node.x, node.y + radius + fontSize);
                        ctx.fillText(label, node.x, node.y + radius + fontSize);
                    }
                }}
            />
        </div>
    );
}
