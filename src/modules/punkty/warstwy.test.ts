import { afterEach, expect, it, vi } from 'vitest';
import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Punkt } from '../../contracts';
import { wczytajPunkty, zrodlaPaczki } from './najblizsze';
import { dodajWarstwy } from './warstwy';

vi.mock('maplibre-gl', () => ({ Popup: class {} }));
vi.mock('./najblizsze', () => ({ wczytajPunkty: vi.fn(), zrodlaPaczki: vi.fn() }));

const P: Punkt[] = [
  { id: 'psp-1', rodzaj: 'schronienie_psp', nazwa: 'A', lat: 52.23, lon: 21.0, zrodlo: 'psp' },
  { id: 'aed-1', rodzaj: 'aed', nazwa: 'B', lat: 52.24, lon: 21.0, zrodlo: 'um-aed' },
  { id: 'metro-1', rodzaj: 'metro', nazwa: 'C', lat: 52.25, lon: 21.0, zrodlo: 'wfs-metro' },
];

function atrapa() {
  const zrodla = new Map<string, { cluster?: boolean; data: FeatureCollection }>();
  const warstwy = new Set<string>();
  const subskrypcje: { unsubscribe: ReturnType<typeof vi.fn> }[] = [];
  const map = {
    addSource: (id: string, s: { cluster?: boolean; data: FeatureCollection }) => void zrodla.set(id, s),
    addLayer: (l: { id: string }) => void warstwy.add(l.id),
    getSource: (id: string) => zrodla.get(id),
    getLayer: (id: string) => (warstwy.has(id) ? { id } : undefined),
    removeLayer: (id: string) => void warstwy.delete(id),
    removeSource: (id: string) => void zrodla.delete(id),
    on: () => {
      const s = { unsubscribe: vi.fn() };
      subskrypcje.push(s);
      return s;
    },
  };
  return { map: map as unknown as MapLibreMap, zrodla, warstwy, subskrypcje };
}

const poczekaj = () => new Promise((r) => setTimeout(r));

afterEach(() => vi.clearAllMocks());

it('PSP w klastrach, pozostałe rodzaje osobno; sprzątanie usuwa wszystko', async () => {
  vi.mocked(wczytajPunkty).mockResolvedValue(P);
  vi.mocked(zrodlaPaczki).mockResolvedValue({});
  const { map, zrodla, warstwy, subskrypcje } = atrapa();
  const sprzatnij = dodajWarstwy(map);
  await poczekaj();

  const psp = zrodla.get('punkty-psp')!;
  const inne = zrodla.get('punkty-inne')!;
  expect(psp.cluster).toBe(true);
  expect(psp.data.features).toHaveLength(1);
  expect(inne.cluster).toBeFalsy();
  expect(inne.data.features.map((f) => f.properties?.rodzaj)).toEqual(['aed', 'metro']);
  expect(warstwy.size).toBeGreaterThan(0);
  expect(subskrypcje.length).toBeGreaterThan(0);

  sprzatnij();
  expect(zrodla.size).toBe(0);
  expect(warstwy.size).toBe(0);
  expect(subskrypcje.every((s) => s.unsubscribe.mock.calls.length === 1)).toBe(true);
});

it('sprzątanie przed wczytaniem danych nie dodaje warstw', async () => {
  vi.mocked(wczytajPunkty).mockResolvedValue(P);
  vi.mocked(zrodlaPaczki).mockResolvedValue({});
  const { map, zrodla, warstwy } = atrapa();
  dodajWarstwy(map)();
  await poczekaj();
  expect(zrodla.size).toBe(0);
  expect(warstwy.size).toBe(0);
});

it('bez paczki mapa zostaje bez punktów, bez wyjątku', async () => {
  vi.mocked(wczytajPunkty).mockRejectedValue(new Error('HTTP 404'));
  vi.mocked(zrodlaPaczki).mockRejectedValue(new Error('HTTP 404'));
  const { map, zrodla } = atrapa();
  const sprzatnij = dodajWarstwy(map);
  await poczekaj();
  expect(zrodla.size).toBe(0);
  sprzatnij();
});
