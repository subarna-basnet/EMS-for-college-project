export interface CatalogSite {
  id: string;
  shortName: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  occurredOn: string | null;
  kind: "event" | "reference";
  summary: string;
  citation: string;
  citationUrl: string;
  /** Half-width of the illustrative sample box, in degrees. Not an official boundary. */
  box: { dLat: number; dLon: number };
}

export interface DemoScenario {
  siteId: string;
  rainfall48hMm: number | null;
  rainfall7dMm: number | null;
  rainfallDetail: string;
  slopeDeg: number | null;
  slopeDetail: string;
  elevationM: number | null;
  elevationDetail: string;
}

export const CATALOG: CatalogSite[] = [
  {
    id: "wayanad-2024",
    shortName: "Wayanad",
    name: "Mundakkai–Chooralmala, Wayanad",
    region: "Wayanad, Kerala",
    country: "India",
    lat: 11.462778,
    lon: 76.134167,
    occurredOn: "2024-07-30",
    kind: "event",
    summary:
      "Rainfall-triggered landslides and debris flow around Mundakkai, Chooralmala, and nearby wards on 30 July 2024. The project brief states 298 lives lost and 578 mm of rain in 48 hours. Other public reports, written at different times, give different casualty figures. Tarra does not reconcile them.",
    citation:
      "Location and 1,544 m source elevation: Geological Survey of India first information report, 30 July 2024. Rainfall and casualty figures used in the demo: Tarra project brief.",
    citationUrl: "https://bhusanket.gsi.gov.in/",
    box: { dLat: 0.18, dLon: 0.18 },
  },
  {
    id: "jure-2014",
    shortName: "Jure",
    name: "Jure (Sunkoshi) landslide",
    region: "Sindhupalchok",
    country: "Nepal",
    lat: 27.770733,
    lon: 85.868467,
    occurredOn: "2014-08-02",
    kind: "event",
    summary:
      "The 2 August 2014 Jure landslide blocked the Sunkoshi. The International Consortium on Landslides report lists 156 deaths. This is the sample behind the project brief's Nepal before/after example. Coordinates are the catalog point, not a mapped scar outline.",
    citation:
      "International Consortium on Landslides, Sunkoshi landslide report (27°46′14.64″ N, 85°52′6.48″ E).",
    citationUrl: "https://www.landslides.org/report/sunkoshi-landslide/",
    box: { dLat: 0.16, dLon: 0.16 },
  },
  {
    id: "chamoli-2021",
    shortName: "Chamoli",
    name: "Chamoli rock and ice avalanche",
    region: "Chamoli, Uttarakhand",
    country: "India",
    lat: 30.376,
    lon: 79.732,
    occurredOn: "2021-02-07",
    kind: "event",
    summary:
      "The 7 February 2021 Ronti Peak rock and ice avalanche, which became a debris flow in the Rishiganga and Dhauliganga valleys. Included because the brief cites high-mountain hazards and GLIMS. The coordinate is an approximate source area, not a surveyed outline, and this was not a typical rainfall landslide.",
    citation:
      "Public scientific accounts of the 7 February 2021 Chamoli disaster. GLIMS is listed in the brief for ice context and is not queried here.",
    citationUrl: "https://earthobservatory.nasa.gov/",
    box: { dLat: 0.2, dLon: 0.2 },
  },
  {
    id: "pettimudi-2020",
    shortName: "Pettimudi",
    name: "Pettimudi landslide",
    region: "Idukki, Kerala",
    country: "India",
    lat: 10.171,
    lon: 77.011,
    occurredOn: "2020-08-06",
    kind: "event",
    summary:
      "The 6 August 2020 landslide at Pettimudi, near Munnar, destroyed workers' housing. The coordinate is approximate to about a kilometre. Included as a second Western Ghats sample, not a full account.",
    citation: "Public reports of the 6 August 2020 Pettimudi landslide, Idukki.",
    citationUrl: "https://www.gsi.gov.in/",
    box: { dLat: 0.16, dLon: 0.16 },
  },
  {
    id: "bengaluru-reference",
    shortName: "Bengaluru",
    name: "Bengaluru reference site",
    region: "Bengaluru, Karnataka",
    country: "India",
    lat: 12.9716,
    lon: 77.5946,
    occurredOn: null,
    kind: "reference",
    summary:
      "A city-centre reference on the Deccan plateau, used so the demo has a low-relief contrast. It is not a landslide record.",
    citation: "Coordinate is a conventional city-centre point. Not a hazard location.",
    citationUrl: "https://www.openstreetmap.org/",
    box: { dLat: 0.16, dLon: 0.16 },
  },
];

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    siteId: "wayanad-2024",
    rainfall48hMm: 578,
    rainfall7dMm: null,
    rainfallDetail:
      "Project brief figure: 578 mm in 48 hours for 30 July 2024. Tarra did not measure it. The seven-day total is not in the brief, so it is left blank. Live mode does not reuse this number.",
    slopeDeg: null,
    slopeDetail:
      "Data unavailable. The cited GSI note gives a source elevation, not a slope in degrees. No slope was invented for the score.",
    elevationM: 1544,
    elevationDetail:
      "Cited figure: GSI first information report describes the probable Mundakkai source elevation as 1,544 m. This is not an elevation-service reading.",
  },
  {
    siteId: "jure-2014",
    rainfall48hMm: null,
    rainfall7dMm: null,
    rainfallDetail:
      "Data unavailable. Tarra does not have a rainfall figure for 2 August 2014 that it is willing to treat as a measurement, so the demo leaves rainfall blank.",
    slopeDeg: 35,
    slopeDetail:
      "Demo data. Illustrative 35° slope so the offline scenario can run. Not a surveyed slope.",
    elevationM: null,
    elevationDetail: "Data unavailable. No elevation was invented for this sample.",
  },
  {
    siteId: "chamoli-2021",
    rainfall48hMm: null,
    rainfall7dMm: null,
    rainfallDetail:
      "Data unavailable. The February 2021 event was a rock and ice avalanche. No rainfall total is inserted.",
    slopeDeg: 45,
    slopeDetail:
      "Demo data. Illustrative 45° high-mountain slope for the offline scenario. Not a surveyed slope.",
    elevationM: null,
    elevationDetail: "Data unavailable. No elevation was invented for this sample.",
  },
  {
    siteId: "pettimudi-2020",
    rainfall48hMm: null,
    rainfall7dMm: null,
    rainfallDetail:
      "Data unavailable. No rainfall total for 6 August 2020 is included in this prototype.",
    slopeDeg: 30,
    slopeDetail:
      "Demo data. Illustrative 30° slope for the offline scenario. Not a surveyed slope.",
    elevationM: null,
    elevationDetail: "Data unavailable. No elevation was invented for this sample.",
  },
  {
    siteId: "bengaluru-reference",
    rainfall48hMm: 8,
    rainfall7dMm: 22,
    rainfallDetail:
      "Demo data. Round illustrative totals for an offline plains reference (8 mm over two days, 22 mm over seven). Not observations.",
    slopeDeg: 2,
    slopeDetail:
      "Demo data. Illustrative 2° slope for the offline reference. Not a surveyed slope.",
    elevationM: 920,
    elevationDetail:
      "Demo data. Illustrative 920 m for the Bengaluru plateau. Live mode replaces this with the elevation service.",
  },
];

export const DEFAULT_SITE_ID = "wayanad-2024";

export function siteById(id: string): CatalogSite | undefined {
  return CATALOG.find((site) => site.id === id);
}

export function scenarioById(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((scenario) => scenario.siteId === id);
}
