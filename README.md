# Strata — Industrial Drilling Pattern Visualiser

An interactive 3D web application for designing, visualising, and simulating industrial drilling patterns and blast sequences.

---

## Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | React 18 · Vite · Three.js · Tailwind CSS    |
| Backend    | Node.js · Express · Apollo Server (GraphQL)  |
| Database   | PostgreSQL · Prisma ORM                      |
| Language   | TypeScript throughout                        |

---

## Project Structure

```
strata/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # UI components (Sidebar, PatternManager, …)
│       ├── graphql/         # GQL queries & mutations
│       ├── hooks/           # useStrataScene — all Three.js logic
│       └── types/           # Shared TypeScript interfaces
└── server/
    ├── prisma/              # Prisma schema & migrations
    └── src/                 # index.ts · schema.ts · resolvers.ts
```

---

## Setup

### Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally (or a connection URL to a hosted instance)

---

### 1 — Install all dependencies (from repo root)

```bash
npm install          # installs concurrently at the root
npm run install:all  # installs server/ and client/ packages
```

---

### 2 — Configure the database

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/strata"
PORT=4000
```

Run migrations to create the tables:

```bash
cd server
npx prisma migrate dev --name init
cd ..
```

---

### 3 — Start both servers (from repo root)

```bash
npm run dev
# SERVER → http://localhost:4000/graphql
# CLIENT → http://localhost:5173
```

Both processes run in the same terminal with colour-coded prefixes (`SERVER` / `CLIENT`).

---

## Features

### Pattern Manager (sidebar)
- List all saved patterns, each showing hole count
- **+** button opens a modal to name and describe a new pattern
- Click any pattern to load it into the 3D scene
- Hover a pattern row → **✕** button appears to delete it (with confirmation)

### 3D Scene (main canvas)
- **20 × 20 unit terrain** rendered as a `GridHelper` with a dark slate colour
- **OrbitControls** — left-drag to orbit, right-drag to pan, scroll to zoom
- Each drill hole is a vertical **CylinderGeometry**, top flush with the terrain surface
- Holes are coloured on a **blue → red gradient** based on sequence order (blue = earliest, red = latest)
- **CSS2D labels** show each hole's sequence number; they stay crisp at any zoom level

### Hole Placement
- With a pattern active (cursor changes to crosshair), **click anywhere on the terrain** to begin placement
- A bottom panel lets you set **depth** (1–20 m slider) and **sequence number** (auto-increments)
- Confirm fires the `addDrillHole` GraphQL mutation and the scene updates immediately

### Blast Sequence Animation
- **▶ Simulate Blast** fires holes in sequence order, 400 ms apart
- Each hole flashes orange with a radial scale-up, then snaps back to its original colour
- Click again mid-animation to restart from the beginning

### Parameters Panel
- Shows **total holes**, **average depth**, and **sequence range** of the active pattern
- **✕ Clear Scene** removes all holes from the active pattern (with confirmation)

---

## Key Implementation Notes

### `useStrataScene(containerRef, pattern, onTerrainClick)`
All Three.js logic lives in this custom hook (`client/src/hooks/useStrataScene.ts`).  
It initialises the scene once on mount, re-syncs hole meshes whenever `pattern` changes, and exposes `simulateBlast()`.  The terrain plane is invisible (opacity 0, transparent material) but still raycasted so clicks register correctly.

### GraphQL Schema Extensions
`clearPatternHoles(patternId)` is a small addition to the spec — it allows the frontend to clear all holes in one round-trip instead of N separate `deleteDrillHole` calls.

### Three.js Concepts Covered
- `WebGLRenderer` · `PerspectiveCamera` · `Scene`
- `GridHelper` for the terrain grid
- `PlaneGeometry` as an invisible raycast target
- `CylinderGeometry` for drill holes
- `OrbitControls` for mouse-driven camera navigation
- `Raycaster` + NDC conversion for terrain click picking
- `CSS2DRenderer` / `CSS2DObject` for crisp 3D-projected HTML labels
- Manual GPU resource disposal (geometry + material) on pattern switch
- `requestAnimationFrame` animation loop with damping controls

---

## Scripts

| Directory | Command           | Description                    |
|-----------|-------------------|--------------------------------|
| server    | `npm run dev`     | ts-node-dev watch mode         |
| server    | `npm run build`   | Compile to `dist/`             |
| client    | `npm run dev`     | Vite dev server (HMR)          |
| client    | `npm run build`   | Type-check + production bundle |
