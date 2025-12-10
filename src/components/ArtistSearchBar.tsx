'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
    name: string;
    slug: string;
    url: string;
}

interface ArtistSearchBarProps {
    onSelectArtist: (slug: string) => void;
}

export default function ArtistSearchBar({ onSelectArtist }: ArtistSearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                fetch(`/api/search-artists?q=${encodeURIComponent(query)}`)
                    .then((res) => res.json())
                    .then((data) => {
                        setResults(data.results || []);
                        setIsOpen(true);
                    })
                    .catch(console.error);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (slug: string) => {
        setQuery('');
        setIsOpen(false);
        onSelectArtist(slug);
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md mx-auto z-50">
            <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-sm"
                placeholder="Search for an artist..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        if (results.length > 0) {
                            handleSelect(results[0].slug);
                        } else if (query.length > 0) {
                            // Fallback: try to search for exactly what was typed
                            // We assume the user might know the exact name or close to it.
                            // We'll slugify it simply and try.
                            const fallbackSlug = query.trim().replace(/ /g, '_');
                            handleSelect(fallbackSlug);
                        }
                    }
                }}
            />

            {isOpen && results.length > 0 && (
                <ul className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((result) => (
                        <li
                            key={result.slug}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-none"
                            onClick={() => handleSelect(result.slug)}
                        >
                            <div className="font-medium text-gray-800">{result.name}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
