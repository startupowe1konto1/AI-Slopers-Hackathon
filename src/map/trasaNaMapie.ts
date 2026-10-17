import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Trasa } from '../contracts';

let licznik = 0;

// Margines kadru trasy: u góry leżą kafelki warstw, z prawej przyciski zoomu.
export const KADR = { top: 80, bottom: 40, left: 40, right: 56 };

// Znacznik celu: niebieska kropka w białej obwódce (kolor trasy), żeby było widać, dokąd prowadzi linia.
const ZNACZNIK_CELU = { 'circle-radius': 7, 'circle-color': '#1d4ed8', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 };

// Każde wywołanie ma własne id, więc spóźnione sprzątanie starej trasy nie usuwa nowej.
// Sprzątanie sprawdza getLayer/getSource, więc jest bezpieczne także po map.remove() (styl jest wtedy pusty).
export function pokazTrase(map: MapLibreMap, t: Trasa): () => void {
  // Z jednego punktu nie ma linii ani sensownych granic: nic nie rysujemy i nie ruszamy mapy.
  if (t.linia.length < 2) return () => {};
  const lon = t.linia.map((p) => p[0]);
  const lat = t.linia.map((p) => p[1]);
  const granice: [[number, number], [number, number]] = [[Math.min(...lon), Math.min(...lat)], [Math.max(...lon), Math.max(...lat)]];
  const id = `trasa-${++licznik}`;
  map.addSource(id, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: t.linia } },
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [t.do.lon, t.do.lat] } },
      ],
    },
  });
  map.addLayer({
    id,
    type: 'line',
    source: id,
    filter: ['==', ['geometry-type'], 'LineString'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#1d4ed8', 'line-width': 5, 'line-opacity': 0.85, ...(t.zrodlo === 'prosta' ? { 'line-dasharray': [1.5, 1.5] } : {}) },
  });
  map.addLayer({ id: `${id}-cel`, type: 'circle', source: id, filter: ['==', ['geometry-type'], 'Point'], paint: ZNACZNIK_CELU });
  map.fitBounds(granice, { padding: KADR, maxZoom: 17 });
  return () => {
    [`${id}-cel`, id].forEach((w) => map.getLayer(w) && map.removeLayer(w));
    if (map.getSource(id)) map.removeSource(id);
  };
}

// Plan komunikacji (bez przesiadek): dojścia pieszo przerywane, przejazd w kolorze rodzaju linii, kropki na przystankach.
export type OdcinekPlanu = { rodzaj: 'pieszo' | 'autobus' | 'tramwaj' | 'metro'; linia: [number, number][] };
export const KOLOR_LINII = { autobus: '#7c3aed', tramwaj: '#c2410c', metro: '#0369a1' } as const;

export function pokazPlan(map: MapLibreMap, odcinki: OdcinekPlanu[], przystanki: [number, number][], cel?: [number, number]): () => void {
  const linie = odcinki.filter((o) => o.linia.length >= 2);
  if (!linie.length) return () => {};
  const wszystkie = linie.flatMap((o) => o.linia);
  const lon = wszystkie.map((p) => p[0]);
  const lat = wszystkie.map((p) => p[1]);
  const granice: [[number, number], [number, number]] = [[Math.min(...lon), Math.min(...lat)], [Math.max(...lon), Math.max(...lat)]];
  const id = `plan-${++licznik}`;
  const warstwy = [`${id}-pieszo`, `${id}-przejazd`, `${id}-przystanki`, `${id}-cel`];
  map.addSource(id, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        ...linie.map((o) => ({ type: 'Feature' as const, properties: { rodzaj: o.rodzaj }, geometry: { type: 'LineString' as const, coordinates: o.linia } })),
        ...przystanki.map((p) => ({ type: 'Feature' as const, properties: { rodzaj: 'przystanek' }, geometry: { type: 'Point' as const, coordinates: p } })),
        ...(cel ? [{ type: 'Feature' as const, properties: { rodzaj: 'cel' }, geometry: { type: 'Point' as const, coordinates: cel } }] : []),
      ],
    },
  });
  map.addLayer({
    id: warstwy[0],
    type: 'line',
    source: id,
    filter: ['==', ['get', 'rodzaj'], 'pieszo'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#1d4ed8', 'line-width': 4, 'line-opacity': 0.8, 'line-dasharray': [1, 1.5] },
  });
  map.addLayer({
    id: warstwy[1],
    type: 'line',
    source: id,
    filter: ['in', ['get', 'rodzaj'], ['literal', ['autobus', 'tramwaj', 'metro']]],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['match', ['get', 'rodzaj'], 'tramwaj', KOLOR_LINII.tramwaj, 'metro', KOLOR_LINII.metro, KOLOR_LINII.autobus],
      'line-width': 6,
      'line-opacity': 0.9,
    },
  });
  map.addLayer({
    id: warstwy[2],
    type: 'circle',
    source: id,
    filter: ['==', ['get', 'rodzaj'], 'przystanek'],
    paint: { 'circle-radius': 6, 'circle-color': '#ffffff', 'circle-stroke-color': '#111827', 'circle-stroke-width': 2.5 },
  });
  map.addLayer({ id: warstwy[3], type: 'circle', source: id, filter: ['==', ['get', 'rodzaj'], 'cel'], paint: ZNACZNIK_CELU });
  map.fitBounds(granice, { padding: KADR, maxZoom: 17 });
  return () => {
    warstwy.forEach((w) => map.getLayer(w) && map.removeLayer(w));
    if (map.getSource(id)) map.removeSource(id);
  };
}
