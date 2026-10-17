import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { Pojazd } from '../../contracts';

const ZRODLO = 'live-pojazdy';
const KROPKI = 'live-pojazdy-kropki';
const LINIE = 'live-pojazdy-linie';

// dodajWarstwy wywołuje mapa raz przy starcie; dane podaje panel przez ustawPojazdy().
let mapa: MapLibreMap | null = null;

const kolekcja = (p: Pojazd[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features: p.map((x) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [x.lon, x.lat] },
    properties: { linia: x.linia, typ: x.typ },
  })),
});

export function dodajWarstwy(map: MapLibreMap): () => void {
  mapa = map;
  map.addSource(ZRODLO, { type: 'geojson', data: kolekcja([]) });
  map.addLayer({
    id: KROPKI,
    type: 'circle',
    source: ZRODLO,
    paint: {
      'circle-color': ['match', ['get', 'typ'], 'tramwaj', '#dc2626', '#1d4ed8'],
      'circle-radius': 6,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
    },
  });
  map.addLayer({
    id: LINIE,
    type: 'symbol',
    source: ZRODLO,
    layout: {
      'text-field': ['get', 'linia'],
      'text-font': ['Noto Sans Medium'],
      'text-size': 11,
      'text-offset': [0, 0.9],
      'text-anchor': 'top',
    },
    paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
  });
  return () => {
    for (const id of [LINIE, KROPKI]) if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(ZRODLO)) map.removeSource(ZRODLO);
    if (mapa === map) mapa = null;
  };
}

export function ustawPojazdy(p: Pojazd[]): void {
  (mapa?.getSource(ZRODLO) as GeoJSONSource | undefined)?.setData(kolekcja(p));
}
