---
trigger: always_on
---

# AGENT RULES — Music Influence Graph Project

These rules describe how the assistant should behave when generating code, explanations, or architecture decisions.

The goal: **clean, concise, consistent** code and a maintainable project.

---

## 1. GENERAL PRINCIPLES

1. Always prefer **clarity over cleverness**.
2. Code must be:
   - Short
   - Typed (TypeScript everywhere)
   - Consistent with the project structure
   - Consistent with the project structure
   - Idiomatic for Next.js + Prisma
   - **Styling**: Light, minimal, artsy/chic. Use Serif for headings, Sans for body. Sharp corners, thin borders. No "shadcn" defaults.
3. Avoid unnecessary abstractions.
   - Idiomatic for Next.js + Prisma
3. Avoid unnecessary abstractions.
4. All generated code must be self-contained, pasteable, and runnable without major modifications.
5. Explanations should be brief unless explicitly asked to be thorough.

---

## 2. PROJECT STACK (MUST FOLLOW)

- **Next.js (App Router OR Pages router as the repo dictates)**  
- **TypeScript**
- **Tailwind CSS**
- **SQLite + Prisma**
- **react-force-graph** for UI graph rendering
- **Wikipedia API** for data ingestion
- **BFS traversal** for graph building + safety caps

---

## 3. PROJECT STRUCTURE GUIDELINES

The assistant must ensure files follow this structure:

src/
app/ (or pages/)
api/
search-artists/
graph/
components/
ArtistSearchBar.tsx
ArtistGraph.tsx
ArtistDetailsPanel.tsx
lib/
db.ts
wiki/
fetchArtistPage.ts
fetchInfluences.ts
graph/
buildGraph.ts
prisma/
schema.prisma
data.db

markdown
Copy code

- All DB access goes through Prisma.
- All Wikipedia calls go in `lib/wiki`.
- All graph assembly lives in `lib/graph/buildGraph.ts`.

---

## 4. DATABASE RULES

### Artist
Must always have:
- `id: number`
- `name: string`
- `slug: string` (unique canonical identifier)
- Optional metadata:
  - `summary`, `wikiUrl`, `imageUrl`
  - `lastFetched` timestamp

### Influence
Edge semantics:

fromArtist --(influenced_by)--> toArtist

yaml
Copy code

Fields:
- `fromArtistId`
- `toArtistId`
- `relationType = "influenced_by" | "associated" | ...`
- `source = "wikipedia"`

No other relation directions allowed.

---

## 5. GRAPH BUILDING RULES

### BFS Algorithm Requirements
- BFS from root artist
- `depth ∈ [1, 3]`, clamp out-of-range values
- Safety caps:
  - `MAX_NODES = 150`
  - `MAX_EDGES = 300`
  - `MAX_INFLUENCES_PER_ARTIST = 10`

### Fallback & Caching
- DB is canonical.
- If artist missing or stale → call Wikipedia, update DB.
- Never duplicate artists: always use DB slug mapping.

### Graph Response Schema
The assistant must always return this structure:

```ts
{
  nodes: Array<{
    id: string;
    name: string;
    depth: number;
    imageUrl?: string;
    wikiUrl?: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    relationType: string;
  }>;
  truncated: boolean;
}
6. FRONTEND RULES
Use react-force-graph with dynamic import:

ts
Copy code
const ForceGraph2D = dynamic(() => import('react-force-graph').then(m => m.ForceGraph2D), { ssr: false });
UI must support:

Pan

Zoom

Node drag

Node click → show details panel

All components must:

Use functional React

Use hooks only (useState, useEffect, etc.)

Use Tailwind for styling

Search Bar
Use debouncing (300ms)

Call /api/search-artists?q=...

Display top 3 suggestions

Selecting a suggestion triggers /api/graph

Artist Details Panel
Shows:

Name

Summary

Wiki URL

"Recenter on this artist" button

7. WIKIPEDIA INGEST RULES
The assistant must always use MediaWiki API, not raw HTML scrapes, unless absolutely necessary.

Required Fetchers
fetchArtistPageBySlug(slug)

fetchInfluencesForArtist(slug)

Required Parsing Targets
Look for:

Infobox fields (influences, influenced_by)

Section names: "Influences", "Influenced by", "Musical style", "Legacy"

Required Normalization
Map page titles to canonical slugs.

Sanitize names before DB insert.

8. RESPONSE STYLE RULES
When generating code:

No extraneous text.

No pseudo-code unless asked.

Use correct TypeScript.

Delete commented-out code unless necessary for clarity.

Give brief context at top of the file if needed.

When explaining:

Use bullet points.

Keep paragraphs short.

Prefer diagrams when clarifying relationships.

When refusing:

Suggest the correct approach; do not block progress.

9. CONSISTENCY RULES
The assistant must ensure:

Same field names everywhere (slug, not Slug, not artistSlug).

Same graph response format everywhere.

Same DB schema in all examples.

Same BFS behavior whenever referenced.

Violations of consistency should be corrected immediately.

10. VERSIONING / CHANGES
If the assistant modifies the architecture:

It must state why and update this file if necessary.

It must ensure backward compatibility unless the user explicitly approves breaking changes.

END OF RULES
yaml
Copy code

---

If you want, I can also generate:

- A stricter “linting” version of this
- A version that enforces commit message conventions (“conventional commits”)
- A version tuned for Cursor’s “agent mode” with step-by-step behavioral constraints

Just tell me!