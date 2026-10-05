import assert from "node:assert/strict";
import { buildAlerts } from "../lib/alerts";
import { parseCoordinateQuery } from "../lib/coords";
import { steepestSlopeDeg } from "../lib/geo";
import { gibsDatePair, parseTileQuery } from "../lib/tiles";
import { siteById } from "../data/catalog";
import { analyzeLocation, rainfallForMode, zoneFeatures } from "../services/analyze";
import { emptyRainfall } from "../services/rainfall";
import { assessRisk, levelFromScore } from "../services/risk";

function fail(message: string): never {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

async function main() {
const wayanad = siteById("wayanad-2024");
const bengaluru = siteById("bengaluru-reference");
if (!wayanad || !bengaluru) fail("catalog missing");

const wayanadResult = await analyzeLocation({
  lat: wayanad.lat,
  lon: wayanad.lon,
  mode: "demo",
  label: wayanad.name,
});
assert.equal(wayanadResult.mode, "demo");
assert.equal(wayanadResult.scenarioMatched, true);
assert.equal(wayanadResult.rainfall.past48hMm, 578);
assert.equal(wayanadResult.rainfall.origin, "catalog");
assert.equal(wayanadResult.terrain.slopeDeg, null);
assert.equal(wayanadResult.inference.probability, null);
assert.equal(wayanadResult.inference.modelConnected, false);
assert.equal(wayanadResult.inference.banner, "Prototype / Simulated Detection");
assert.ok((wayanadResult.risk.score ?? 0) >= 80);
assert.equal(wayanadResult.risk.level, "critical");
assert.equal(wayanadResult.risk.incomplete, true);
assert.equal(wayanadResult.alerts.length, 2);
assert.ok(wayanadResult.alerts.some((alert) => alert.scope === "local"));
assert.ok(wayanadResult.alerts.some((alert) => alert.scope === "regional"));
assert.ok(wayanadResult.warning.status === "prototype_alert");
assert.ok(!wayanadResult.risk.factors.some((factor) => factor.origin === "simulated" && factor.available));

const plains = await analyzeLocation({
  lat: bengaluru.lat,
  lon: bengaluru.lon,
  mode: "demo",
});
assert.equal(plains.risk.level, "low");
assert.ok((plains.risk.score ?? 100) < 35);
assert.equal(plains.alerts.length, 0);
assert.equal(plains.rainfall.origin, "demo");
assert.ok(plains.rainfall.detail.toLowerCase().includes("demo"));

const nowhere = await analyzeLocation({ lat: 0, lon: 0, mode: "demo" });
assert.equal(nowhere.risk.score, null);
assert.equal(nowhere.scenarioMatched, false);
assert.equal(nowhere.rainfall.past48hMm, null);
assert.equal(nowhere.alerts.length, 0);
assert.equal(nowhere.satellite.status, "unavailable");

const liveRain = emptyRainfall("Live test value.");
liveRain.origin = "live";
liveRain.past48hMm = 4;
liveRain.past7dMm = 11;
const ignored = rainfallForMode("live", liveRain, {
  siteId: "wayanad-2024",
  rainfall48hMm: 578,
  rainfall7dMm: 900,
  rainfallDetail: "should not be used",
  slopeDeg: 40,
  slopeDetail: "no",
  elevationM: 1544,
  elevationDetail: "no",
});
assert.equal(ignored.past48hMm, 4);
assert.equal(ignored.origin, "live");
assert.ok(!ignored.detail.includes("578"));

const blocked = assessRisk({
  rainfall48hMm: 578,
  rainfall7dMm: null,
  rainfallOrigin: "simulated",
  rainfallDetail: "must not score",
  slopeDeg: 40,
  slopeOrigin: "simulated",
  slopeDetail: "must not score",
  nearestEventKm: 0,
  historyOrigin: "catalog",
  historyDetail: "catalog only",
  satelliteDetail: "not scored",
});
assert.equal(blocked.score, null);

assert.equal(levelFromScore(34), "low");
assert.equal(levelFromScore(35), "moderate");
assert.equal(levelFromScore(59), "moderate");
assert.equal(levelFromScore(60), "high");
assert.equal(levelFromScore(79), "high");
assert.equal(levelFromScore(80), "critical");

const quiet = buildAlerts({
  mode: "live",
  analyzedAt: "2026-09-28T00:00:00.000Z",
  locationLabel: "Test",
  lat: 1,
  lon: 2,
  score: 59,
  level: "moderate",
  rainfallDetail: "11 mm",
  confidenceDetail: "not available — no model connected",
  nearby: [],
});
assert.equal(quiet.length, 0);

const dates = gibsDatePair(new Date("2026-09-28T12:00:00.000Z"));
assert.equal(dates.after, "2026-09-25");
assert.equal(dates.before, "2026-09-09");

assert.equal(parseTileQuery({ date: "2026-09-25", z: "12", x: "0", y: "0", now: new Date("2026-09-28T00:00:00Z") }).ok, false);
assert.equal(parseTileQuery({ date: "2026-09-29", z: "2", x: "0", y: "0", now: new Date("2026-09-28T00:00:00Z") }).ok, false);
assert.equal(parseTileQuery({ date: "2026-09-25", z: "2", x: "1", y: "1", now: new Date("2026-09-28T00:00:00Z") }).ok, true);

assert.deepEqual(parseCoordinateQuery("11.46, 76.13"), { lat: 11.46, lon: 76.13 });
assert.equal(parseCoordinateQuery("nope"), null);

const slope = steepestSlopeDeg(0, 0.0045, 0, 500, 0, 0, 0);
assert.ok(slope > 44 && slope < 46);

const zones = zoneFeatures();
assert.ok(zones.features.some((feature) => feature.properties.level === "critical"));
assert.ok(zones.features.some((feature) => feature.properties.level === "low"));
assert.equal(zones.features.length, 5);

console.log("PASS risk, demo analysis, alerts, tiles");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
