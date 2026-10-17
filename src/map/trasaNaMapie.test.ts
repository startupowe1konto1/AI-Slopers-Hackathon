import { expect, it, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Trasa } from '../contracts';
import { pokazTrase } from './trasaNaMapie';

function atrapa() {
  const warstwy = new Map<string, { paint: Record<string, unknown> }>();
  const zrodla = new Set<string>();
  const map = {
    addSource: (id: string) => void zrodla.add(id),
    addLayer: (l: { id: string; paint: Record<string, unknown> }) => void warstwy.set(l.id, l),
    getLayer: (id: string) => warstwy.get(id),
    getSource: (id: string) => (zrodla.has(id) ? {} : undefined),
    removeLayer: (id: string) => void warstwy.delete(id),
    removeSource: (id: string) => void zrodla.delete(id),
    fitBounds: vi.fn(),
  };
  return { map: map as unknown as MapLibreMap, warstwy, zrodla, fitBounds: map.fitBounds };
}

const t: Trasa = {
  od: { lat: 52.23, lon: 21.0 }, do: { lat: 52.24, lon: 21.02 }, profil: 'pieszo', dystansM: 1800, czasMin: 22,
  linia: [[21.0, 52.23], [21.01, 52.235], [21.02, 52.24]], zrodlo: 'osrm',
};

it('rysuje linię, pokazuje całą trasę i sprząta po sobie', () => {
  const a = atrapa();
  const sprzatnij = pokazTrase(a.map, t);
  expect(a.warstwy.size).toBe(1);
  expect(a.fitBounds).toHaveBeenCalledWith([[21.0, 52.23], [21.02, 52.24]], { padding: 60, maxZoom: 17 });
  sprzatnij();
  expect(a.warstwy.size).toBe(0);
  expect(a.zrodla.size).toBe(0);
});

it('linia prosta (bez sieci) jest przerywana', () => {
  const a = atrapa();
  pokazTrase(a.map, { ...t, zrodlo: 'prosta' });
  expect([...a.warstwy.values()][0].paint['line-dasharray']).toEqual([1.5, 1.5]);
});

it('trasa z mniej niż dwoma punktami nic nie rysuje i nie rusza mapy', () => {
  const a = atrapa();
  const sprzatnij = pokazTrase(a.map, { ...t, linia: [[21.0, 52.23]] });
  expect(a.warstwy.size).toBe(0);
  expect(a.zrodla.size).toBe(0);
  expect(a.fitBounds).not.toHaveBeenCalled();
  expect(() => sprzatnij()).not.toThrow();
});
