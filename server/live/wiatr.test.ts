// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { StanLive, Wiatr } from '../../src/contracts';
import { handler, mapujWiatr } from './wiatr';

const pogoda = JSON.parse(readFileSync('dane/probki/zom_pogoda.json', 'utf-8'));

describe('mapujWiatr', () => {
  it('zamienia stacje pogodowe na Wiatr', () => {
    const wynik = mapujWiatr(pogoda);
    expect(wynik).toHaveLength(16);
    expect(wynik[0]).toEqual({ stacja: 'Stacja Bielany', kierunekDeg: 237, predkoscMs: 1, czas: '2026-10-17 14:40:00' });
    expect(wynik.map((w) => w.stacja)).toContain('Stacja Most Północny');
  });

  it('pomija stację bez pomiaru wiatru', () => {
    const wynik = mapujWiatr([
      { lokalizacja: 'A', czas: '2026-10-17 14:40:00', pred_wiatru: null, kier_wiatru: 90 },
      { lokalizacja: 'B', czas: '2026-10-17 14:40:00', pred_wiatru: 2, kier_wiatru: null },
      { lokalizacja: 'C', czas: '2026-10-17 14:40:00', pred_wiatru: 2, kier_wiatru: 90 },
    ]);
    expect(wynik.map((w) => w.stacja)).toEqual(['C']);
  });
});

describe('handler', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('zwraca StanLive z wiatrem i cache 5 minut', async () => {
    vi.stubGlobal('fetch', async () => Response.json(pogoda));
    const r = await handler(new Request('http://x/api/live/wiatr'), { WARSAW_API_TOKEN: 'test' });
    const stan = (await r.json()) as StanLive<Wiatr[]>;
    expect(stan.dane).toHaveLength(16);
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=300');
  });
});
