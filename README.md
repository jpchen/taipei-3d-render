# Taipei at dusk

An explorable Three.js city at sunset, deployed to **https://taipei.jonathanpchen.com** using Cloudflare Workers Static Assets. The Taipei 101 asset is authored in Blender; its editable `.blend` and reproducible generation script are included.

## Run locally

Use Node 22.12 or newer (`nvm use`).

```sh
npm ci
npm run dev
```

Drag to orbit, right-drag to pan, and scroll to zoom. Touch supports orbit and two-finger pan/pinch. WASD pans, Q/E changes altitude, Shift accelerates, and R resets the view. Select a landmark or start the six-stop scenic tour. Sound is opt-in because browsers require a user gesture to start audio.

## Build and deploy

```sh
npm run build
npx wrangler login
npm run deploy
```

`wrangler.jsonc` targets the existing Cloudflare account and the custom domain `taipei.jonathanpchen.com`. No API keys or secrets are included. The repository is private; the deployed website is public.

## Data and asset pipeline

Committed generated data makes the deployed app independent of live mapping services. Initial city geometry is approximately 15 MB compressed, plus terrain, road data and the landmark.

```sh
npm run data:map       # Fetch OSM footprints, roads, parks and waterways
npm run data:terrain   # Fetch Mapzen/AWS Terrarium terrain tiles
npm run data:prepare   # Triangulate and gzip 138 building tiles
npm run models        # Generate .blend and export Taipei 101 to .glb
```

The map bounds are 25.005–25.105° N and 121.475–121.615° E. Terrain extends beyond the city to the surrounding mountains. Coordinates use a local approximation centered on 121.54° E, 25.05° N, with meters as world units and north along negative Z.

The model includes 64,603 buildings, of which 27,095 have mapped height or level values. Remaining heights are deterministic estimates. Footprints and street alignments are real map features. Heights, procedural facades, roof details, trees, the interpretive Memorial Hall and the Blender landmark are not survey-grade reconstruction. Terrain is sampled to a 385×385 grid and lowered by 12 m to place the basin near scene zero. Some river outlines and multipolygon buildings are simplified or absent because this pipeline uses OSM ways. The soundscape is synthesized wind, traffic and birds; it is not a field recording. Free navigation is aerial and does not provide building collision detection.

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
