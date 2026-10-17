import { afterEach, expect, it } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { dodajWarstwy, pokazStrefy, strefyWidoczne } from './warstwy';

function atrapa() {
  const zrodla = new Map<string, { type: string; data: unknown }>();
  const widocznosc = new Map<string, string>();
  const map = {
    addSource: (id: string, s: { type: string; data: unknown }) => void zrodla.set(id, s),
    addLayer: (l: { id: string; layout?: { visibility?: string } }) => void widocznosc.set(l.id, l.layout?.visibility ?? 'visible'),
    setLayoutProperty: (id: string, k: string, v: string) => void (k === 'visibility' && widocznosc.set(id, v)),
    getLayer: (id: string) => (widocznosc.has(id) ? { id } : undefined),
    removeLayer: (id: string) => void widocznosc.delete(id),
    removeSource: (id: string) => void zrodla.delete(id),
  };
  return { map: map as unknown as MapLibreMap, zrodla, widocznosc };
}

let sprzatnij: (() => void) | undefined;
afterEach(() => {
  sprzatnij?.();
  sprzatnij = undefined;
  pokazStrefy(false);
});

it('dodaje strefy syren analogowych z paczki offline, domyślnie ukryte', () => {
  const { map, zrodla, widocznosc } = atrapa();
  sprzatnij = dodajWarstwy(map);
  expect(zrodla.get('syreny-strefy-analogowe')).toEqual({ type: 'geojson', data: '/pack/syreny/strefy-analogowe.json' });
  expect(widocznosc.size).toBeGreaterThan(0);
  expect([...widocznosc.values()].every((v) => v === 'none')).toBe(true);
});

it('pokazStrefy włącza i wyłącza wszystkie warstwy stref', () => {
  const { map, widocznosc } = atrapa();
  sprzatnij = dodajWarstwy(map);
  pokazStrefy(true);
  expect(strefyWidoczne()).toBe(true);
  expect([...widocznosc.values()].every((v) => v === 'visible')).toBe(true);
  pokazStrefy(false);
  expect([...widocznosc.values()].every((v) => v === 'none')).toBe(true);
});

it('pamięta wybór sprzed załadowania mapy', () => {
  pokazStrefy(true);
  const { map, widocznosc } = atrapa();
  sprzatnij = dodajWarstwy(map);
  expect([...widocznosc.values()].every((v) => v === 'visible')).toBe(true);
});

it('sprzątanie usuwa warstwy i źródło', () => {
  const { map, zrodla, widocznosc } = atrapa();
  dodajWarstwy(map)();
  expect(zrodla.size).toBe(0);
  expect(widocznosc.size).toBe(0);
});
