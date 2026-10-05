import { MODEL_URL, USER_AGENT } from "@/lib/config";
import type { InferenceSummary, PipelineStep, SatelliteInfo } from "@/types";

export interface InferenceInput {
  lat: number;
  lon: number;
  satellite: SatelliteInfo;
  scoreAvailable: boolean;
  alertCreated: boolean;
}

interface ModelResponse {
  probability?: unknown;
  label?: unknown;
  model?: unknown;
}

function baseSteps(
  input: InferenceInput,
  featureState: PipelineStep["state"],
  featureDetail: string,
  detectState: PipelineStep["state"],
  detectDetail: string,
): PipelineStep[] {
  const imageState: PipelineStep["state"] =
    input.satellite.status === "demo"
      ? "simulated"
      : input.satellite.status === "link_ready"
        ? "done"
        : "unavailable";
  const imageDetail =
    input.satellite.status === "demo"
      ? "Illustrative drawing only. It is not passed to a model."
      : input.satellite.status === "link_ready"
        ? "A MODIS browse tile can be requested. It is not cropped or normalised in this prototype."
        : input.satellite.detail;

  return [
    { id: "image", title: "Satellite image", state: imageState, detail: imageDetail },
    {
      id: "preprocess",
      title: "Preprocessing",
      state: "not_run",
      detail: "Cropping, resizing, and normalisation are not run. No image tensor is built.",
    },
    {
      id: "features",
      title: "Feature extraction",
      state: featureState,
      detail: featureDetail,
    },
    {
      id: "detect",
      title: "Landslide detection",
      state: detectState,
      detail: detectDetail,
    },
    {
      id: "postprocess",
      title: "Post-processing",
      state: "not_run",
      detail: "False-positive filtering is not run.",
    },
    {
      id: "score",
      title: "Risk score",
      state: input.scoreAvailable ? "done" : "unavailable",
      detail: input.scoreAvailable
        ? "Heuristic score from rainfall, slope, and the sample catalog. Not a model output."
        : "No heuristic score. Missing inputs were not filled in.",
    },
    {
      id: "alert",
      title: "Alert",
      state: input.alertCreated ? "done" : "skipped",
      detail: input.alertCreated
        ? "A prototype alert was stored in this browser because the heuristic score reached the high threshold."
        : "No prototype alert. Either there is no score, or it is below the high threshold.",
    },
  ];
}

function notConnected(input: InferenceInput): InferenceSummary {
  return {
    origin: "simulated",
    modelConnected: false,
    modelName: null,
    probability: null,
    banner: "Prototype / Simulated Detection",
    detail:
      "No CNN, ResNet, or DenseNet weights are loaded. This pipeline describes the intended path and does not emit a confidence score.",
    steps: baseSteps(
      input,
      "not_run",
      "Intended architectures from the project brief: CNN, ResNet, and DenseNet. No weights are loaded.",
      "not_run",
      "Detection did not run, so there is no probability and no confidence.",
    ),
  };
}

async function callModel(input: InferenceInput): Promise<InferenceSummary> {
  try {
    const response = await fetch(MODEL_URL, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        lat: input.lat,
        lon: input.lon,
        sensor: input.satellite.sensor,
        beforeDate: input.satellite.beforeDate,
        afterDate: input.satellite.afterDate,
      }),
    });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
    const body = (await response.json()) as ModelResponse;
    const probability = typeof body.probability === "number" ? body.probability : null;
    if (probability == null || probability < 0 || probability > 1 || Number.isNaN(probability)) {
      return {
        origin: "unavailable",
        modelConnected: false,
        modelName: null,
        probability: null,
        banner: "Data unavailable",
        detail:
          "TARRA_MODEL_URL responded, but probability was missing or outside 0–1. No confidence was invented.",
        steps: baseSteps(
          input,
          "unavailable",
          "The model endpoint did not return a usable probability.",
          "unavailable",
          "No detection result. No confidence was invented.",
        ),
      };
    }
    const modelName = typeof body.model === "string" && body.model.trim() ? body.model.trim() : "Configured model";
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : null;
    return {
      origin: "live",
      modelConnected: true,
      modelName,
      probability,
      banner: "Model result",
      detail: label
        ? `${modelName} returned a probability of ${probability.toFixed(2)}. Label: ${label}. This is only as trustworthy as that service.`
        : `${modelName} returned a probability of ${probability.toFixed(2)}. Tarra did not generate this number.`,
      steps: baseSteps(
        input,
        "done",
        `${modelName} accepted location metadata. Layers inside that service are not visible here.`,
        "done",
        `${modelName} returned probability ${probability.toFixed(2)}.`,
      ),
    };
  } catch {
    return {
      origin: "unavailable",
      modelConnected: false,
      modelName: null,
      probability: null,
      banner: "Data unavailable",
      detail: "TARRA_MODEL_URL is set, but the model did not return a usable result. No confidence was invented.",
      steps: baseSteps(
        input,
        "unavailable",
        "The model request failed.",
        "unavailable",
        "No detection result. No confidence was invented.",
      ),
    };
  }
}

export async function runInference(input: InferenceInput): Promise<InferenceSummary> {
  if (!MODEL_URL) return notConnected(input);
  return callModel(input);
}
