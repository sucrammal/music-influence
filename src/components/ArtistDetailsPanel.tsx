'use client';

interface ArtistDetailsPanelProps {
    artist: {
        name: string;
        slug: string;
        summary?: string;
        wikiUrl?: string;
        imageUrl?: string;
    } | null;
    onRecenter: (slug: string) => void;
    onClose: () => void;
}

export default function ArtistDetailsPanel({ artist, onRecenter, onClose }: ArtistDetailsPanelProps) {
    if (!artist) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-40 p-6 overflow-y-auto border-l border-gray-200 transform transition-transform duration-300 ease-in-out">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
                ✕
            </button>

            <div className="mt-8 flex flex-col h-full">
                {artist.imageUrl && (
                    <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-full h-64 object-cover rounded-md mb-6 shadow-md"
                    />
                )}

                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">{artist.name}</h2>

                <div className="flex flex-col gap-3 mb-6">
                    <button
                        onClick={() => onRecenter(artist.slug)}
                        className="w-full bg-black text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        Recenter Graph
                    </button>

                    {artist.wikiUrl && (
                        <a
                            href={artist.wikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium text-center hover:bg-gray-50 transition-colors"
                        >
                            View on Wikipedia
                        </a>
                    )}
                </div>

                {artist.summary && (
                    <div className="prose prose-sm text-gray-600 flex-1 overflow-y-auto pr-2">
                        <p className="leading-relaxed">{artist.summary}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
