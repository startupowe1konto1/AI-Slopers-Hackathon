import { describe, expect, it } from 'vitest';
import { odlegloscM } from './okolica';
import { stozekDymu, wStozku } from './dym';

const P = { lat: 52.2317, lon: 21.0064 };

describe('stozekDymu', () => {
  it('to zamknięty wielokąt z wierzchołkiem w punkcie dymu', () => {
    const ring = stozekDymu(P, 270);
    expect(ring[0]).toEqual([P.lon, P.lat]);
    expect(ring.at(-1)).toEqual(ring[0]);
  });

  it('wiatr z zachodu (270°) niesie dym na wschód, 3 km od punktu', () => {
    const ring = stozekDymu(P, 270);
    const srodek = ring[Math.floor(ring.length / 2)];
    expect(srodek[0]).toBeGreaterThan(P.lon);
    expect(srodek[1]).toBeCloseTo(P.lat, 3);
    expect(odlegloscM(P, { lon: srodek[0], lat: srodek[1] })).toBeCloseTo(3000, -1);
  });

  it('łuk ma szerokość 30°: skrajne punkty po obu stronach osi', () => {
    const ring = stozekDymu(P, 180); // z południa, czyli na północ
    const [lewy, prawy] = [ring[1], ring.at(-2)!];
    expect(lewy[1]).toBeGreaterThan(P.lat);
    expect(prawy[1]).toBeGreaterThan(P.lat);
    // rozstaw końców łuku: 2 · 3 km · sin(15°) ≈ 1553 m
    expect(odlegloscM({ lon: lewy[0], lat: lewy[1] }, { lon: prawy[0], lat: prawy[1] })).toBeCloseTo(1553, -1);
  });
});

describe('wStozku', () => {
  it('punkt z wiatrem od dymu do 3 km i ±15°', () => {
    const dym = { lat: 52.23, lon: 21.0 };
    expect(wStozku({ lat: 52.23, lon: 21.02 }, dym, 270)).toBe(true); // 1,4 km na wschód, wiatr z zachodu
    expect(wStozku({ lat: 52.25, lon: 21.02 }, dym, 270)).toBe(false); // ok. 32° od osi
    expect(wStozku({ lat: 52.23, lon: 21.06 }, dym, 270)).toBe(false); // 4 km
    expect(wStozku({ lat: 52.23, lon: 21.02 }, dym, 90)).toBe(false); // wiatr ze wschodu: dym idzie na zachód
  });
});
