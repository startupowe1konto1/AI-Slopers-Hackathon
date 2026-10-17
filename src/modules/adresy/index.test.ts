import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pack = {
  ulice: ['al. Jerozolimskie', 'ul. Grochowska'],
  dzielnice: ['Ochota', 'Praga-Południe'],
  id: ['1315200', '1315201'], u: [0, 1], nr: ['100', '200'], dz: [0, 1],
  lat: [52.22, 52.24], lon: [20.98, 21.09],
};

// Moduł trzyma paczkę w pamięci, więc każdy test ładuje go od nowa.
const zaladuj = () => import('./index');

describe('adresy z paczki', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it('pobiera paczkę raz i szuka w niej', async () => {
    const f = vi.fn(async () => Response.json(pack));
    vi.stubGlobal('fetch', f);
    const { znajdzAdres } = await zaladuj();
    expect((await znajdzAdres('grochowska 200')).map((a) => a.id)).toEqual(['1315201']);
    expect(await znajdzAdres('jerozolimskie', 1)).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('/pack/adresy/adresy.json');
  });

  it('indeksAdresu daje numer wiersza albo -1', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(pack)));
    const { indeksAdresu } = await zaladuj();
    expect(await indeksAdresu('1315201')).toBe(1);
    expect(await indeksAdresu('t1')).toBe(-1);
  });

  it('adresPoIndeksie składa adres z kolumn', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(pack)));
    const { adresPoIndeksie } = await zaladuj();
    expect(await adresPoIndeksie(1)).toEqual({
      id: '1315201', ulica: 'ul. Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.24, lon: 21.09,
    });
  });

  it('nieudane pobranie odrzuca, a następne wywołanie próbuje znowu', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('brak', { status: 404 })));
    const { znajdzAdres } = await zaladuj();
    await expect(znajdzAdres('grochowska')).rejects.toThrow('adresy.json');
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(pack)));
    expect(await znajdzAdres('grochowska')).toHaveLength(1);
  });
});
