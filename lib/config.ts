export const USER_AGENT =
  process.env.TARRA_USER_AGENT?.trim() ||
  "TarraPrototype/0.1 (local research prototype)";

export const OPEN_METEO_FORECAST_URL =
  process.env.OPEN_METEO_FORECAST_URL?.trim() ||
  "https://api.open-meteo.com/v1/forecast";

export const OPEN_METEO_ELEVATION_URL =
  process.env.OPEN_METEO_ELEVATION_URL?.trim() ||
  "https://api.open-meteo.com/v1/elevation";

export const NOMINATIM_URL =
  process.env.NOMINATIM_URL?.trim() || "https://nominatim.openstreetmap.org";

export const DISCLAIMER =
  "Tarra is a research prototype. Risk estimates are based on available data and models and should not be used as the sole basis for emergency or evacuation decisions.";

export const MODEL_URL = process.env.TARRA_MODEL_URL?.trim() || "";

/** Sample-catalog proximity used only as a weak factor. Not an official radius. */
export const HISTORY_NOTE =
  "Tarra's sample catalog is a handful of published events, not a national inventory. No nearby record does not mean the slope has no history.";
