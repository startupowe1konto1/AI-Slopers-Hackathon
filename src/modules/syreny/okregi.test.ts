import { expect, it, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { distance } from 'geokdbush';
import { kolekcjaOkregow, kolo, najblizszeOkregi, opisOkregow, pokazOkregi, wczytajOkregi, wOkregu, type Okrag } from './okregi';

const S: Okrag[] = [
  { nr: 'a', typ: 'cyfrowa', lat: 52.23, lon: 21.0, r75: 345, r70: 641, r65: 1191 },
  { nr: 'b', typ: 'analogowa', lat: 52.24, lon: 21.0, r75: 300, r70: 560, r65: 1000 },
];
const W = { lat: 52.233, lon: 21.0 }; // 334 m od a, 778 m od b

it('najbliższe syreny po odległości', () => {
  expect(najblizszeOkregi(S, W, 5).map((o) => o.nr)).toEqual(['a', 'b']);
  expect(najblizszeOkregi(S, W, 1)).toHaveLength(1);
});

it('najmocniejszy okrąg, w którym mieści się punkt', () => {
  const [a, b] = najblizszeOkregi(S, W);
  expect(wOkregu(a)).toBe(75);
  expect(wOkregu(b)).toBe(65);
  expect(wOkregu({ ...b, odlegloscM: 1200 })).toBeNull();
});

it('opis do szczegółów karty', () => {
  expect(opisOkregow(najblizszeOkregi(S, W))).toEqual([
    'Syrena cyfrowa, 330 m od Ciebie: mieścisz się w okręgu 75 dB.',
    'Syrena analogowa, 780 m od Ciebie: mieścisz się w okręgu 65 dB.',
  ]);
});

it('koło ma zadany promień, a każda syrena 3 okręgi', () => {
  const [lon, lat] = kolo(S[0], 1000).coordinates[0][16]; // punkt na północy
  const m = distance(21.0, 52.23, lon, lat) * 1000;
  expect(m).toBeGreaterThan(990);
  expect(m).toBeLessThan(1010);
  expect(kolekcjaOkregow(S).features).toHaveLength(6);
});

// Prosta atrapa mapy: pamięta źródła i warstwy; po „usunięciu mapy” (style = null) pyta o nic, jak MapLibre.
function atrapa() {
  const zrodla = new Set<string>();
  const warstwy = new Set<string>();
  const map = {
    addSource: vi.fn((id: string) => zrodla.add(id)),
    addLayer: vi.fn((l: { id: string }) => warstwy.add(l.id)),
    removeLayer: vi.fn((id: string) => warstwy.delete(id)),
    removeSource: vi.fn((id: string) => zrodla.delete(id)),
    getLayer: vi.fn((id: string) => (warstwy.has(id) ? {} : undefined)),
    getSource: vi.fn((id: string) => (zrodla.has(id) ? {} : undefined)),
    fitBounds: vi.fn((_granice: [[number, number], [number, number]]) => {}),
  };
  return { map, zrodla, warstwy, jakoMapa: map as unknown as MapLibreMap };
}

it('pokazanie rysuje okręgi i przybliża mapę, sprzątanie usuwa wszystko i można je wywołać dwa razy', () => {
  const { map, zrodla, warstwy, jakoMapa } = atrapa();
  const sprzatnij = pokazOkregi(najblizszeOkregi(S, W), W)(jakoMapa);
  expect(zrodla.size).toBe(1);
  expect([...warstwy].sort()).toEqual([expect.stringMatching(/-kontur$/), expect.stringMatching(/-wypelnienie$/)]);
  expect([...zrodla][0]).toMatch(/^syreny-okregi-/);
  const [[zachod, poludnie], [wschod, polnoc]] = map.fitBounds.mock.calls[0][0];
  expect(zachod).toBeLessThan(W.lon);
  expect(wschod).toBeGreaterThan(W.lon);
  expect(poludnie).toBeLessThan(S[0].lat);
  expect(polnoc).toBeGreaterThan(S[1].lat);
  sprzatnij();
  expect(zrodla.size).toBe(0);
  expect(warstwy.size).toBe(0);
  expect(() => sprzatnij()).not.toThrow();
});

it('sprzątanie po usunięciu mapy niczego nie rusza i nie rzuca', () => {
  const { map, zrodla, warstwy, jakoMapa } = atrapa();
  const sprzatnij = pokazOkregi(najblizszeOkregi(S, W), W)(jakoMapa);
  zrodla.clear();
  warstwy.clear();
  expect(() => sprzatnij()).not.toThrow();
  expect(map.removeLayer).not.toHaveBeenCalled();
  expect(map.removeSource).not.toHaveBeenCalled();
});

it('wczytanie okręgów: błąd sieci nie zostaje w pamięci, kolejna próba pobiera od nowa', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true, json: async () => S });
  vi.stubGlobal('fetch', fetchMock);
  try {
    await expect(wczytajOkregi()).rejects.toThrow();
    await expect(wczytajOkregi()).resolves.toEqual(S);
    await wczytajOkregi();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith('/pack/syreny/okregi.json');
  } finally {
    vi.unstubAllGlobals();
  }
});
