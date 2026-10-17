import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { FeatureCollection, Polygon } from 'geojson';
import { distance } from 'geokdbush';
import type { Wsp } from '../../contracts';

// public/pack/syreny/okregi.json (pipeline/syreny/okregi.py); promienie w metrach.
export type Okrag = Wsp & { nr: string; typ: 'cyfrowa' | 'analogowa'; r75: number; r70: number; r65: number };
export type OkragBlisko = Okrag & { odlegloscM: number };
type Prog = 75 | 70 | 65;
const PROGI: Prog[] = [65, 70, 75];

export const DOPISEK_OKREGOW =
  'Okręgi to przybliżenie z odległości i mocy syreny, bez budynków. Wynik dla adresu wyżej pochodzi z modelu SOIA, który uwzględnia zabudowę.';

export function najblizszeOkregi(okregi: Okrag[], w: Wsp, n = 5): OkragBlisko[] {
  return okregi
    .map((o) => ({ ...o, odlegloscM: distance(w.lon, w.lat, o.lon, o.lat) * 1000 }))
    .sort((a, b) => a.odlegloscM - b.odlegloscM)
    .slice(0, n);
}

export function wOkregu(o: OkragBlisko): Prog | null {
  if (o.odlegloscM <= o.r75) return 75;
  if (o.odlegloscM <= o.r70) return 70;
  if (o.odlegloscM <= o.r65) return 65;
  return null;
}

const metry = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export function opisOkregow(bliskie: OkragBlisko[]): string[] {
  return bliskie.map((o) => {
    const p = wOkregu(o);
    return `Syrena ${o.typ}, ${metry(o.odlegloscM)} od Ciebie: ${p ? `mieścisz się w okręgu ${p} dB` : 'jesteś poza jej okręgiem 65 dB'}.`;
  });
}

// Koło o promieniu r metrów w rzucie lokalnym (wystarcza do kilku km).
export function kolo(c: Wsp, r: number, kroki = 64): Polygon {
  const kx = 111_320 * Math.cos((c.lat * Math.PI) / 180);
  const ky = 110_574;
  const pierscien = Array.from({ length: kroki + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / kroki;
    return [c.lon + (r * Math.cos(t)) / kx, c.lat + (r * Math.sin(t)) / ky];
  });
  return { type: 'Polygon', coordinates: [pierscien] };
}

export function kolekcjaOkregow(okregi: Okrag[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: okregi.flatMap((o) =>
      PROGI.map((p) => ({ type: 'Feature' as const, geometry: kolo(o, o[`r${p}`]), properties: { typ: o.typ, prog: p } })),
    ),
  };
}

let dane: Promise<Okrag[]> | null = null;
export function wczytajOkregi(): Promise<Okrag[]> {
  dane ??= fetch('/pack/syreny/okregi.json')
    .then((r) => {
      if (!r.ok) throw new Error('Nie pobrano okregi.json');
      return r.json() as Promise<Okrag[]>;
    })
    .catch((e: unknown) => {
      dane = null;
      throw e;
    });
  return dane;
}

const kolorTypu = ['match', ['get', 'typ'], 'cyfrowa', '#1d4ed8', '#b45309'] as unknown as ExpressionSpecification;
const przezroczystosc = ['match', ['get', 'prog'], 75, 0.16, 70, 0.1, 0.05] as unknown as ExpressionSpecification;
let licznik = 0;

// Akcja „mapa” karty Syreny: okręgi najbliższych syren (cyfrowe niebieskie, analogowe pomarańczowe) i widok na nie.
export function pokazOkregi(bliskie: Okrag[], w: Wsp): (map: MapLibreMap) => () => void {
  return (map) => {
    const id = `syreny-okregi-${++licznik}`;
    map.addSource(id, { type: 'geojson', data: kolekcjaOkregow(bliskie) });
    map.addLayer({ id: `${id}-wypelnienie`, type: 'fill', source: id, paint: { 'fill-color': kolorTypu, 'fill-opacity': przezroczystosc } });
    map.addLayer({ id: `${id}-kontur`, type: 'line', source: id, paint: { 'line-color': kolorTypu, 'line-width': 1.5 } });
    const pkt = bliskie.flatMap((o) => kolo(o, o.r65, 8).coordinates[0]).concat([[w.lon, w.lat]]);
    const lon = pkt.map((p) => p[0]);
    const lat = pkt.map((p) => p[1]);
    map.fitBounds([[Math.min(...lon), Math.min(...lat)], [Math.max(...lon), Math.max(...lat)]], { padding: 40, maxZoom: 16 });
    return () => {
      for (const l of [`${id}-kontur`, `${id}-wypelnienie`]) if (map.getLayer(l)) map.removeLayer(l);
      if (map.getSource(id)) map.removeSource(id);
    };
  };
}
