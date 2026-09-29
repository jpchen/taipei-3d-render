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

`wrangler.jsonc` targets the existing Cloudflare account and the custom domain `taipei.jonathanpchen.com`. No API keys or secrets are included. The repository and deployed website are public.

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

Middle-drag pans; the **Explore at street level** button moves to a nearby mapped road. Cars, buses, scooters and walking people share four instanced prototypes (at most four activity draw calls). Vehicles follow road direction and right-hand lanes; people follow mapped footways. Spatial indexing limits simulation to nearby routes. Pedestrians disappear beyond 700 m (300 m in battery saver), vehicles beyond 3 km (1.8 km in battery saver), and offscreen instances are culled. Instance updates are capped at 30 Hz / 15 Hz; walking motion runs in the vertex shader. Activity pauses in hidden tabs and respects reduced-motion preferences. Settings can disable it altogether. `npm run data:activity` regenerates route data; the additional OSM footway extract is in `assets/walkways-source.json`.

## Architecture

Six facade families distinguish plaster, glass curtain walls, ceramic tiles, brick, industrial cladding and traditional/civic buildings. Mapped building colors/materials are honored when present; other finishes are deterministic interpretations. Facade coordinates follow each actual footprint edge, including diagonal walls. Near views add balcony geometry, rooftop water tanks, HVAC units, stair enclosures and a shared shop-sign atlas. These details use seven instanced draw calls, cull by distance and visibility, and have reduced budgets in battery saver mode.

