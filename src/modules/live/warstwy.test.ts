import { afterEach, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Pojazd } from '../../contracts';
import { dodajWarstwy, ustawPojazdy } from './warstwy';

const P: Pojazd[] = [
  { linia: '9', typ: 'tramwaj', lat: 52.23, lon: 21.0, czas: '2026-10-17 14:52:05' },
  { linia: '128', typ: 'autobus', lat: 52.24, lon: 21.01, czas: '2026-10-17 14:52:01' },
];

function atrapa() {
  const zrodla = new Map<string, { data: FeatureCollection }>();
  const warstwy = new Set<string>();
  const map = {
    addSource: (id: string, s: { data: FeatureCollection }) => void zrodla.set(id, s),
    addLayer: (l: { id: string }) => void warstwy.add(l.id),
    getSource: (id: string) => {
      const s = zrodla.get(id);
      return s && { setData: (d: FeatureCollection) => void (s.data = d) };
    },
    getLayer: (id: string) => (warstwy.has(id) ? { id } : undefined),
    removeLayer: (id: string) => void warstwy.delete(id),
    removeSource: (id: string) => void zrodla.delete(id),
  };
  return { map: map as unknown as MapLibreMap, zrodla, warstwy };
}

let sprzatnij: (() => void) | undefined;
afterEach(() => sprzatnij?.());

it('dodaje puste źródło pojazdów z kropkami i numerami linii', () => {
  const { map, zrodla, warstwy } = atrapa();
  sprzatnij = dodajWarstwy(map);
  expect([...zrodla.values()][0].data.features).toEqual([]);
  expect(warstwy.size).toBe(2);
});

it('ustawPojazdy podmienia dane na mapie: punkt [lon, lat], linia i typ', () => {
  const { map, zrodla } = atrapa();
  sprzatnij = dodajWarstwy(map);
  ustawPojazdy(P);
  const [f] = [...zrodla.values()][0].data.features;
  expect(f.geometry).toEqual({ type: 'Point', coordinates: [21.0, 52.23] });
  expect(f.properties).toEqual({ linia: '9', typ: 'tramwaj' });
});

it('sprzątanie usuwa warstwy i źródło, a późniejsze ustawPojazdy nic nie robi', () => {
  const { map, zrodla, warstwy } = atrapa();
  dodajWarstwy(map)();
  expect(zrodla.size).toBe(0);
  expect(warstwy.size).toBe(0);
  expect(() => ustawPojazdy(P)).not.toThrow();
});
