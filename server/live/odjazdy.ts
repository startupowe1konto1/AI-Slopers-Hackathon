import { blad, odpowiedz, portal } from '../portal';
import type { Odjazdy } from './typy';

// Wiersz API to lista par { key, value }; pola: czas, brygada, kierunek, trasa, symbol_1, symbol_2.
type Pole = { key: string; value: string | null };

// Godziny 'HH:MM:SS' z rozkładu na cały dzień → 'HH:MM' rosnąco. Kursy po północy mają 24:xx i więcej.
export function mapujOdjazdy(surowe: Pole[][]): string[] {
  return surowe
    .map((w) => (Array.isArray(w) ? w.find((p) => p.key === 'czas')?.value : null) ?? '')
    .filter((c) => /^\d{2}:\d{2}/.test(c))
    .map((c) => c.slice(0, 5))
    .sort();
}

// ?przystanek=<id z GTFS, np. 700901 = zespół 7009 + słupek 01>&linia=<np. 523>
export async function handler(req: Request, env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const przystanek = q.get('przystanek') ?? '';
  const linia = (q.get('linia') ?? '').toUpperCase();
  if (!/^\d{6}$/.test(przystanek) || !/^[A-Z0-9]{1,4}$/.test(linia)) {
    return Response.json({ blad: 'parametry' }, { status: 400 });
  }
  try {
    // linia, która nie staje na przystanku, daje null (→ schemat); nieznany przystanek daje 500
    const s = await portal(
      'get_ztm_odjazdy_linii_z_przystanku',
      { busstopId: przystanek.slice(0, 4), busstopNr: przystanek.slice(4), line: linia },
      env.WARSAW_API_TOKEN,
    );
    return odpowiedz<Odjazdy>(
      { przystanek, linia, odjazdy: mapujOdjazdy(s as Pole[][]) },
      'ZTM przez dane.um.warszawa.pl',
      3600,
    );
  } catch (e) {
    return blad(e);
  }
}
