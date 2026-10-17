import type { Pojazd, Wsp } from '../../contracts';
import type { StacjaRowerowa, Utrudnienie } from '../../../server/live/typy';

export const R = 6371000;
export const rad = (d: number) => (d * Math.PI) / 180;

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

export function najblizszaStacja<T extends Wsp>(lista: T[], wsp: Wsp): T | null {
  let naj: T | null = null;
  for (const w of lista) if (!naj || odlegloscM(wsp, w) < odlegloscM(wsp, naj)) naj = w;
  return naj;
}

export function rowerowe(lista: StacjaRowerowa[], wsp: Wsp, promienM = 1000, n = 3): (StacjaRowerowa & { odlegloscM: number })[] {
  return lista
    .filter((s) => s.wypozycza && s.rowery > 0)
    .map((s) => ({ ...s, odlegloscM: odlegloscM(wsp, s) }))
    .filter((s) => s.odlegloscM <= promienM)
    .sort((a, b) => a.odlegloscM - b.odlegloscM)
    .slice(0, n);
}

// Odległość punktu od odcinka AB w lokalnym rzucie płaskim (wystarcza na kilka km).
function doOdcinka(wsp: Wsp, a: [number, number], b: [number, number]): number {
  const kx = Math.cos(rad(wsp.lat)) * rad(1) * R;
  const ky = rad(1) * R;
  const [ax, ay] = [(a[0] - wsp.lon) * kx, (a[1] - wsp.lat) * ky];
  const [bx, by] = [(b[0] - wsp.lon) * kx, (b[1] - wsp.lat) * ky];
  const dx = bx - ax;
  const dy = by - ay;
  const t = dx || dy ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(ax + t * dx, ay + t * dy);
}

export function utrudnieniaWOkolicy(lista: Utrudnienie[], wsp: Wsp, promienM: number): { u: Utrudnienie; odlegloscM: number }[] {
  return lista
    .map((u) => {
      const odcinki = u.linie.flatMap((l) => l.slice(1).map((b, i) => doOdcinka(wsp, l[i], b)));
      const punkty = [...u.punkty, ...u.linie.filter((l) => l.length === 1).map((l) => l[0])].map(([lon, lat]) => odlegloscM(wsp, { lat, lon }));
      return { u, odlegloscM: Math.min(...odcinki, ...punkty) };
    })
    .filter((x) => x.odlegloscM <= promienM)
    .sort((a, b) => a.odlegloscM - b.odlegloscM);
}

const KIERUNKI = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const kierunekNazwa = (deg: number): string => KIERUNKI[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

const fmt = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
export const godzina = (iso: string): string => fmt.format(new Date(iso));

const jedno = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
export const liczba = (v: number): string => v.toLocaleString('pl-PL', jedno);

export function odleglosc(m: number): string {
  const r = Math.round(m / 10) * 10;
  return r < 1000 ? `${r} m` : `${liczba(m / 1000)} km`;
}

// '2026-12-31 09:02:53' → '31.12'; pusta data (bez końca) → null
export const dzien = (d: string): string | null => (d ? `${d.slice(8, 10)}.${d.slice(5, 7)}` : null);

// Format dat z API: 'YYYY-MM-DD HH:MM:SS', czas warszawski (sv-SE daje ten układ)
const fmtApi = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Warsaw' });
export const terazWarszawa = (): string => fmtApi.format(new Date());
