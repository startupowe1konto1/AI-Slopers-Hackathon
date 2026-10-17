// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { handler, mapujTrase, punkt } from './trasa';

const probka = JSON.parse(readFileSync('dane/probki/osrm-pieszo.json', 'utf-8'));
const zapytanie = (q: string) => new Request(`http://x/api/live/trasa?${q}`);

describe('punkt', () => {
  it('„lon,lat” w Warszawie, zaokrąglone do 5 miejsc', () => {
    expect(punkt('21.0122,52.2297')).toBe('21.01220,52.22970');
    expect(punkt('19.94,50.06')).toBeNull(); // Kraków
    expect(punkt('abc')).toBeNull();
    expect(punkt(null)).toBeNull();
    expect(punkt('21.01,52.2,xyz')).toBeNull();
    expect(punkt('')).toBeNull();
    expect(punkt(' ,52.2')).toBeNull();
    expect(punkt('21.01,')).toBeNull();
    expect(punkt('21.01')).toBeNull();
  });
});

describe('mapujTrase', () => {
  it('dystans w metrach, czas w minutach, linia [lon, lat] z próbki', () => {
    const t = mapujTrase(probka);
    expect(t.dystansM).toBe(444);
    expect(t.czasMin).toBe(6);
    expect(t.linia).toHaveLength(33);
    expect(t.linia[0][0]).toBeCloseTo(21.0122, 3);
  });
  it('brak trasy to błąd schematu', () => {
    expect(() => mapujTrase({ code: 'NoRoute', routes: [] })).toThrow('osrm: NoRoute');
  });
  it('Ok, ale bez geometrii albo ze złymi liczbami: błąd schematu, nie TypeError', () => {
    const zle = [
      { code: 'Ok', routes: [{ distance: 1, duration: 60 }] },
      { code: 'Ok', routes: [{ distance: 1, duration: 60, geometry: {} }] },
      { code: 'Ok', routes: [{ distance: 1, duration: 60, geometry: { coordinates: [] } }] },
      { code: 'Ok', routes: [{ distance: NaN, duration: 60, geometry: { coordinates: [[21, 52.2]] } }] },
      { code: 'Ok', routes: [{ distance: 1, duration: null, geometry: { coordinates: [[21, 52.2]] } }] },
    ];
    for (const d of zle) {
      expect(() => mapujTrase(d as never)).toThrowError(expect.objectContaining({ rodzaj: 'schemat' }));
    }
  });
});

describe('handler', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('złe parametry: 400 bez pytania OSRM', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    for (const q of ['od=21.0122,52.2297&profil=pieszo', 'od=19.9,50.06&do=21.018,52.231&profil=pieszo', 'od=21.0122,52.2297&do=21.018,52.231&profil=auto']) {
      const r = await handler(zapytanie(q), {});
      expect(r.status).toBe(400);
      expect(await r.json()).toEqual({ blad: 'parametry' });
    }
    expect(f).not.toHaveBeenCalled();
  });

  it('pieszo: pyta routed-foot z User-Agent projektu i zwraca trasę z cache na dobę', async () => {
    const f = vi.fn(async (_url: string, _init?: RequestInit) => Response.json(probka));
    vi.stubGlobal('fetch', f);
    const r = await handler(zapytanie('od=21.0122,52.2297&do=21.018,52.231&profil=pieszo'), {});
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ dystansM: 444, czasMin: 6 });
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=86400');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://routing.openstreetmap.de/routed-foot/route/v1/driving/21.01220,52.22970;21.01800,52.23100?overview=full&geometries=geojson');
    expect(new Headers(init?.headers).get('User-Agent')).toMatch(/^warszawa-kryzys/);
  });

  it('rower: pyta routed-bike', async () => {
    const f = vi.fn(async (_url: string) => Response.json(probka));
    vi.stubGlobal('fetch', f);
    await handler(zapytanie('od=21.0122,52.2297&do=21.018,52.231&profil=rower'), {});
    expect(f.mock.calls[0][0]).toContain('/routed-bike/');
  });

  const Q = 'od=21.0122,52.2297&do=21.018,52.231&profil=pieszo';

  it('OSRM 500: 502 klucz_lub_usluga', async () => {
    vi.stubGlobal('fetch', async () => new Response('boom', { status: 500 }));
    const r = await handler(zapytanie(Q), {});
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'klucz_lub_usluga' });
  });

  it('OSRM 400 NoRoute z JSON-em: 502 schemat', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ code: 'NoRoute', message: 'Impossible route' }, { status: 400 }));
    const r = await handler(zapytanie(Q), {});
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'schemat' });
  });

  it('OSRM 400 bez JSON-a: 502 klucz_lub_usluga', async () => {
    vi.stubGlobal('fetch', async () => new Response('Bad Request', { status: 400 }));
    const r = await handler(zapytanie(Q), {});
    expect(await r.json()).toEqual({ blad: 'klucz_lub_usluga' });
  });

  it('OSRM 200 z treścią nie-JSON: 502 schemat', async () => {
    vi.stubGlobal('fetch', async () => new Response('<html>', { status: 200 }));
    const r = await handler(zapytanie(Q), {});
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'schemat' });
  });

  describe('cache Workera (best-effort)', () => {
    const caches0 = Object.getOwnPropertyDescriptor(globalThis, 'caches');
    const ustawCache = (def: unknown) => Object.defineProperty(globalThis, 'caches', { value: { default: def }, configurable: true, writable: true });
    afterEach(() => {
      if (caches0) Object.defineProperty(globalThis, 'caches', caches0);
      else delete (globalThis as { caches?: unknown }).caches;
    });

    it('trafienie w cache: 200 bez pytania OSRM', async () => {
      const f = vi.fn();
      vi.stubGlobal('fetch', f);
      const match = vi.fn(async () => Response.json({ dystansM: 1, czasMin: 1, linia: [] }));
      ustawCache({ match, put: vi.fn() });
      const r = await handler(zapytanie(Q), {});
      expect(r.status).toBe(200);
      expect(await r.json()).toMatchObject({ dystansM: 1 });
      expect(f).not.toHaveBeenCalled();
    });

    it('put rzuca: nadal 200 z trasą', async () => {
      vi.stubGlobal('fetch', async () => Response.json(probka));
      const put = vi.fn(async () => {
        throw new Error('cache pełny');
      });
      ustawCache({ match: async () => undefined, put });
      const r = await handler(zapytanie(Q), {});
      expect(put).toHaveBeenCalled();
      expect(r.status).toBe(200);
      expect(await r.json()).toMatchObject({ dystansM: 444, czasMin: 6 });
    });

    it('match rzuca: przechodzi do OSRM i zwraca 200', async () => {
      const f = vi.fn(async () => Response.json(probka));
      vi.stubGlobal('fetch', f);
      ustawCache({
        match: async () => {
          throw new Error('cache niedostępny');
        },
        put: async () => undefined,
      });
      const r = await handler(zapytanie(Q), {});
      expect(f).toHaveBeenCalledTimes(1);
      expect(r.status).toBe(200);
      expect(await r.json()).toMatchObject({ dystansM: 444 });
    });
  });

  it('OSRM nie odpowiada: 502 timeout', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed');
    });
    const r = await handler(zapytanie('od=21.0122,52.2297&do=21.018,52.231&profil=pieszo'), {});
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'timeout' });
  });
});
