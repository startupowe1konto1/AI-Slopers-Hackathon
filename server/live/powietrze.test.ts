// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { StanLive } from '../../src/contracts';
import type { Powietrze } from './typy';
import { handler, mapujPowietrze } from './powietrze';

const probka = JSON.parse(readFileSync('dane/probki/bopipk_monitoring_jakosci_powietrza.json', 'utf-8'));

const pomiar = (param_code: string, value: number, time = '2026-10-17 15:00:00') => ({
  param_code,
  value,
  time,
  unit: 'µg/m3',
});

describe('mapujPowietrze', () => {
  it('zostawia stacje mierzące pył', () => {
    // próbka z 17.10 15:00: 141 stacji, ul. Kondratowicza mierzy tylko NO2 i O3
    const wynik = mapujPowietrze(probka);
    expect(wynik).toHaveLength(140);
    expect(wynik.some((p) => p.stacja === 'Warszawa, ul. Kondratowicza')).toBe(false);
  });

  it('zamienia stację miasta na Powietrze', () => {
    const p = mapujPowietrze(probka).find((x) => x.stacja === 'Warszawa-Grochowska');
    expect(p).toEqual({
      stacja: 'Warszawa-Grochowska',
      lat: 52.245703,
      lon: 21.080555,
      pm10: 8.905,
      pm25: 7.49848,
      czas: '2026-10-17 15:00:00',
    });
  });

  it('czyta PM2.5 i współrzędne tekstowe ze stacji GIOŚ', () => {
    const p = mapujPowietrze(probka).find((x) => x.stacja === 'Warszawa, Al. Niepodległości');
    expect(p).toEqual({
      stacja: 'Warszawa, Al. Niepodległości',
      lat: 52.219298,
      lon: 21.004724,
      pm10: 14.8,
      pm25: 10.3,
      czas: '2026-10-17 15:00:00',
    });
  });

  it('stacja tylko z PM10 ma pm25 = null', () => {
    const [p] = mapujPowietrze([
      { name: 'A', lat: 52.2, lon: 21, data: [pomiar('PM10', 12), pomiar('NO2', 30)] },
    ]);
    expect(p.pm10).toBe(12);
    expect(p.pm25).toBeNull();
  });

  it('pomija stację bez pyłu', () => {
    expect(mapujPowietrze([{ name: 'B', lat: 52.2, lon: 21, data: [pomiar('NO2', 30), pomiar('O3', 50)] }])).toEqual(
      [],
    );
  });

  it('czas to najnowszy pomiar pyłu', () => {
    const [p] = mapujPowietrze([
      {
        name: 'C',
        lat: 52.2,
        lon: 21,
        data: [pomiar('PM10', 12, '2026-10-17 15:30:00'), pomiar('PM25', 8), pomiar('NO2', 30, '2026-10-17 16:00:00')],
      },
    ]);
    expect(p.czas).toBe('2026-10-17 15:30:00');
  });
});

describe('handler', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('zwraca StanLive ze stacjami', async () => {
    vi.stubGlobal('fetch', async () => Response.json(probka));
    const r = await handler(new Request('http://x/api/live/powietrze'), { WARSAW_API_TOKEN: 'test' });
    const stan = (await r.json()) as StanLive<Powietrze[]>;
    expect(r.status).toBe(200);
    expect(stan.dane).toHaveLength(140);
    expect(stan.zrodlo).toBe('Monitoring jakości powietrza m.st. Warszawy przez dane.um.warszawa.pl');
    expect(stan.zCache).toBe(false);
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=600');
  });

  it('bez klucza zwraca 502 i nie pyta API', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const r = await handler(new Request('http://x/api/live/powietrze'), {});
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'brak_klucza' });
    expect(fetch).not.toHaveBeenCalled();
  });
});
