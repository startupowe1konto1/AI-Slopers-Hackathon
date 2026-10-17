import { blad, odpowiedz, portal } from '../portal';
import type { Utrudnienie } from './typy';

type Element = { geomType: number; latlngs: { lat: number; lng: number }[] };
type Surowy = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  streets: string[];
  geo: Element[][];
};

// [lng, lat] jak w GeoJSON; null, gdy latlngs brak albo współrzędne nie są liczbami
function wsp(e: Element | null): [number, number][] | null {
  if (!Array.isArray(e?.latlngs)) return null;
  const w = e.latlngs.map((p) => [p?.lng, p?.lat]);
  return w.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)) ? (w as [number, number][]) : null;
}

// Daty to czas warszawski bez strefy, więc dodajemy 3 dni do samego zapisu.
function za3Dni(t: string): string {
  return new Date(Date.parse(`${t.replace(' ', 'T')}Z`) + 3 * 86_400_000).toISOString().slice(0, 19).replace('T', ' ');
}

function terazWarszawa(): string {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const c = Object.fromEntries(f.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${c.year}-${c.month}-${c.day} ${c.hour}:${c.minute}:${c.second}`;
}

// Puste end_date = do odwołania, takie wpisy zostają.
export function mapujUtrudnienia(s: Surowy[], teraz: string): Utrudnienie[] {
  const granica = za3Dni(teraz);
  return s
    .filter((x) => (!x.end_date || x.end_date >= teraz) && x.start_date <= granica)
    .map((x) => {
      const el = (Array.isArray(x.geo) ? x.geo.flat() : []).map((e) => [e?.geomType, wsp(e)] as const);
      return {
        id: String(x.id),
        nazwa: x.name,
        od: x.start_date,
        do: x.end_date,
        ulice: x.streets,
        linie: el.flatMap(([t, w]) => (t === 1 && w && w.length >= 2 ? [w] : [])),
        punkty: el.flatMap(([t, w]) => (t === 0 && w ? w : [])),
      };
    })
    .filter((u) => u.linie.length > 0 || u.punkty.length > 0);
}

export async function handler(_req: Request, env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
  try {
    const d = await portal('get_bin_utrudnienia_drogowe', {}, env.WARSAW_API_TOKEN);
    return odpowiedz(
      mapujUtrudnienia(d as Surowy[], terazWarszawa()),
      'Utrudnienia drogowe m.st. Warszawy przez dane.um.warszawa.pl',
      600,
    );
  } catch (e) {
    return blad(e);
  }
}
