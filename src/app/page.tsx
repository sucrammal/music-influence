/*
 * To run the dev server:
 * npm run dev
 */

'use client';

import { useState, useEffect } from 'react';
import ArtistSearchBar from '@/components/ArtistSearchBar';
import ArtistGraph from '@/components/ArtistGraph';
import ArtistDetailsPanel from '@/components/ArtistDetailsPanel';

export default function Home() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [depth, setDepth] = useState(2);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  const fetchGraph = async (slug: string, targetDepth: number = depth) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/graph?slug=${encodeURIComponent(slug)}&depth=${targetDepth}`);
      if (!res.ok) throw new Error('Failed to fetch graph');
      const data = await res.json();
      setGraphData(data);
      setCurrentSlug(slug);
    } catch (err) {
      console.error(err);
      setError('Failed to load graph data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArtist = (slug: string) => {
    fetchGraph(slug, depth);
    setSelectedArtist(null); // Close panel on new search
  };

  // Re-fetch when depth changes if we have a current artist
  useEffect(() => {
    if (currentSlug) {
      fetchGraph(currentSlug, depth);
    }
  }, [depth]);

  const handleNodeClick = (node: any) => {
    setSelectedArtist(node);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-white text-gray-900 font-sans">
      <header className="w-full max-w-5xl flex flex-col items-center mb-6 mt-4">
        <h1 className="text-4xl font-serif font-bold mb-2 tracking-tight">Music Influence Graph</h1>
        <p className="text-gray-500 mb-6 font-light">Explore the connections between your favorite artists.</p>

        <div className="w-full max-w-md mb-4">
          <ArtistSearchBar onSelectArtist={handleSelectArtist} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Depth:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={1}>1 (Direct)</option>
              <option value={2}>2 (Friends of Friends)</option>
              <option value={3}>3 (Deep)</option>
            </select>
          </div>
        </div>
      </header>

      <div className="relative w-full max-w-6xl h-[600px] min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
              {error}
            </div>
          </div>
        )}

        <ArtistGraph
          data={graphData}
          onNodeClick={handleNodeClick}
        />

        <ArtistDetailsPanel
          artist={selectedArtist}
          onRecenter={(slug) => handleSelectArtist(slug)}
          onClose={() => setSelectedArtist(null)}
        />
      </div>

      <footer className="mt-8 text-sm text-gray-400">
        Data provided by Wikipedia. Built with Next.js & Prisma.
      </footer>
    </main>
  );
}
