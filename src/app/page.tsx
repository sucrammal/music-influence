/*
 * To run the dev server:
 * npm run dev
 */

'use client';

import { useState, useEffect } from 'react';
import ArtistSearchBar from '@/components/ArtistSearchBar';
import ArtistGraph from '@/components/ArtistGraph';
import ArtistDetailsPanel from '@/components/ArtistDetailsPanel';

// Theme Definitions
const THEMES = {
  default: { name: 'Default', colors: { depth0: '#ef4444', depth1: '#3b82f6', depth2: '#9ca3af' } },
  ocean: { name: 'Ocean', colors: { depth0: '#0ea5e9', depth1: '#22d3ee', depth2: '#94a3b8' } },
  sunset: { name: 'Sunset', colors: { depth0: '#f97316', depth1: '#ec4899', depth2: '#a855f7' } },
  forest: { name: 'Forest', colors: { depth0: '#10b981', depth1: '#84cc16', depth2: '#14532d' } },
};

export default function Home() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [depth, setDepth] = useState(2);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

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
    <main className="flex min-h-screen flex-col items-center p-4 bg-white text-gray-900 font-sans" onClick={() => setShowThemeMenu(false)}>
      <header className="w-full max-w-5xl flex flex-col items-center mb-6 mt-4">
        <h1 className="text-4xl font-serif font-bold mb-2 tracking-tight flex items-center gap-3">
          <span className="text-3xl">🎵</span> Music Influence Graph
        </h1>
        <p className="text-gray-500 mb-6 font-light">Explore the connections between your favorite artists.</p>

        <div className="w-full max-w-md mb-4">
          <ArtistSearchBar onSelectArtist={handleSelectArtist} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 text-sm relative" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Depth:</span>
            <div className="relative">
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="appearance-none border border-gray-300 rounded-md pl-3 pr-8 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent shadow-sm cursor-pointer"
              >
                <option value={1}>1 (Direct)</option>
                <option value={2}>2 (Friends of Friends)</option>
                <option value={3}>3 (Deep Dive)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
              title="Customize Colors"
            >
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEMES[currentTheme].colors.depth0 }}></div>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEMES[currentTheme].colors.depth1 }}></div>
              </div>
              <span className="text-gray-600 font-medium">Palette</span>
            </button>

            {showThemeMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-xs font-semibold text-gray-400 mb-2 px-2 uppercase tracking-wider">Select Theme</div>
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => { setCurrentTheme(key as any); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${currentTheme === key ? 'bg-gray-100 text-black font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.depth0 }}></div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.depth1 }}></div>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.depth2 }}></div>
                    </div>
                    {theme.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative w-full max-w-6xl h-[600px] min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 shadow-lg">
              {error}
            </div>
          </div>
        )}

        <ArtistGraph
          data={graphData}
          onNodeClick={handleNodeClick}
          selectedNode={selectedArtist}
          colorTheme={THEMES[currentTheme].colors}
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
    </main >
  );
}
