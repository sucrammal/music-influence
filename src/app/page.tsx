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
  default: { name: 'Default', colors: { depth0: '#ef4444', depth1: '#3b82f6', depth2: '#9ca3af', depth3: '#d1d5db' } },
  ocean: { name: 'Ocean', colors: { depth0: '#0ea5e9', depth1: '#22d3ee', depth2: '#94a3b8', depth3: '#cbd5e1' } },
  sunset: { name: 'Sunset', colors: { depth0: '#f97316', depth1: '#ec4899', depth2: '#a855f7', depth3: '#d8b4fe' } },
  forest: { name: 'Forest', colors: { depth0: '#10b981', depth1: '#84cc16', depth2: '#14532d', depth3: '#86efac' } },
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
    <main className="h-screen w-screen flex flex-col bg-white text-gray-900 font-sans overflow-hidden" onClick={() => setShowThemeMenu(false)}>
      {/* Header Section - Compressed */}
      <header className="flex-shrink-0 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm z-20 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">

          {/* Title & Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🎵</span>
            <h1 className="text-xl md:text-2xl font-serif font-bold tracking-tight whitespace-nowrap">
              Music Influence
            </h1>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-md flex-grow">
            <ArtistSearchBar onSelectArtist={handleSelectArtist} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 text-sm flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
              <span className="text-gray-500 font-medium hidden sm:inline">Depth:</span>
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-gray-700"
              >
                <option value={1}>1 (Direct)</option>
                <option value={2}>2 (Friends)</option>
                <option value={3}>3 (Deep)</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center gap-2 px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors bg-white"
                title="Customize Colors"
              >
                <div className="flex gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: THEMES[currentTheme].colors.depth0 }}></div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: THEMES[currentTheme].colors.depth1 }}></div>
                </div>
                <span className="text-gray-600 font-medium hidden sm:inline">Theme</span>
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
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.depth3 }}></div>
                      </div>
                      {theme.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Fills remaining height */}
      <div className="flex-1 relative w-full min-h-0 bg-gray-50">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 shadow-lg pointer-events-auto">
              {error}
            </div>
          </div>
        )}

        {/* Graph Container */}
        <div className="absolute inset-0 w-full h-full">
          {!loading && graphData.nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-4xl mb-4">🎵</span>
              <p className="text-lg font-medium">Search for an artist to view their influence graph</p>
            </div>
          ) : (
            <ArtistGraph
              data={graphData}
              onNodeClick={handleNodeClick}
              selectedNode={selectedArtist}
              colorTheme={THEMES[currentTheme].colors}
            />
          )}
        </div>

        {/* Floating Details Panel */}
        <ArtistDetailsPanel
          artist={selectedArtist ? { ...selectedArtist, slug: selectedArtist.id } : null}
          onRecenter={(slug) => handleSelectArtist(slug)}
          onClose={() => setSelectedArtist(null)}
        />
      </div>

      {/* Footer - Minimal */}
      <footer className="flex-shrink-0 py-1 px-4 text-xs text-gray-400 text-center border-t border-gray-100 bg-white">
        Data provided by Wikipedia. Built with Next.js & Prisma.
      </footer>
    </main>
  );
}
