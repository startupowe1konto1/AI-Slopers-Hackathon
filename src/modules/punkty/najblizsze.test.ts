import { afterEach, describe, expect, it, vi } from 'vitest';
import { azymut, formatujOdleglosc, kierunek, linkPSP, najblizszeZ, odlegloscM, zbuduj } from './najblizsze';
import type { Punkt } from '../../contracts';

const P: Punkt[] = [
  { id: 'a', rodzaj: 'aed', nazwa: 'A', lat: 52.23, lon: 21.0, zrodlo: 'um-aed' },
  { id: 'b', rodzaj: 'aed', nazwa: 'B', lat: 52.24, lon: 21.0, zrodlo: 'um-aed' },
  { id: 'c', rodzaj: 'apteka', nazwa: 'C', lat: 52.2301, lon: 21.0001, zrodlo: 'wfs-apteki' },
];

it('zwraca najbliższe danego rodzaju w kolejności odległości', () => {
  const idx = zbuduj(P);
  expect(najblizszeZ(idx, { lat: 52.234, lon: 21.0 }, 'aed', 2).map((p) => p.id)).toEqual(['a', 'b']);
  expect(najblizszeZ(idx, { lat: 52.239, lon: 21.0 }, 'aed', 1).map((p) => p.id)).toEqual(['b']);
  expect(najblizszeZ(idx, { lat: 52.23, lon: 21.0 }, 'apteka', 3).map((p) => p.id)).toEqual(['c']);
  expect(najblizszeZ(idx, { lat: 52.23, lon: 21.0 }, 'sor', 3)).toEqual([]);
});

it('tylko całodobowe: pomija punkty bez dostępności „Całodobowa”', () => {
  const idx = zbuduj([...P, { id: 'd', rodzaj: 'aed', nazwa: 'D', dostepnosc: 'Całodobowa', lat: 52.25, lon: 21.0, zrodlo: 'um-aed' }]);
  expect(najblizszeZ(idx, { lat: 52.234, lon: 21.0 }, 'aed', 3).map((p) => p.id)).toEqual(['a', 'b', 'd']);
  expect(najblizszeZ(idx, { lat: 52.234, lon: 21.0 }, 'aed', 3, true).map((p) => p.id)).toEqual(['d']);
});

it('azymut i kierunek względem północy (bez sieci, z samych współrzędnych)', () => {
  const o = { lat: 52.23, lon: 21.0 };
  expect(azymut(o, { lat: 52.24, lon: 21.0 })).toBeCloseTo(0, 0);
  expect(azymut(o, { lat: 52.23, lon: 21.01 })).toBeCloseTo(90, 0);
  expect(azymut(o, { lat: 52.22, lon: 21.0 })).toBeCloseTo(180, 0);
  expect(azymut(o, { lat: 52.23, lon: 20.99 })).toBeCloseTo(270, 0);
  expect(azymut(o, { lat: 52.24, lon: 21.016 })).toBeCloseTo(45, -1);
  expect([0, 22, 44, 90, 135, 180, 225, 270, 315, 350].map(kierunek)).toEqual([
    'północ', 'północ', 'północny wschód', 'wschód', 'południowy wschód',
    'południe', 'południowy zachód', 'zachód', 'północny zachód', 'północ',
  ]);
});

it('link do aplikacji PSP', () => {
  expect(linkPSP({ lat: 52.23, lon: 21.01 })).toBe('https://gdziesieukryc.pl/?lat=52.23&lng=21.01');
});

it('odległość w metrach i jej zapis', () => {
  // 0,001° szerokości to ok. 111 m
  expect(odlegloscM({ lat: 52.23, lon: 21.0 }, { lat: 52.231, lon: 21.0 })).toBeCloseTo(111, 0);
  expect(formatujOdleglosc(347)).toBe('350 m');
  expect(formatujOdleglosc(4)).toBe('10 m');
  expect(formatujOdleglosc(996)).toBe('1,0 km');
  expect(formatujOdleglosc(1234)).toBe('1,2 km');
});

describe('najblizsze() z paczki', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('pobiera punkty.json raz i liczy na indeksie', async () => {
    const f = vi.fn(async () => Response.json(P));
    vi.stubGlobal('fetch', f);
    const { najblizsze } = await import('./najblizsze');
    expect((await najblizsze({ lat: 52.234, lon: 21.0 }, 'aed', 3)).map((p) => p.id)).toEqual(['a', 'b']);
    expect((await najblizsze({ lat: 52.23, lon: 21.0 }, 'apteka', 3)).map((p) => p.id)).toEqual(['c']);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('/pack/punkty/punkty.json');
  });

  it('po błędzie źródła następne wywołanie próbuje ponownie', async () => {
    const f = vi.fn(async () => new Response('brak', { status: 404 }));
    vi.stubGlobal('fetch', f);
    const { najblizsze } = await import('./najblizsze');
    await expect(najblizsze({ lat: 52.23, lon: 21.0 }, 'aed', 3)).rejects.toThrow('404');
    f.mockImplementation(async () => Response.json(P));
    expect(await najblizsze({ lat: 52.23, lon: 21.0 }, 'aed', 1)).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
