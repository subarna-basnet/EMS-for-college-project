"use client";

import { CATALOG } from "@/data/catalog";
import { RISK_COLOR } from "@/lib/risk-style";
import { zoneFeatures } from "@/services/analyze";
import type { RiskLevel, SelectedLocation } from "@/types";
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  selected: SelectedLocation;
  focusNonce: number;
  riskLevel: RiskLevel | null;
  showZones: boolean;
  showEvents: boolean;
  showModis: boolean;
  modisDate: string | null;
  onSelect: (location: SelectedLocation) => void;
}

export default function MapCanvas({
  selected,
  focusNonce,
  riskLevel,
  showZones,
  showEvents,
  showModis,
  modisDate,
  onSelect,
}: Props) {
  const holder = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  const [mapReady, setMapReady] = useState(false);
  onSelectRef.current = onSelect;
  selectedRef.current = selected;
  const zones = useRef(zoneFeatures());

  useEffect(() => {
    let disposed = false;
    let map: import("maplibre-gl").Map | null = null;
    const markers: import("maplibre-gl").Marker[] = [];

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (disposed || !holder.current) return;
      map = new maplibregl.Map({
        container: holder.current,
        center: [selected.lon, selected.lat],
        zoom: 4.2,
        dragRotate: false,
        pitchWithRotate: false,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
              maxzoom: 19,
            },
            zones: { type: "geojson", data: zones.current },
            selection: {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [],
              },
            },
          },
          layers: [
            { id: "osm", type: "raster", source: "osm" },
            {
              id: "zones-fill",
              type: "fill",
              source: "zones",
              paint: {
                "fill-color": [
                  "match",
                  ["get", "level"],
                  "low", RISK_COLOR.low,
                  "moderate", RISK_COLOR.moderate,
                  "high", RISK_COLOR.high,
                  "critical", RISK_COLOR.critical,
                  "#94a3b8",
                ],
                "fill-opacity": 0.32,
              },
            },
            {
              id: "zones-line",
              type: "line",
              source: "zones",
              paint: {
                "line-color": [
                  "match",
                  ["get", "level"],
                  "low", RISK_COLOR.low,
                  "moderate", RISK_COLOR.moderate,
                  "high", RISK_COLOR.high,
                  "critical", RISK_COLOR.critical,
                  "#64748b",
                ],
                "line-width": 1.5,
              },
            },
            {
              id: "selection",
              type: "circle",
              source: "selection",
              paint: {
                "circle-radius": 9,
                "circle-color": "#0b3a4a",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              },
            },
          ],
        },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      setMapReady(true);

      map.on("load", () => {
        if (!map) return;
        for (const site of CATALOG) {
          const feature = zones.current.features.find((item) => item.properties.id === site.id);
          const level = feature?.properties.level;
          const color = level && level in RISK_COLOR ? RISK_COLOR[level as RiskLevel] : "#64748b";
          const button = document.createElement("button");
          button.type = "button";
          button.className = "tarra-pin";
          button.style.background = color;
          button.title = site.name;
          button.setAttribute("aria-label", site.name);
          button.dataset.pin = "event";
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            onSelectRef.current({
              lat: site.lat,
              lon: site.lon,
              label: site.name,
              catalogId: site.id,
            });
          });
          const marker = new maplibregl.Marker({ element: button })
            .setLngLat([site.lon, site.lat])
            .addTo(map);
          markers.push(marker);
        }
      });

      map.on("click", (event) => {
        const target = event.originalEvent.target;
        if (target instanceof Element && target.closest("[data-pin]")) return;
        onSelectRef.current({
          lat: event.lngLat.lat,
          lon: event.lngLat.lng,
          label: "Map selection",
          catalogId: null,
        });
      });
    })();

    return () => {
      disposed = true;
      markers.forEach((marker) => marker.remove());
      map?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const source = map.getSource("selection") as import("maplibre-gl").GeoJSONSource | undefined;
      source?.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [selected.lon, selected.lat] },
          },
        ],
      });
      if (map.getLayer("selection")) {
        map.setPaintProperty("selection", "circle-color", riskLevel ? RISK_COLOR[riskLevel] : "#0b3a4a");
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [selected.lat, selected.lon, riskLevel, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || focusNonce < 1) return;
    const loc = selectedRef.current;
    const fly = () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      map.flyTo({
        center: [loc.lon, loc.lat],
        zoom: Math.max(map.getZoom(), 8),
        duration: reduce ? 0 : 700,
      });
    };
    if (map.isStyleLoaded()) fly();
    else map.once("load", fly);
  }, [focusNonce, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (map.getLayer("zones-fill")) {
        map.setLayoutProperty("zones-fill", "visibility", showZones ? "visible" : "none");
        map.setLayoutProperty("zones-line", "visibility", showZones ? "visible" : "none");
      }
      holder.current?.querySelectorAll<HTMLElement>("[data-pin='event']").forEach((pin) => {
        pin.style.display = showEvents ? "block" : "none";
      });
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [showZones, showEvents, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const exists = Boolean(map.getSource("modis"));
      if (!showModis || !modisDate) {
        if (map.getLayer("modis")) map.setLayoutProperty("modis", "visibility", "none");
        return;
      }
      if (!exists) {
        map.addSource("modis", {
          type: "raster",
          tiles: [`/api/satellite/tile?date=${modisDate}&z={z}&x={x}&y={y}`],
          tileSize: 256,
          maxzoom: 9,
          attribution: "NASA GIBS / MODIS Terra",
        });
        map.addLayer(
          { id: "modis", type: "raster", source: "modis", paint: { "raster-opacity": 0.82 } },
          "zones-fill",
        );
      } else if (map.getLayer("modis")) {
        map.setLayoutProperty("modis", "visibility", "visible");
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [showModis, modisDate, mapReady]);

  return <div ref={holder} data-testid="map" className="h-full w-full" />;
}
