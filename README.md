# FLIGHTWATCH 3D

Real-time global flight tracker visualised on a rotatable 3D Earth.  
Built with React + Vite + Three.js (react-three-fiber) + Zustand.

---

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:5173** — the globe appears immediately; aircraft
populate within ~5 seconds once OpenSky responds.

---

## Project Structure

```
src/
├── api/
│   └── opensky.js          OpenSky HTTP client (timeout, rate-limit handling)
├── components/
│   ├── canvas/
│   │   ├── Earth.jsx        Textured globe + atmosphere layers (Suspense)
│   │   ├── Planes.jsx       InstancedMesh for 600 aircraft (1 draw call)
│   │   └── Scene.jsx        Canvas, lighting, stars, OrbitControls, Bloom
│   └── ui/
│       ├── Header.jsx        Top bar: brand + live status
│       ├── StatsBar.jsx      Aircraft / airborne / country counts
│       ├── SearchFilter.jsx  Left panel: filter by callsign/country
│       ├── InfoCard.jsx      Right panel: selected aircraft details
│       ├── AltitudeLegend.jsx Bottom-left colour key
│       ├── ControlsHint.jsx  Bottom-right interaction cheatsheet
│       └── LoadingOverlay.jsx Splash screen while first data loads
├── hooks/
│   └── useFlightData.js     Polling loop (12 s interval)
├── store/
│   └── flightStore.js       Zustand store: flights, selection, search
├── utils/
│   ├── geo.js               latLonAlt → Three.js XYZ (UV-aligned)
│   └── colors.js            Altitude bands, formatters
```

---

## Key Design Decisions

### Coordinate System
`geo.js` derives the mapping from Three.js `SphereGeometry`'s internal UV
layout so plane positions are pixel-perfect on the texture:

```
x =  r · cos(lat) · cos(lon)   // prime meridian (+lon=0) → +X
y =  r · sin(lat)               // north pole → +Y
z = −r · cos(lat) · sin(lon)   // 90°W → +Z (default camera direction)
```

### Smooth Interpolation
Every 12 s a new snapshot arrives from OpenSky.  The store saves
`prevLat / prevLon / prevAlt` alongside the new values.  Each frame,
`Planes.jsx` reads both and computes an ease-in-out lerp over 10 s,
so planes glide continuously rather than teleporting.

### Instanced Rendering
All aircraft share a single `instancedMesh` with per-instance matrices
and `vertexColors`.  This keeps the GPU draw call count at **1** regardless
of aircraft count, enabling smooth 60 fps even at 600 simultaneous planes.

### Zustand + useFrame Pattern
State reads inside `useFrame` use `useFlightStore.getState()` (not the hook)
to avoid subscribing the component to React re-renders every tick.  React
re-renders are only triggered for UI panels that actually need them.

### OpenSky Proxy
The Vite dev server proxies `/api/opensky/*` → `https://opensky-network.org/api/*`
to work around browser CORS restrictions.  For production you'll need a
real backend proxy (Nginx, Cloudflare Worker, etc.).

---

## API Notes

- **Anonymous rate limit**: ~1 request per 10 seconds globally.  
  The app polls at 12 s to stay safely under the limit.
- **Data latency**: OpenSky states can be up to 60 s stale.
- **Max planes**: The client caps at 600 to keep GPU memory bounded.
- **No credentials required**: anonymous access works out of the box.

---

## Texture

Earth texture is streamed at runtime from:  
`https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg`

No local files needed.  A solid-colour fallback sphere renders instantly
while the texture loads over the network.

---

## Production Build

```bash
npm run build   # outputs to dist/
npm run preview # local preview of production bundle
```

For production deployment you must add a server-side proxy that forwards
OpenSky requests (the Vite dev proxy is not included in the build).

---

## Aesthetic: Neobrutalism × Minimalism

- **Font**: Space Mono (monospace, technical character)
- **Borders**: 2px solid white/60% + 3px hard offset shadow
- **Palette**: near-black background · white text · `#FFE500` accent
- **Altitude encoding**: green → yellow → orange → sky-blue
- **All caps** labels, tabular numerals, tight tracking
