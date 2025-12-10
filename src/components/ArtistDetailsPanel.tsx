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
        <div className="absolute z-40 bg-white/95 backdrop-blur-md shadow-2xl flex flex-col
            md:right-4 md:top-4 md:bottom-4 md:w-80 md:h-auto md:rounded-xl md:border md:border-gray-200
            bottom-0 left-0 right-0 h-[60vh] w-full rounded-t-2xl border-t border-gray-200
            transition-all duration-300 ease-in-out">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-50 bg-white/50 rounded-full"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="flex flex-col h-full p-6 overflow-y-auto">
                {artist.imageUrl && (
                    <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-full h-48 md:h-56 object-cover rounded-lg mb-5 shadow-sm flex-shrink-0"
                    />
                )}

                <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-3">{artist.name}</h2>

                <div className="flex flex-col gap-2 mb-5 flex-shrink-0">
                    <button
                        onClick={() => onRecenter(artist.slug)}
                        className="w-full bg-black text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm active:scale-[0.98]"
                    >
                        Recenter Graph
                    </button>

                    {artist.wikiUrl && (
                        <a
                            href={artist.wikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full border border-gray-200 bg-white text-gray-700 py-2.5 px-4 rounded-lg text-sm font-medium text-center hover:bg-gray-50 transition-colors active:scale-[0.98]"
                        >
                            View on Wikipedia
                        </a>
                    )}
                </div>

                {artist.summary && (
                    <div className="prose prose-sm text-gray-600 overflow-y-auto pr-2 custom-scrollbar">
                        <p className="leading-relaxed">{artist.summary}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
