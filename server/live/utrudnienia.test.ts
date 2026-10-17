// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { StanLive } from '../../src/contracts';
import type { Utrudnienie } from './typy';
import { handler, mapujUtrudnienia } from './utrudnienia';

const probka = JSON.parse(readFileSync('dane/probki/bin_utrudnienia_drogowe.json', 'utf-8'));
const TERAZ = '2026-10-17 15:30:00';

type Surowy = Parameters<typeof mapujUtrudnienia>[0][number];
const surowy = (z: Partial<Surowy>): Surowy => ({
  id: 1,
  name: 'Remont',
  start_date: '2026-10-17 06:00:00',
  end_date: '2026-10-18 06:00:00',
  streets: ['Marszałkowska'],
  geo: [[{ geomType: 1, latlngs: [{ lat: 52.23, lng: 21.01 }, { lat: 52.24, lng: 21.02 }] }]],
  ...z,
});

describe('mapujUtrudnienia', () => {
  it('zamienia próbkę API na Utrudnienie z [lng, lat]', () => {
    const wynik = mapujUtrudnienia(probka, TERAZ);
    // próbka z 17.10: 62 wpisy, jeden bez geometrii (13482)
    expect(wynik).toHaveLength(61);
    expect(wynik.map((u) => u.id)).not.toContain('13482');
    expect(wynik.find((u) => u.id === '13527')).toEqual({
      id: '13527',
      nazwa: 'Przebudują ulicę Dyrekcyjną',
      od: '2026-10-19 06:00:00',
      do: '2026-12-31 09:02:53',
      ulice: ['Dyrekcyjna'],
      linie: [
        [
          [20.88862538337708, 52.19842750820348],
          [20.89427947998047, 52.200242450446666],
        ],
      ],
      punkty: [],
    });
  });

  it('odrzuca utrudnienie zakończone przed teraz', () => {
    const wynik = mapujUtrudnienia(
      [surowy({ id: 1, end_date: '2026-10-17 15:29:59' }), surowy({ id: 2, end_date: TERAZ })],
      TERAZ,
    );
    expect(wynik.map((u) => u.id)).toEqual(['2']);
  });

  it('zostawia utrudnienie bez daty końca (do odwołania)', () => {
    expect(mapujUtrudnienia([surowy({ end_date: '' })], TERAZ)).toHaveLength(1);
  });

  it('odrzuca utrudnienie zaczynające się później niż za 3 dni, także na przełomie miesiąca', () => {
    const wynik = mapujUtrudnienia(
      [
        surowy({ id: 1, start_date: '2026-11-02 12:00:00', end_date: '2026-11-05 12:00:00' }),
        surowy({ id: 2, start_date: '2026-11-02 12:00:01', end_date: '2026-11-05 12:00:00' }),
      ],
      '2026-10-30 12:00:00',
    );
    expect(wynik.map((u) => u.id)).toEqual(['1']);
  });

  it('punkt (geomType 0) trafia do punkty jako [lng, lat]', () => {
    const [u] = mapujUtrudnienia([surowy({ geo: [[{ geomType: 0, latlngs: [{ lat: 52.29, lng: 20.97 }] }]] })], TERAZ);
    expect(u.punkty).toEqual([[20.97, 52.29]]);
    expect(u.linie).toEqual([]);
  });

  it('pomija element z wadliwym latlngs, a wpis bez żadnej geometrii odrzuca', () => {
    const zle = [{ geomType: 1 }, { geomType: 0, latlngs: [{ lat: '52.2', lng: 21 }] }, null];
    const wynik = mapujUtrudnienia(
      [
        surowy({ id: 1, geo: [[...zle, { geomType: 0, latlngs: [{ lat: 52.2, lng: 21 }] }]] as unknown as Surowy['geo'] }),
        surowy({ id: 2, geo: [zle] as unknown as Surowy['geo'] }),
        surowy({ id: 3, geo: [] }),
      ],
      TERAZ,
    );
    expect(wynik.map((u) => [u.id, u.punkty, u.linie])).toEqual([['1', [[21, 52.2]], []]]);
  });
});

describe('handler', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('zwraca StanLive z utrudnieniami i cache 10 minut', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-17T13:30:00Z'));
    vi.stubGlobal('fetch', async () => Response.json(probka));
    const r = await handler(new Request('http://x/api/live/utrudnienia'), { WARSAW_API_TOKEN: 'test' });
    const stan = (await r.json()) as StanLive<Utrudnienie[]>;
    expect(r.status).toBe(200);
    expect(stan.dane).toHaveLength(61);
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=600');
  });

  it('liczy teraz w czasie warszawskim, nie UTC', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-17T13:30:00Z')); // 15:30 w Warszawie
    vi.stubGlobal('fetch', async () =>
      Response.json([surowy({ id: 1, end_date: '2026-10-17 14:00:00' }), surowy({ id: 2, end_date: '2026-10-17 16:00:00' })]),
    );
    const r = await handler(new Request('http://x/api/live/utrudnienia'), { WARSAW_API_TOKEN: 'test' });
    const stan = (await r.json()) as StanLive<Utrudnienie[]>;
    expect(stan.dane.map((u) => u.id)).toEqual(['2']);
  });
});
