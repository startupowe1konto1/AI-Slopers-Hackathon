import type { Pojazd } from '../../src/contracts';
import { blad, odpowiedz, portal } from '../portal';

type Surowy = { Lines: string; Lat: number; Lon: number; Time: string };

// API zwraca też pozycje sprzed dni i lat; zostawiamy tylko 5 minut od najnowszej.
export function mapujPojazdy(s: Surowy[], typ: Pojazd['typ']): Pojazd[] {
  const czasy = s.map((x) => Date.parse(x.Time.replace(' ', 'T')));
  const naj = Math.max(...czasy);
  return s
    .filter((_, i) => naj - czasy[i] <= 5 * 60_000)
    .map((x) => ({ linia: x.Lines, typ, lat: x.Lat, lon: x.Lon, czas: x.Time }));
}

export async function handler(_req: Request, env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
  try {
    const [a, t] = await Promise.all([
      portal('get_ztm_lokalizacja_pojazdow', { type: 1 }, env.WARSAW_API_TOKEN),
      portal('get_ztm_lokalizacja_pojazdow', { type: 2 }, env.WARSAW_API_TOKEN),
    ]);
    return odpowiedz(
      [...mapujPojazdy(a as Surowy[], 'autobus'), ...mapujPojazdy(t as Surowy[], 'tramwaj')],
      'ZTM przez dane.um.warszawa.pl',
      15,
    );
  } catch (e) {
    return blad(e);
  }
}
