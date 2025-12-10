# Music Influence Graph

Explore how your favorite artists are connected.

Type in an artist, choose a depth, and get an interactive graph showing which artists influenced them (and who influenced those artists, and so on).

## High-Level Idea

1.  **User types an artist name** in a search bar.
2.  We:
    *   Suggest the top few matching artists (from our DB + Wikipedia search).
    *   Let the user pick the intended artist.
3.  Backend builds an **influence graph**:
    *   Uses a **SQLite + Prisma** database as the canonical source of artist + influence data.
    *   If data for an artist is missing or stale, it calls the **Wikipedia API** to fetch and parse influences.
    *   Recursively walks the influence graph up to a configurable depth, with safety caps.
4.  Frontend renders the graph using **react-force-graph**:
    *   Pan, zoom, and drag nodes.
    *   Click a node to see details and re-center the graph around that artist.

---

## Stack

### Frontend

*   **Framework**: Next.js (React + TypeScript)
*   **Styling**: Tailwind CSS
    *   **Aesthetic**: Light, minimal, artsy/chic, modern formal.
    *   **Fonts**: Serif for headings (Formal), Sans-serif for body (Clean).
    *   **Colors**: Monochrome (Black/White/Grays) with very subtle accents if needed. No "shadcn" default look.
*   **Graph Visualization**: [`react-force-graph`](https://github.com/vasturiano/react-force-graph)
    *   Interactive 2D/WebGL force-directed graph
    *   Supports pan, zoom, drag, click events

### Backend / API

*   **Runtime**: Node.js (via Next.js API routes)
*   **Language**: TypeScript
*   **HTTP API**:
    *   `GET /api/search-artists?q=...`
        *   Returns top ~3 artists matching a query, from:
            *   Local DB (fast)
            *   Fallback to Wikipedia search if needed
    *   `GET /api/graph?slug=<slug>&depth=<depth>`
        *   Returns an influence graph for the chosen artist slug and desired depth.
        *   Populates/refreshes DB from Wikipedia as needed.

### Data & Storage

*   **Database**: SQLite (local `data.db` file)
*   **ORM**: Prisma

#### Schema (simplified)

*   `Artist` table (canonical artist entities)
    *   `id` – integer PK
    *   `name` – display name
    *   `slug` – canonical unique identifier (e.g., Wikipedia page title)
    *   `wikiUrl` – link to Wikipedia page
    *   `summary` – short bio/description
    *   `imageUrl` – optional small image/thumbnail
    *   `lastFetched` – timestamp for when we last synced from Wikipedia
*   `Influence` table (directed relationships)
    *   `id` – integer PK
    *   `fromArtistId` – FK → `Artist.id`
    *   `toArtistId` – FK → `Artist.id`
    *   `relationType` – e.g., `"influenced_by"`, `"associated"`
    *   `source` – e.g., `"wikipedia"`

**Edge semantics**:
`fromArtist --(influenced_by)--> toArtist`
> “fromArtist is influenced by toArtist”

---

## Data Flow

### 1. Search

**Endpoint**: `GET /api/search-artists?q=...`

1.  Normalize query (`q`):
    *   Lowercase, trim, simple sanitization.
2.  Look up in SQLite:
    *   `WHERE name ILIKE '%q%'` OR `slug ILIKE '%q%'`.
    *   Sort by simple string similarity (e.g., Levenshtein) or basic heuristics.
3.  If not enough results:
    *   Call Wikipedia search API.
    *   Return top titles as suggestions (optionally insert stub `Artist` rows when user confirms).
4.  Response format:

```json
{
  "results": [
    { "name": "Radiohead", "slug": "Radiohead", "source": "db", "similarity": 0.93 },
    { "name": "Radiohead (demo)", "slug": "Radiohead_(demo)", "source": "wikipedia", "similarity": 0.7 }
  ]
}
```

The frontend displays up to 3 suggestions in a dropdown beneath the search bar.

### 2. Graph Generation

**Endpoint**: `GET /api/graph?slug=<slug>&depth=<depth>`

**Input**:

*   `slug`: the canonical artist slug (e.g., `Radiohead`)
*   `depth`: desired maximum depth (e.g., `1–3`)

**Flow**:

1.  **Resolve the root artist**
    *   Find `Artist` by `slug`.
    *   If not found:
        *   Use Wikipedia API to fetch canonical page for `slug`.
        *   Insert new `Artist` row (name, slug, wikiUrl, summary, etc.).
2.  **Build graph via BFS from root**
    *   We treat the DB as canonical.
    *   For each artist:
        *   If `lastFetched` is `null` or stale:
            *   Call Wikipedia:
                *   Parse infobox / sections (Influences, Influenced by, etc.).
                *   Extract related artist names.
                *   Resolve/insert those artists in DB.
                *   Create `Influence` edges (fromArtist --(influenced_by)--> toArtist).
3.  **Safety Caps**
    *   `MAX_DEPTH = 3`
    *   `MAX_NODES_PER_QUERY = 150`
    *   `MAX_EDGES_PER_QUERY = 300`
    *   `MAX_INFLUENCES_PER_ARTIST = 10`
    *   BFS ensures:
        *   Preference to artists closer to the root (small depth).
        *   If limits are hit, we stop expansion and mark the graph as truncated.
4.  **Response format**:

```json
{
  "nodes": [
    { "id": "1", "name": "Radiohead", "depth": 0, "imageUrl": "...", "wikiUrl": "..." },
    { "id": "2", "name": "Pixies", "depth": 1, "imageUrl": "...", "wikiUrl": "..." }
  ],
  "links": [
    { "source": "1", "target": "2", "relationType": "influenced_by" }
  ],
  "truncated": false
}
```

### Frontend Behavior

#### Pages

*   `/` – main search + graph page

#### Components (conceptual)

*   `ArtistSearchBar`
    *   Input field with debounced calls to `/api/search-artists`.
    *   Shows dropdown with top ~3 matches.
    *   On selection, calls `/api/graph` with chosen slug and selected depth.
*   `ArtistGraph`
    *   Wraps `react-force-graph` (ForceGraph2D) to render nodes/links.
    *   Supports:
        *   Pan / zoom
        *   Drag nodes
        *   On node click:
            *   Shows details (name, summary)
            *   Button to “Recenter on this artist” (refetch graph with that artist as root).
*   `ArtistDetailsPanel`
    *   Shows selected artist’s info:
        *   Name, image, summary
        *   Link to Wikipedia
    *   Could also show a mini list of “Influenced by” or “Influences” from the DB.

## Local Development

### Prerequisites

*   Node.js (LTS)
*   npm or pnpm
*   SQLite (already bundled with macOS, Prisma will manage the `.db` file)

### Setup

```bash
# Install dependencies
npm install

# Initialize Prisma
npx prisma init

# Edit prisma/schema.prisma to define Artist & Influence models

# Run initial migration
npx prisma migrate dev --name init

# Optionally open Prisma Studio to inspect DB
npx prisma studio

# Run the dev server
npm run dev
```

App will be available at `http://localhost:3000`.

## Future Work / v2 Ideas

*   Background worker / cron to refresh stale artists automatically.
*   More sophisticated fuzzy matching and ranking.
*   Integrate additional sources (MusicBrainz, Last.fm, Spotify similarity).
*   Timeline view: place artists along a time axis (by active years / birth year).
*   Export graph as JSON or as an image.
*   Mobile app using React Native / Expo calling the same API.