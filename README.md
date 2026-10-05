# Tarra

Research prototype for landslide monitoring. It shows how public rainfall, elevation, a small landslide catalog, and NASA browse imagery can be put on one map, scored with a visible heuristic, and turned into a **prototype alert**.

Tarra is not a certified warning system. A score is not a forecast, and a prototype alert is not an evacuation order.

> Tarra is a research prototype. Risk estimates are based on available data and models and should not be used as the sole basis for emergency or evacuation decisions.

The project brief (Priyanka Lamsal, “Tarra — for a safer nation”) describes the gap this is aimed at: hazard maps are updated rarely, while satellite imagery is collected every few days and is free to use. The brief’s detection path is a CNN, with ResNet and DenseNet named as deeper variants. This repository is the first runnable slice of that idea. The model weights are not included.

## What it does

1. Open a full-screen OpenStreetMap.
2. Search a place, click the map, or type a latitude and longitude.
3. Choose **Demo Data** or **Live Data**. The two are never mixed: every value is labelled.
4. Read a heuristic risk score (0–100), the factors that produced it, and a prototype alert if the score reaches 60.
5. Open before/after imagery. Live mode requests MODIS tiles. Demo mode shows drawings that say they are drawings.
6. Read the detection pipeline. Stages that did not run are marked **Not run**. No confidence number is invented.

Demo mode works with no network calls to data providers. It only talks to this app’s own API routes.

## Architecture

```
app/            pages and API routes
components/     map, analysis panel, imagery, pipeline, alerts
lib/            scoring helpers, tiles, formatting, alert text
services/       one module per outside concern
data/           sample catalog, source list, pipeline copy
types/          shared interfaces
public/demo/    illustrative drawings, not satellite images
```

| Service | File | Live behaviour | If the source is down |
| --- | --- | --- | --- |
| Rainfall | `services/rainfall.ts` | Open-Meteo daily precipitation, last 7 days plus today | “Data unavailable”. Nothing is copied from the demo. |
| Terrain | `services/terrain.ts` | Five Copernicus DEM samples via Open-Meteo. Slope is the steepest ~500 m rise. | “Data unavailable”. Slope is not guessed. |
| Landslide records | `services/landslide-records.ts` | Local sample of published events | Always available. It is a sample, not an inventory. |
| Satellite | `services/satellite.ts` | NASA GIBS MODIS Terra true color, proxied by `/api/satellite/tile` | Imagery page says “Data unavailable”. |
| Risk | `services/risk.ts` | Weighted heuristic | No score if both rainfall and slope are missing. |
| Inference | `services/inference.ts` | POST `TARRA_MODEL_URL` if set | Otherwise “Prototype / Simulated Detection” and a null probability. |
| Geocode | `services/geocode.ts` | Nominatim, plus the sample catalog | Catalog names still match. |

`services/analyze.ts` is the only place that decides demo versus live. `rainfallForMode` and `terrainForMode` return the live payload unchanged when mode is `live`, even if a demo scenario exists for that point.

### Risk score

Weights, in `services/risk.ts`:

- recent rainfall 0.50
- slope 0.35
- distance to the nearest **sample-catalog** event 0.15

If rainfall or slope is missing, that factor is dropped and the remaining weights are rescaled. The catalog alone cannot produce a score. Satellite change has weight 0 until a real change metric exists. Model confidence is never an input.

Levels: under 35 low, 35–59 moderate, 60–79 high, 80 and above critical. A prototype local alert and a prototype regional alert are stored in the browser when the score is 60 or higher. Nothing is emailed or sent to an authority.

Replace the whole calculation by editing `assessRisk`. Callers already pass plain numbers and an origin tag. Origins `simulated` and `unavailable` are ignored even if a number is attached, so a mock cannot leak into the score.

### API

- `GET /api/analyze?lat=&lon=&mode=demo|live&label=`
- `GET /api/geocode?q=`
- `GET /api/satellite/tile?date=YYYY-MM-DD&z=&x=&y=` (zoom 0–9, NASA GIBS only)
- `GET /api/health`

