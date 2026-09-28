# Taipei at dusk

An explorable Three.js city at sunset, deployed to **https://taipei.jonathanpchen.com** using Cloudflare Workers Static Assets. The Taipei 101 asset is authored in Blender; its editable `.blend` and reproducible generation script are included.

## Run locally

Use Node 22.12 or newer (`nvm use`).

```sh
npm ci
npm run dev
```

Drag to orbit, middle-drag or right-drag to pan, and scroll to zoom. Touch supports orbit and two-finger pan/pinch. WASD pans, Q/E changes altitude, Shift accelerates, and R resets the view. Select a landmark or start the six-stop scenic tour. Sound is opt-in because browsers require a user gesture to start audio.

## Build and deploy

```sh
npm run build
npx wrangler login
npm run deploy
```

`wrangler.jsonc` targets the existing Cloudflare account and the custom domain `taipei.jonathanpchen.com`. No API keys or secrets are included. The repository is private; the deployed website is public.

## Data and asset pipeline

Committed generated data makes the deployed app independent of live mapping services. Initial city geometry is approximately 22 MB compressed, plus terrain, road data and the landmark.

```sh
npm run data:map       # Fetch OSM footprints, roads, parks and waterways
npm run data:terrain   # Fetch Mapzen/AWS Terrarium terrain tiles
npm run data:prepare   # Triangulate and gzip 138 building tiles
npm run models        # Generate .blend and export Taipei 101 to .glb
```

The map bounds are 25.005–25.105° N and 121.475–121.615° E. Terrain extends beyond the city to the surrounding mountains. Coordinates use a local approximation centered on 121.54° E, 25.05° N, with meters as world units and north along negative Z.

The model includes 64,280 extruded buildings, of which 26,947 have mapped height or level values. Remaining heights are deterministic estimates. Footprints and street alignments are real map features. Heights, procedural facades, roof details, trees, the interpretive Memorial Hall and the Blender landmark are not survey-grade reconstruction. Terrain is sampled to a 385×385 grid and lowered by 12 m to place the basin near scene zero. Underground-only structures are excluded. Some river outlines and multipolygon buildings are simplified or absent because this pipeline uses OSM ways. The soundscape is synthesized wind, traffic and birds; it is not a field recording. Free navigation is aerial and does not provide building collision detection.

Rendering uses batched indexed building geometry, GPU facade shading, instanced trees and traffic, atmospheric sky, physically based materials, shadow mapping, subtle bloom and filmic tone mapping. Battery saver reduces resolution and disables bloom and shadows.

## Validation

```sh
npm test                            # Uses installed Google Chrome
# Or: npx playwright install chromium
# PLAYWRIGHT_CHANNEL=chromium npm test
```

Browser tests check successful WebGL loading, viewpoint movement, orbit and keyboard controls, audio activation, lighting and labels, tour behavior, credits and mobile layout.

## Credits and licenses

- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). `assets/map-source.json` is the source extract; `public/data/city.json` and building tiles are the derived database and retain ODbL terms. These data rights are independent of repository visibility.
- Terrain: [Mapzen Terrain Tiles on AWS](https://registry.opendata.aws/terrain-tiles/), accessed 2026-09-27. Global GMTED2010 and SRTM data courtesy of the U.S. Geological Survey; global ETOPO1 data from NOAA. [Full provider attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
- Three.js: MIT. Blender-generated landmark geometry and the sound synthesis code are original to this project.
- DM Sans and Manrope: SIL Open Font License, served through Google Fonts with system fallbacks.

## Street activity

Middle-drag pans; the **Explore at street level** button moves to a nearby mapped road. Cars, buses, scooters and walking people share four instanced prototypes (at most four activity draw calls). Vehicles follow road direction and right-hand lanes; people follow mapped footways. Spatial indexing limits simulation to nearby routes. Pedestrians disappear beyond 520 m (230 m in battery saver), vehicles beyond 3 km (1.8 km in battery saver), and offscreen instances are culled. Instance updates are capped at 30 Hz / 15 Hz; walking motion runs in the vertex shader. Activity pauses in hidden tabs and respects reduced-motion preferences. Settings can disable it altogether. `npm run data:activity` regenerates route data; the additional OSM footway extract is in `assets/walkways-source.json`.

## Architecture

Six facade families distinguish plaster, glass curtain walls, ceramic tiles, brick, industrial cladding and traditional/civic buildings. Mapped building colors/materials are honored when present; other finishes are deterministic interpretations. Facade coordinates follow each actual footprint edge, including diagonal walls. Near views add balcony geometry, rooftop water tanks, HVAC units, stair enclosures and a shared shop-sign atlas. These details use five instanced draw calls, cull by distance and visibility, and have reduced budgets in battery saver mode.

Taipei Dome, Taipei Main Station and Sun Yat-sen Memorial Hall now have separate Blender models (`assets/taipei-landmarks.blend`, `npm run models:city`) instead of generic extrusions. They are recognizable architectural interpretations, not scanned assets. [Sun Yat-sen Memorial Hall's official architectural description](https://www.yatsen.gov.tw/cp.aspx?n=6503) informs its roof form; positions and bounds follow the OSM extract. Building tile filenames include a content hash, preventing mismatched cached geometry after data regeneration.

## Place and street labels

`npm run data:labels` retains 350 landmark/park labels and 8,519 street anchors from the OSM extract. English and Chinese names appear by zoom level, with a capped DOM pool and overlap suppression. Landmark buttons fly to the selected place; street names have a separate visibility toggle. Terrain occlusion suppresses labels behind hills. Building occlusion is approximate because labels are an overlay rather than an indoor/navigation map.
