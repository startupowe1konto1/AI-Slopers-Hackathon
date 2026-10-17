import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { Feature, FeatureCollection } from 'geojson';
import type { Pojazd, Wsp } from '../../contracts';
import type { StacjaRowerowa, Utrudnienie } from '../../../server/live/typy';

const POJAZDY = 'live-pojazdy';
const DYM = 'live-dym';
const UTRUDNIENIA = 'live-utrudnienia';
const ROWERY = 'live-rowery';
const ZRODLA = [POJAZDY, DYM, UTRUDNIENIA, ROWERY];

// dodajWarstwy wywołuje mapa raz przy starcie; dane podaje panel przez ustaw*().
// Panel może ustawić dane, zanim mapa się załaduje (np. zapisany punkt dymu), więc je pamiętamy.
let mapa: MapLibreMap | null = null;
const ostatnie = new Map<string, Feature[]>();

const kolekcja = (features: Feature[]): FeatureCollection => ({ type: 'FeatureCollection', features });
const punkt = (lon: number, lat: number, properties: Record<string, unknown> = {}): Feature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lon, lat] },
  properties,
});

function ustaw(id: string, features: Feature[]) {
  ostatnie.set(id, features);
  (mapa?.getSource(id) as GeoJSONSource | undefined)?.setData(kolekcja(features));
}

export function dodajWarstwy(map: MapLibreMap): () => void {
  mapa = map;
  for (const id of ZRODLA) map.addSource(id, { type: 'geojson', data: kolekcja(ostatnie.get(id) ?? []) });
  const warstwy = [
    {
      id: 'live-utrudnienia-linie',
      type: 'line',
      source: UTRUDNIENIA,
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: { 'line-color': '#b45309', 'line-width': 4, 'line-opacity': 0.8, 'line-dasharray': [2, 1] },
    },
    {
      id: 'live-utrudnienia-punkty',
      type: 'circle',
      source: UTRUDNIENIA,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: { 'circle-color': '#b45309', 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
    },
    {
      id: 'live-dym-stozek',
      type: 'fill',
      source: DYM,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': '#6b7280', 'fill-opacity': 0.3, 'fill-outline-color': '#374151' },
    },
    {
      id: 'live-dym-punkt',
      type: 'circle',
      source: DYM,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: { 'circle-color': '#374151', 'circle-radius': 7, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 },
    },
    {
      id: 'live-rowery-kropki',
      type: 'circle',
      source: ROWERY,
      paint: { 'circle-color': '#15803d', 'circle-radius': 7, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
    },
    {
      id: 'live-rowery-liczba',
      type: 'symbol',
      source: ROWERY,
      layout: { 'text-field': ['to-string', ['get', 'rowery']], 'text-font': ['Noto Sans Medium'], 'text-size': 10 },
      paint: { 'text-color': '#ffffff' },
    },
    {
      id: 'live-pojazdy-kropki',
      type: 'circle',
      source: POJAZDY,
      paint: {
        'circle-color': ['match', ['get', 'typ'], 'tramwaj', '#dc2626', '#1d4ed8'],
        'circle-radius': 6,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    },
    {
      id: 'live-pojazdy-linie',
      type: 'symbol',
      source: POJAZDY,
      layout: {
        'text-field': ['get', 'linia'],
        'text-font': ['Noto Sans Medium'],
        'text-size': 11,
        'text-offset': [0, 0.9],
        'text-anchor': 'top',
      },
      paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
    },
  ] as Parameters<MapLibreMap['addLayer']>[0][];
  for (const w of warstwy) map.addLayer(w);
  return () => {
    for (const w of [...warstwy].reverse()) if (map.getLayer(w.id)) map.removeLayer(w.id);
    for (const id of ZRODLA) if (map.getSource(id)) map.removeSource(id);
    if (mapa === map) mapa = null;
  };
}

export function ustawPojazdy(p: Pojazd[]): void {
  ustaw(POJAZDY, p.map((x) => punkt(x.lon, x.lat, { linia: x.linia, typ: x.typ })));
}

export function ustawDym(miejsce: Wsp | null, stozek: [number, number][] | null): void {
  const f: Feature[] = [];
  if (miejsce && stozek) f.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [stozek] }, properties: {} });
  if (miejsce) f.push(punkt(miejsce.lon, miejsce.lat));
  ustaw(DYM, f);
}

export function ustawUtrudnienia(lista: Utrudnienie[]): void {
  ustaw(
    UTRUDNIENIA,
    lista.flatMap((u) => [
      ...u.linie.map((l): Feature => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: l }, properties: { nazwa: u.nazwa } })),
      ...u.punkty.map(([lon, lat]) => punkt(lon, lat, { nazwa: u.nazwa })),
    ]),
  );
}

export function ustawRowery(lista: StacjaRowerowa[]): void {
  ustaw(ROWERY, lista.map((s) => punkt(s.lon, s.lat, { nazwa: s.nazwa, rowery: s.rowery })));
}

// Następne kliknięcie w mapę wybiera punkt (np. „Widzę dym — tutaj”).
export function wybierzNaMapie(): Promise<Wsp | null> {
  const m = mapa;
  if (!m) return Promise.resolve(null);
  const plotno = m.getCanvas();
  plotno.style.cursor = 'crosshair';
  return new Promise((ok) =>
    m.once('click', (e) => {
      plotno.style.cursor = '';
      ok({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    }),
  );
}