Taipei Dome, Taipei Main Station and Sun Yat-sen Memorial Hall now have separate Blender models (`assets/taipei-landmarks.blend`, `npm run models:city`) instead of generic extrusions. They are recognizable architectural interpretations, not scanned assets. [Sun Yat-sen Memorial Hall's official architectural description](https://www.yatsen.gov.tw/cp.aspx?n=6503) informs its roof form; positions and bounds follow the OSM extract. Building tile filenames include a content hash, preventing mismatched cached geometry after data regeneration.

## Place and street labels

`npm run data:labels` retains 350 landmark/park labels and 8,519 street anchors from the OSM extract. English and Chinese names appear by zoom level, with a capped DOM pool and overlap suppression. Landmark buttons fly to the selected place; street names have a separate visibility toggle. Terrain occlusion suppresses labels behind hills. Building occlusion is approximate because labels are an overlay rather than an indoor/navigation map.

## Golden-hour lighting

The warm low sun is balanced by cool sky fill and amber reflected light. Sky, haze, ambient light, reflections and window illumination transition together from afternoon through blue hour. Reflections capture the actual sky with a 70 km far plane (the sky sphere is 45 km across in radius); foliage receives its instance color once. Window emission stays restrained during daylight, and the dark interface overlay fades while exploring.

`npm run test:data` checks geometry hashes/layouts, palette diversity, bilingual label data and lighting transitions without requiring a browser. Browser tests remain `npm test`.

Facade windows use an integer number of bays fitted across each wall and floor, avoiding cropped edge windows. Residential walls add open balcony railings, green awnings and wall-mounted AC condensers on nearby visible facades. Palette additions remain restrained; this [Taipei skyline and apartment reference](https://hiking.biji.co/index.php?act=info&q=review&review_id=26200) informed the pale ceramic tile, blue-green glass and green awning choices. The photograph is a visual reference and is not redistributed.

## Shilin and park life

The seventh destination opens along mapped Dadong Road at Shilin Night Market. Forty-five instanced stalls use one sign atlas, reusable counters, colored canopies and emissive lanterns: four draw calls, with no per-stall lights. They disappear beyond 1.2 km (600 m in battery saver). The vendor names and placements are illustrative, not a current business inventory. The [Taipei tourism board](https://travel.taipei/en/attraction/details/1692) identifies Dadong and Danan roads as part of the market district. `npm run data:market` regenerates the market layout from the stored OSM road geometry; run `npm run data:activity` afterward.

People are denser on mapped park paths and market lanes, reusing the same animated person geometry. Pedestrians are capped at 1,400 instances (630 in battery saver), within the existing four activity draw calls. Market lanes exclude simulated vehicle traffic. Park tree placement leaves walking paths clear. This is lightweight procedural city life, not a crowd or traffic simulation.

Pavement is split along the actual terrain mesh triangles, eliminating buried segments caused by mismatched interpolation. Rounded joins cover road endpoints without creating extra drawing batches.

## River reflections

The river surface uses mipmapped procedural ripple normals advected over geographic coordinates. A shared 512×512 planar reflection captures the sky, terrain, buildings and landmarks at up to 8 Hz (12 Hz in high quality); small instanced details are omitted from the reflection pass. Battery saver uses an animated sky-color reflection without a second scene render. Reduced motion freezes the ripple animation. Waterway widths remain approximate where the map snapshot contains river centerlines rather than bank polygons.

## Grand Hotel and destination navigation

The eighth destination visits a dedicated Grand Hotel Blender model (`assets/grand-hotel.blend`; regenerate with `npm run models:hotel`). It replaces the generic OSM hotel extrusion at the mapped position and orientation, with 14 floors, vermilion columns, railings, decorative brackets, twin swept golden roofs and a double-eaved entrance. The exterior is an artistic interpretation based on the [hotel's official description](https://www.grand-hotel.org/EN/official/main.aspx) and [exterior reference photograph](https://www.sinko.co.jp/global_products/deliveryex/img/country/img_taiwan01.jpg). It is combined into six material batches.

The destination strip supports left- or middle-mouse dragging, native touch swipes, and keyboard activation. Drag gestures suppress accidental destination clicks; normal clicks still work. Selecting or touring a destination scrolls its button into view.

## Link previews

Open Graph and Twitter large-image metadata are in the initial HTML, so link crawlers do not need to run WebGL. The 1200×630 preview is an actual render of Taipei 101 and the surrounding buildings. Start the local server on port 5188 and run `npm run social:capture` to regenerate it, or set `CAPTURE_URL` to another running deployment.


## Bridges and elevated roads

OSM bridge, viaduct and positive-layer roads receive concrete decks, paired steel girders, guardrails, pier caps, columns and footings. Connected approach roads ramp up to the deck, and traffic follows the same elevation profile as the pavement. These are procedural structural interpretations; exact bridge engineering and surveyed deck elevations are not available in the snapshot. Rebuild both city and activity data after road-profile changes.

Structural parts share box geometry and two materials, batched by spatial cell for frustum culling. They are static instances with no per-frame simulation, and remain visible in river reflections.

## Intersection signals

`npm run data:signals` derives illustrative signal placement from mapped surface-road junctions. Nearby intersections have reusable poles, overhead arms and red/amber/green lamps, with an all-red clearance phase between crossing directions. Placement and timing are not an inventory of actual Taipei signal hardware or live traffic control; vehicles currently continue along their routes independently of the lights.

Signals use at most four drawing batches, capped at 320 visible heads (120 in battery saver), with distance and camera culling. Lamp colors update once per second without dynamic light sources; reduced motion freezes the phase.


## Landmark placement corrections

`src/landmark-sites.json` records the OSM footprint IDs, oriented bounding boxes and centers for Taipei Main Station, the Liberty Square halls and the Grand Hotel. Regenerate with `npm run data:landmarks`, then `npm run data:prepare`. Custom landmarks replace their mapped generic building (including contained duplicates), rather than removing surrounding city blocks. Station canopies and untagged service structures receive restrained heights, and the existing Blender station asset is fitted to a 156 × 127 m envelope at the mapped rotation.

The theater and concert hall are individually placed along the square's shared axis with their front stairs facing one another. Their geometry is merged into three material batches each. The memorial's duplicate generic building is removed and its entrance stair faces the plaza. Reference layout: [CKS Memorial Hall site map, page 14](https://tame.tw/pme36/PME36-booklet.pdf), [NTCH aerial photograph](https://npac-ntch.org/tender-and-announcement/announcement/10942-%E5%9C%8B%E5%AE%B6%E6%88%B2%E5%8A%87%E9%99%A2%E7%94%9F%E6%B4%BB%E5%BB%A3%E5%A0%B4%E6%B0%B4%E6%99%AF%E8%A8%AD%E6%96%BD%E5%99%B4%E6%B0%B4%E6%99%82%E9%96%93%E8%AA%AA%E6%98%8E), and [station satellite reference](https://www.mobile01.com/topicdetail.php?f=37&p=2&t=1534217). Coordinates come from the stored OSM snapshot; the geometry remains an architectural interpretation.

The Grand Hotel adds an exterior staircase with 84 steps, six landings, balustrades and an arrival connection to an open ceremonial gate replacing the generic solid gate extrusion. It shares the hotel's orientation, adapts to the terrain and adds one static drawing batch. Dimensions and step count are illustrative, guided by the [hotel's exterior reference](https://www.grand-hotel.org/KR/official/about.aspx?gh=TP) and [entrance photographs](https://capturedbymark.wordpress.com/2012/09/20/the-grand-hotel-a-taipei-gem/), not a survey. Existing Blender assets remain unchanged; these site corrections are applied in Three.js.

`npm run preview:landmarks` produces offline CPU geometry previews against OSM outlines in `test-results/`; these verify layout without a browser, and are not screenshots of the full lighting/material pipeline. `npm run test:data` also verifies landmark model loading, facing directions, bounds, duplicate exclusions and staircase terrain clearance.


## Social destinations

Ximending / Red House adds a mapped, low-rise Red House model, café seating, parasols, wayfinding signs, small stalls and an illustrative street performer. Pedestrians reuse the existing city-life pool on OSM walking routes. Props share geometry in instanced batches and disappear beyond 1.3 km (650 m in battery saver); no per-prop light sources are added. Businesses, performers and furnishings are illustrative rather than a live inventory. [Taipei Travel's Red House reference](https://www.travel.taipei/en/attraction/details/503) informs the destination.

`src/social-places.json` defines these destinations. Run `npm run data:places` and `npm run data:activity` after changing them. `assets/places` contains supplementary OSM extracts, fetched by `npm run data:places:fetch`; existing snapshots remain available for reproducible offline builds.

Dadaocheng Wharf replaces the generic PIER5 food-court extrusion with small container kiosks positioned within its mapped footprint, outdoor tables, overhead festoon lights, bicycles and promenade walkers. The [city's Dadaocheng waterfront reference](https://travel.taipei/file/4037/) informs its atmosphere; individual vendors are illustrative.

Huashan 1914 preserves the mapped winery buildings, corrects untagged warehouse heights, and fills nearby pedestrian courtyards with illustrative maker stalls, shared art sculptures, parasols and visitors. The [park's visitor guide](https://www.huashan1914.com/en-US/Tour) describes the outdoor public spaces.


Taipei Zoo extends the mapped city with zoo paths, low-rise buildings and wooded grounds. Four Blender animal assets provide 26 animated giraffes, zebras, elephants and flamingos at mapped animal points. Habitat outlines and animal counts are illustrative, not surveyed enclosures or a current inventory. Reference: [Taipei Zoo visitor map](https://english.zoo.gov.taipei/News_Content.aspx?n=9129E819DD99D6B4&s=63180DDF6A3C4C61&sms=F6417076988132FF). Click animal labels to visit each habitat.

Animals share one instanced drawing batch per species, update at 20 Hz (10 Hz in battery saver), and are culled by distance and camera view. Reduced motion freezes movement; the activity toggle hides animals along with city life. The four GLBs total approximately 735 KB. Regenerate with `npm run models:zoo` and `npm run data:zoo`; refresh paths and buildings with `npm run data:places`, `npm run data:activity`, then `npm run data:prepare`. The editable source is `assets/zoo-animals.blend`.

The Dadaocheng waterfront uses OSM Tamsui water relation 4010571, including island holes, to meet the mapped promenade. `node scripts/prepare-riverbank.mjs` refreshes its stored rings (or accepts a local OSM relation JSON as its first argument); follow with `npm run data:prepare`. It shares the existing river reflection pass.
