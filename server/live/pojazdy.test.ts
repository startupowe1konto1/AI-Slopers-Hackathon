// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Pojazd, StanLive } from '../../src/contracts';
import { handler, mapujPojazdy } from './pojazdy';

const probka = (plik: string) => JSON.parse(readFileSync(`dane/probki/${plik}`, 'utf-8'));
const tramwaje = probka('ztm_pojazdy_tramwaje.json');
const autobusy = probka('ztm_pojazdy_autobusy.json');

describe('mapujPojazdy', () => {
  it('odrzuca pozycje starsze niż 5 minut od najnowszej w zbiorze', () => {
    const wynik = mapujPojazdy(tramwaje, 'tramwaj');
    // próbka z 17.10 14:52: 339 pozycji, 238 świeżych, reszta nawet z 2024 roku
    expect(wynik).toHaveLength(238);
    expect(wynik.every((p) => p.czas >= '2026-10-17 14:47:05')).toBe(true);
  });

  it('zamienia pola API na Pojazd', () => {
    const [p] = mapujPojazdy(
      [{ Lines: '9', Lat: 52.25, Lon: 21.05, Time: '2026-10-17 14:52:05' }],
      'tramwaj',
    );
    expect(p).toEqual({ linia: '9', typ: 'tramwaj', lat: 52.25, lon: 21.05, czas: '2026-10-17 14:52:05' });
  });

  it('dla pustej odpowiedzi zwraca pustą listę', () => {
    expect(mapujPojazdy([], 'autobus')).toEqual([]);
  });
});

describe('handler', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('łączy autobusy i tramwaje w StanLive', async () => {
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      const { type } = JSON.parse(init.body as string);
      return Response.json(type === 1 ? autobusy : tramwaje);
    });
    const r = await handler(new Request('http://x/api/live/pojazdy'), { WARSAW_API_TOKEN: 'test' });
    const stan = (await r.json()) as StanLive<Pojazd[]>;
    expect(r.status).toBe(200);
    expect(stan.dane.filter((p) => p.typ === 'tramwaj')).toHaveLength(238);
    expect(stan.dane.filter((p) => p.typ === 'autobus')).toHaveLength(874);
    expect(stan.zCache).toBe(false);
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=15');
  });

  it('bez klucza zwraca 502 i nie pyta API', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const r = await handler(new Request('http://x/api/live/pojazdy'), {});
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'brak_klucza' });
    expect(fetch).not.toHaveBeenCalled();
  });
});
