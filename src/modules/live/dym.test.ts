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

  // punkt w odległości d metrów od dymu w kierunku azymutu (rzut płaski, na 3 km błąd poniżej 0,01°)
  const D = { lat: 52.23, lon: 21.0 };
  const pkt = (azymutDeg: number, d: number) => ({
    lat: D.lat + (d * Math.cos((azymutDeg * Math.PI) / 180)) / 111195,
    lon: D.lon + (d * Math.sin((azymutDeg * Math.PI) / 180)) / (111195 * Math.cos((D.lat * Math.PI) / 180)),
  });

  it('granica kąta: tuż w środku i tuż poza ±15° od osi', () => {
    // wiatr z zachodu: oś na wschód (90°)
    expect(wStozku(pkt(90 + 14.5, 1500), D, 270)).toBe(true);
    expect(wStozku(pkt(90 - 14.5, 1500), D, 270)).toBe(true);
    expect(wStozku(pkt(90 + 15.5, 1500), D, 270)).toBe(false);
    expect(wStozku(pkt(90 - 15.5, 1500), D, 270)).toBe(false);
  });

  it('granica długości: tuż w środku i tuż poza 3 km', () => {
    expect(wStozku(pkt(90, 2950), D, 270)).toBe(true);
    expect(wStozku(pkt(90, 3050), D, 270)).toBe(false);
  });

  it('punkt w miejscu dymu (mniej niż 1 m) jest w stożku, niezależnie od wiatru', () => {
    expect(wStozku(D, D, 270)).toBe(true);
    expect(wStozku(pkt(37, 0.5), D, 123)).toBe(true);
  });

  it('oś stożka przechodzi przez 0°/360°: wiatr z 170°, 180° i 190° (oś 350°, 0°, 10°)', () => {
    expect(wStozku(pkt(355, 1500), D, 170)).toBe(true);
    expect(wStozku(pkt(4, 1500), D, 170)).toBe(true); // 14° od osi 350°, po drugiej stronie 0°
    expect(wStozku(pkt(10, 1500), D, 170)).toBe(false); // 20° od osi
    expect(wStozku(pkt(5, 1500), D, 190)).toBe(true);
    expect(wStozku(pkt(356, 1500), D, 190)).toBe(true); // 14° od osi 10°, po drugiej stronie 0°
    expect(wStozku(pkt(350, 1500), D, 190)).toBe(false); // 20° od osi 10°
    expect(wStozku(pkt(352, 1500), D, 180)).toBe(true);
    expect(wStozku(pkt(8, 1500), D, 180)).toBe(true);
    expect(wStozku(pkt(20, 1500), D, 180)).toBe(false);
    expect(wStozku(pkt(340, 1500), D, 180)).toBe(false);
  });

  it('oś stożka przechodzi przez 180°: wiatr z 350° i z 10° (oś 170° i 190°)', () => {
    expect(wStozku(pkt(180, 1500), D, 350)).toBe(true);
    expect(wStozku(pkt(180, 1500), D, 10)).toBe(true);
    expect(wStozku(pkt(160, 1500), D, 350)).toBe(true); // 10° od osi 170°
    expect(wStozku(pkt(200, 1500), D, 10)).toBe(true); // 10° od osi 190°
    expect(wStozku(pkt(150, 1500), D, 350)).toBe(false); // 20° od osi 170°
    expect(wStozku(pkt(210, 1500), D, 10)).toBe(false); // 20° od osi 190°
    expect(wStozku(pkt(0, 1500), D, 350)).toBe(false); // przeciwna strona
  });
});
