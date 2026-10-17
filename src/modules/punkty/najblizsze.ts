import KDBush from 'kdbush';
import { around, distance } from 'geokdbush';
import type { Manifest, Punkt, RodzajPunktu, Wsp } from '../../contracts';

export type Indeks = { idx: KDBush; punkty: Punkt[] };

export function zbuduj(punkty: Punkt[]): Indeks {
  const idx = new KDBush(punkty.length);
  punkty.forEach((p) => idx.add(p.lon, p.lat));
  idx.finish();
  return { idx, punkty };
}

// Promień 20 km obejmuje całą Warszawę z każdego adresu.
export function najblizszeZ(i: Indeks, w: Wsp, rodzaj: RodzajPunktu, n: number, tylkoCalodobowe = false): Punkt[] {
  const pasuje = (p: Punkt) => p.rodzaj === rodzaj && (!tylkoCalodobowe || p.dostepnosc === 'Całodobowa');
  return around(i.idx, w.lon, w.lat, n, 20, (id) => pasuje(i.punkty[id])).map((id) => i.punkty[id]);
}

export const linkPSP = (w: Wsp) => `https://gdziesieukryc.pl/?lat=${w.lat}&lng=${w.lon}`;

export const odlegloscM = (a: Wsp, b: Wsp) => distance(a.lon, a.lat, b.lon, b.lat) * 1000;

// Azymut z a do b w stopniach od północy (0–360), liczony z samych współrzędnych, więc działa bez sieci.
export function azymut(a: Wsp, b: Wsp): number {
  const r = Math.PI / 180;
  const dl = (b.lon - a.lon) * r;
  const y = Math.sin(dl) * Math.cos(b.lat * r);
  const x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos(dl);
  return (Math.atan2(y, x) / r + 360) % 360;
}

const KIERUNKI = ['północ', 'północny wschód', 'wschód', 'południowy wschód', 'południe', 'południowy zachód', 'zachód', 'północny zachód'];
export const kierunek = (stopnie: number) => KIERUNKI[Math.round(stopnie / 45) % 8];

export function formatujOdleglosc(m: number): string {
  const r = Math.max(10, Math.round(m / 10) * 10);
  return r < 1000 ? `${r} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

// Jedno pobranie na sesję; po błędzie następne wywołanie próbuje ponownie.
function raz<T>(f: () => Promise<T>): () => Promise<T> {
  let p: Promise<T> | null = null;
  return () =>
    (p ??= f().catch((e) => {
      p = null;
      throw e;
    }));
}

async function json<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}

export const wczytajPunkty = raz(() => json<Punkt[]>('/pack/punkty/punkty.json'));
const indeks = raz(() => wczytajPunkty().then(zbuduj));
// Nazwa, licencja i data pobrania każdego źródła (klucz = Punkt.zrodlo).
export const zrodlaPaczki = raz(() => json<Manifest>('/pack/manifest.json').then((m) => m.zrodla ?? {}));

export async function najblizsze(w: Wsp, rodzaj: RodzajPunktu, n: number, tylkoCalodobowe = false): Promise<Punkt[]> {
  return najblizszeZ(await indeks(), w, rodzaj, n, tylkoCalodobowe);
}
