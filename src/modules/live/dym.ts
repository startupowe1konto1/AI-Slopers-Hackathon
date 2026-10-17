import type { Wsp } from '../../contracts';
import { R, odlegloscM, rad } from './okolica';

const stopnie = (r: number) => (r * 180) / Math.PI;

// Punkt w odległości d metrów od p w kierunku azymutu (wzór na sferze).
function cel(p: Wsp, azymutDeg: number, d: number): [number, number] {
  const delta = d / R;
  const theta = rad(azymutDeg);
  const fi1 = rad(p.lat);
  const fi2 = Math.asin(Math.sin(fi1) * Math.cos(delta) + Math.cos(fi1) * Math.sin(delta) * Math.cos(theta));
  const lambda2 = rad(p.lon) + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(fi1), Math.cos(delta) - Math.sin(fi1) * Math.sin(fi2));
  return [stopnie(lambda2), stopnie(fi2)];
}

// Stożek w stronę, w którą wieje wiatr (kierunekZDeg to kierunek, Z KTÓREGO wieje).
// To kierunek wiatru, nie model rozprzestrzeniania się dymu.
export function stozekDymu(p: Wsp, kierunekZDeg: number, dlugoscM = 3000, katDeg = 30): [number, number][] {
  const os = kierunekZDeg + 180;
  const kroki = 12;
  const luk = Array.from({ length: kroki + 1 }, (_, i) => cel(p, os - katDeg / 2 + (katDeg * i) / kroki, dlugoscM));
  const wierzcholek: [number, number] = [p.lon, p.lat];
  return [wierzcholek, ...luk, wierzcholek];
}

function azymut(a: Wsp, b: Wsp): number {
  const dl = rad(b.lon - a.lon);
  const y = Math.sin(dl) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dl);
  return (stopnie(Math.atan2(y, x)) + 360) % 360;
}

// Czy punkt p leży w stożku dymu (ten sam kształt co stozekDymu: 3 km, 30°). kierunekZDeg = skąd wieje.
export function wStozku(p: Wsp, dym: Wsp, kierunekZDeg: number, dlugoscM = 3000, katDeg = 30): boolean {
  const d = odlegloscM(dym, p);
  if (d > dlugoscM) return false;
  if (d < 1) return true;
  const os = (kierunekZDeg + 180) % 360;
  const roznica = Math.abs(((((azymut(dym, p) - os) % 360) + 540) % 360) - 180);
  return roznica <= katDeg / 2;
}

const KLUCZ_DYMU = 'live:dym';

// Punkt dymu zostaje tylko w tym urządzeniu.
export function wczytajDym(): Wsp | null {
  try {
    const v = JSON.parse(localStorage.getItem(KLUCZ_DYMU) ?? 'null');
    return v && typeof v.lat === 'number' && typeof v.lon === 'number' ? { lat: v.lat, lon: v.lon } : null;
  } catch {
    return null;
  }
}
export function zapiszDym(p: Wsp | null): void {
  try {
    if (p) localStorage.setItem(KLUCZ_DYMU, JSON.stringify(p));
    else localStorage.removeItem(KLUCZ_DYMU);
  } catch {
    // brak dostępu do pamięci: punkt zostaje do zamknięcia strony
  }
}
