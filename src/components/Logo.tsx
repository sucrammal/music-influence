export default function Logo({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Node 1 (Top Left) */}
            <circle cx="30" cy="30" r="10" className="fill-foreground" />

            {/* Node 2 (Bottom) */}
            <circle cx="50" cy="80" r="10" className="fill-foreground" />

            {/* Node 3 (Top Right - Accent) */}
            <circle cx="80" cy="40" r="12" className="fill-[var(--accent)]" />

            {/* Connections */}
            <path
                d="M30 30 L50 80"
                stroke="currentColor"
                strokeWidth="4"
                className="text-foreground"
            />
            <path
                d="M50 80 L80 40"
                stroke="currentColor"
                strokeWidth="4"
                className="text-foreground"
            />
            <path
                d="M30 30 L80 40"
                stroke="currentColor"
                strokeWidth="4"
                className="text-foreground"
                strokeOpacity="0.5"
            />
        </svg>
    );
}
