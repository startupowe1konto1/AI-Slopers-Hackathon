import type { Pojazd, Wiatr, Wsp } from '../../contracts';

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export function odlegloscM(a: Wsp, b: Wsp): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const wOkolicy = (pojazdy: Pojazd[], wsp: Wsp, promienM: number): Pojazd[] =>
  pojazdy.filter((p) => odlegloscM(wsp, p) <= promienM);

export function podsumuj(pojazdy: Pojazd[]): { autobusy: number; tramwaje: number; linie: string[] } {
  const linie = [...new Set(pojazdy.map((p) => p.linia))].sort((a, b) => a.localeCompare(b, 'pl', { numeric: true }));
  return {
    autobusy: pojazdy.filter((p) => p.typ === 'autobus').length,
    tramwaje: pojazdy.filter((p) => p.typ === 'tramwaj').length,
    linie,
  };
}

export function najblizszaStacja(wiatr: Wiatr[], wsp: Wsp): Wiatr | null {
  let naj: Wiatr | null = null;
  for (const w of wiatr) if (!naj || odlegloscM(wsp, w) < odlegloscM(wsp, naj)) naj = w;
  return naj;
}

const KIERUNKI = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const kierunekNazwa = (deg: number): string => KIERUNKI[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

const fmt = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
export const godzina = (iso: string): string => fmt.format(new Date(iso));