## Data sources

Live in this build:

- [OpenStreetMap](https://www.openstreetmap.org/copyright) raster tiles. © OpenStreetMap contributors, ODbL. Public tile servers are for light use. Host your own tiles before any real deployment.
- [Nominatim](https://operations.osmfoundation.org/policies/nominatim/) for place search. The app sends one request at a time and identifies itself.
- [Open-Meteo](https://open-meteo.com/) daily precipitation. Weather data by Open-Meteo.com.
- Copernicus DEM GLO-90 elevation, through the [Open-Meteo elevation API](https://open-meteo.com/en/docs/elevation-api).
- [NASA GIBS](https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/global-imagery-browse-services-gibs) MODIS Terra corrected reflectance (true color). About 250 m. A single slope failure can be invisible.

Named in the brief, **not queried**:

- [Google Earth Engine](https://earthengine.google.com/)
- [Sentinel-1](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1) and [Sentinel-2](https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2) via the [Copernicus Data Space](https://dataspace.copernicus.eu/)
- [USGS Landslide Hazards](https://www.usgs.gov/programs/landslide-hazards) and [Landsat](https://www.usgs.gov/landsat-missions)
- [GLIMS](https://www.glims.org/) (glacier outlines, not a landslide inventory)
- [ISRO / NRSC Landslide Atlas of India](https://www.isro.gov.in/media_isro/pdf/LandslideAtlas_new_2023.pdf) (about 80,000 mapped landslides, 1998–2022)

The sample catalog cites, and does not scrape:

- Geological Survey of India, Mundakkai–Chooralmala first information report, 30 July 2024, for the Wayanad coordinate and the 1,544 m source elevation. Portal: [Bhusanket](https://bhusanket.gsi.gov.in/).
- [ICL Sunkoshi / Jure report](https://www.landslides.org/report/sunkoshi-landslide/), 2 August 2014.
- Public accounts of the 7 February 2021 Chamoli rock and ice avalanche (coordinate is approximate).
- Public reports of the 6 August 2020 Pettimudi landslide (coordinate is approximate, about a kilometre).
- Bengaluru is a plains **reference**, not a landslide.

The brief’s figures — 12.6% of India’s land area, about 80,000 mapped landslides, and 298 lives with 578 mm in 48 hours at Wayanad — are shown on the sources page as **brief context**. Other public reports give different Wayanad casualty totals because they were written at different times. Tarra does not reconcile them. The 578 mm figure is used only in the Wayanad **demo** scenario and is labelled as a brief figure. Live mode requests Open-Meteo instead.

Coloured boxes on the map are demo-scenario extents. They are not official hazard boundaries.

The source deck includes one slide about Japanese seismic building types (Taishin, Seishin, Menshin). That slide is not part of this landslide prototype.

## Run locally

Node.js 20 or newer.

```bash
cd Tarraa/Tarra
npm install
npm test
npm run dev
```

Open http://localhost:3000. The app starts in **Demo Data** on the Wayanad sample so the map, score, and alert path work before any external API is called. Switch to **Live Data** to request rainfall, elevation, and MODIS links for the same point.

```bash
npm run build
npm start
```

### Environment variables

None are required. See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `TARRA_USER_AGENT` | User-Agent for Nominatim, Open-Meteo, and NASA GIBS. |
| `OPEN_METEO_FORECAST_URL` | Override the forecast endpoint. |
| `OPEN_METEO_ELEVATION_URL` | Override the elevation endpoint. |
| `NOMINATIM_URL` | Override Nominatim. |
| `TARRA_MODEL_URL` | Optional detection model. Leave unset until a real model is running. |

## Replace demo data with live APIs

The monitor’s **Live Data** control already does this for rainfall, slope, geocoding, the base map, and MODIS browse. To add another archive:

1. Add a function next to the matching file in `services/`.
2. Return the shared type in `types/index.ts` with `origin: "live"` only when the response is actually usable.
3. On failure, return `origin: "unavailable"` and a null value. Do not fall back to a demo number inside live mode.
4. Point `analyzeLocation` at the new function. `rainfallForMode("live", …)` shows the pattern: the scenario is ignored.

Sentinel-1 / Sentinel-2 and Google Earth Engine need accounts. Put that client behind `services/satellite.ts` and keep the NASA path as the fallback that says when it failed. Do not draw a demo scar on top of a failed live request.

## Connect a model later

`services/inference.ts` posts to `TARRA_MODEL_URL` when it is set.

```http
POST /infer
Content-Type: application/json

{ "lat": 11.46, "lon": 76.13, "sensor": "MODIS Terra…", "beforeDate": "2026-09-09", "afterDate": "2026-09-25" }
```

Response:

```json
{ "probability": 0.42, "label": "possible scar", "model": "resnet50-landslide" }
```

`probability` must be a number from 0 to 1. Anything else, including a timeout, is shown as **Data unavailable**. The UI then drops the “Prototype / Simulated Detection” banner and shows the returned percent. The heuristic score does **not** absorb that percent. If you later want it as a factor, add a weight in `services/risk.ts` on purpose.

A CNN, ResNet, or DenseNet service should do its own cropping, normalisation, and false-positive filtering. Those steps stay “Not run” inside Tarra until that service exists. This prototype does not ship weights, and the simulated branch does not emit a confidence score.

Suggested training inputs, when you have them: Sentinel-2 chips, or the public landslide inventories the brief names. That training set is not in this repository.

## Checks

`npm test` covers the heuristic, the demo scenarios, the rule that live mode ignores demo rainfall, the rule that a simulated number cannot enter the score, alert thresholds, and tile-request validation. It does not call the network.

After `npm start`, useful manual checks:

```bash
curl -s "http://localhost:3000/api/analyze?lat=11.462778&lon=76.134167&mode=demo"
curl -s "http://localhost:3000/api/analyze?lat=11.462778&lon=76.134167&mode=live"
curl -s "http://localhost:3000/api/geocode?q=Wayanad"
curl -s "http://localhost:3000/api/health"
```

The live Wayanad rainfall must come from Open-Meteo (or say data unavailable). It must not repeat 578 mm unless the service itself reports that, which would be an extreme day and would still be labelled live.

## Limitations

- No trained detector. “AI-powered” is the brief’s description of the intended system, not a claim about this build.
- The score is a documented heuristic. It is not validated against a landslide inventory and must not be used to move people.
- MODIS cannot confirm a village-scale failure. The difference image is an absolute pixel change, so clouds and seasons dominate. It is not a landslide mask.
- Sentinel radar, which would help under monsoon cloud, is not connected.
- Slope uses ~500 m samples of a 90 m DEM. It misses smaller gullies and can disagree with a field measurement. The Wayanad demo leaves slope blank rather than invent one; the cited 1,544 m elevation is displayed and is not turned into a slope.
- The catalog has five sites. “No nearby record” means “not in this file”.
- Alerts live in `localStorage`. Clearing site data clears them. There is no SMS, email, or agency feed.
- OpenStreetMap’s public tile server and Nominatim are not a production basemap. Follow their usage policies.
- The brief’s casualty and rainfall figures are quoted, not re-measured.

## Attribution and license

Application code is [MIT](LICENSE). Data is not covered by that license.

- Map data © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).
- Weather data by [Open-Meteo.com](https://open-meteo.com/), drawn from national and ECMWF models under their own terms.
- Elevation: Copernicus DEM GLO-90 via Open-Meteo.
- Imagery: NASA GIBS / MODIS Terra. Follow [NASA Earthdata](https://www.earthdata.nasa.gov/) use guidance.
- Copernicus Sentinel data, if you add it later, stays under the Copernicus data policy.
- Sample-catalog citations stay with GSI, ICL, and the other reports named on the sources page.

Do not present Tarra’s output as an official product of NASA, ESA, USGS, ISRO, GSI, or OpenStreetMap.
