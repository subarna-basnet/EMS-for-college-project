export interface SourceEntry {
  id: string;
  name: string;
  url: string;
  extraUrl?: { label: string; url: string };
  role: string;
  inThisMvp: string;
  attribution: string;
}

export const SOURCES: SourceEntry[] = [
  {
    id: "nasa",
    name: "NASA Earthdata and GIBS",
    url: "https://www.earthdata.nasa.gov/",
    extraUrl: {
      label: "Global Imagery Browse Services",
      url: "https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/global-imagery-browse-services-gibs",
    },
    role: "True-color browse imagery from MODIS Terra corrected reflectance, used as a before/after pair and as an optional map layer.",
    inThisMvp:
      "Live. Tiles are requested from NASA GIBS when Live Data is on. A tile is confirmed only after it loads. MODIS is about 250 m, so a single slope failure can be invisible.",
    attribution: "Imagery: NASA Global Imagery Browse Services (GIBS), MODIS Terra corrected reflectance.",
  },
  {
    id: "gee",
    name: "Google Earth Engine",
    url: "https://earthengine.google.com/",
    role: "Named in the project brief as a geospatial analysis platform.",
    inThisMvp: "Not connected. This prototype makes no Earth Engine requests.",
    attribution: "Not used. Earth Engine access is governed by Google's terms.",
  },
  {
    id: "sentinel-1",
    name: "Copernicus Sentinel-1",
    url: "https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1",
    extraUrl: { label: "Copernicus Data Space", url: "https://dataspace.copernicus.eu/" },
    role: "Radar imagery that can see through monsoon cloud. Named in the brief for change detection.",
    inThisMvp:
      "Not connected. The public data space requires an account for scene access, so this MVP does not pretend to show Sentinel-1 pixels.",
    attribution: "Not used. Copernicus Sentinel data are free under the Copernicus data policy when obtained from an official source.",
  },
  {
    id: "sentinel-2",
    name: "Copernicus Sentinel-2",
    url: "https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-2",
    extraUrl: { label: "Copernicus Data Space", url: "https://dataspace.copernicus.eu/" },
    role: "Optical imagery suited to landslide mapping at 10 m. Named in the brief.",
    inThisMvp: "Not connected, for the same reason as Sentinel-1.",
    attribution: "Not used. Same Copernicus terms.",
  },
  {
    id: "usgs",
    name: "USGS Landslide Hazards and Landsat",
    url: "https://www.usgs.gov/programs/landslide-hazards",
    extraUrl: { label: "Landsat missions", url: "https://www.usgs.gov/landsat-missions" },
    role: "Named in the brief for landslide records and Landsat imagery.",
    inThisMvp: "Not queried live. No USGS inventory features are drawn on the map.",
    attribution: "Not used as a live feed. USGS data are generally in the public domain.",
  },
  {
    id: "glims",
    name: "GLIMS",
    url: "https://www.glims.org/",
    role: "Global Land Ice Measurements from Space. Relevant context for high-mountain ice, including events like Chamoli. It is not a landslide inventory.",
    inThisMvp: "Not queried live. No glacier outlines are loaded.",
    attribution: "Not used as a live feed. GLIMS data have their own citation requirements when used.",
  },
  {
    id: "osm",
    name: "OpenStreetMap and Nominatim",
    url: "https://www.openstreetmap.org/copyright",
    extraUrl: {
      label: "Nominatim usage policy",
      url: "https://operations.osmfoundation.org/policies/nominatim/",
    },
    role: "Base map tiles, and place search when Nominatim responds.",
    inThisMvp: "Live. Light interactive use only. If Nominatim is down, catalog names still search.",
    attribution: "© OpenStreetMap contributors. Map data is ODbL. Respect the public tile and Nominatim usage policies.",
  },
  {
    id: "open-meteo",
    name: "Open-Meteo",
    url: "https://open-meteo.com/",
    extraUrl: {
      label: "Copernicus DEM",
      url: "https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model",
    },
    role: "Recent daily precipitation, and elevation samples used to estimate slope.",
    inThisMvp:
      "Live in Live Data mode. Elevation samples come from Copernicus DEM GLO-90 through Open-Meteo. Slope is computed here from five points about 500 m apart.",
    attribution:
      "Weather data by Open-Meteo.com. Elevation: Copernicus DEM GLO-90 via Open-Meteo. Model data (ECMWF, NOAA, DWD, and others) keep their own licenses.",
  },
  {
    id: "isro",
    name: "ISRO / NRSC Landslide Atlas of India",
    url: "https://www.isro.gov.in/media_isro/pdf/LandslideAtlas_new_2023.pdf",
    extraUrl: {
      label: "NRSC atlas page",
      url: "https://www.nrsc.gov.in/nrscnew/resources_atlas_landslide.php",
    },
    role: "Context for the brief's figures: about 12.6% of India's land area, and about 80,000 mapped landslides across 147 districts in 17 states and 2 union territories, 1998–2022.",
    inThisMvp:
      "Citation only. The atlas inventory is not loaded. Sample zones on the map are not ISRO hazard boundaries.",
    attribution: "Landslide Atlas of India, NRSC / ISRO, February 2023. Figures in the app are attributed to the project brief, which tracks this atlas.",
  },
  {
    id: "gsi",
    name: "Geological Survey of India",
    url: "https://bhusanket.gsi.gov.in/",
    extraUrl: { label: "GSI", url: "https://www.gsi.gov.in/" },
    role: "Cited for the Mundakkai–Chooralmala location and the 1,544 m source elevation in the demo scenario.",
    inThisMvp: "Citation only. Bhusanket is not queried live.",
    attribution: "GSI first information report, Mundakkai–Chooralmala, 30 July 2024.",
  },
  {
    id: "icl",
    name: "International Consortium on Landslides",
    url: "https://www.landslides.org/",
    extraUrl: {
      label: "Sunkoshi / Jure report",
      url: "https://www.landslides.org/report/sunkoshi-landslide/",
    },
    role: "Public report used to place the Jure sample.",
    inThisMvp: "Citation only.",
    attribution: "ICL landslide report, Sunkoshi landslide, 2 August 2014.",
  },
];
