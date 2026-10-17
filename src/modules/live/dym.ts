import type { Wsp } from '../../contracts';
import { R, rad } from './okolica';

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
