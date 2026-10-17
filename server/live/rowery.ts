import { BladPortalu, blad, odpowiedz } from '../portal';
import type { StacjaRowerowa } from './typy';

type Opis = { station_id: string; name: string; lat: number; lon: number };
type Stan = { station_id: string; num_bikes_available: number; is_renting: boolean; is_installed: boolean };

const GBFS = 'https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_vw/pl';

export function mapujRowery(info: Opis[], status: Stan[]): StacjaRowerowa[] {
  const stany = new Map(status.map((s) => [s.station_id, s]));
  return info.flatMap((o) => {
    const s = stany.get(o.station_id);
    if (!s) return [];
    return [{ nazwa: o.name, lat: o.lat, lon: o.lon, rowery: s.num_bikes_available, wypozycza: s.is_renting && s.is_installed }];
  });
}

// GBFS jest publiczny, więc bez portal() i bez klucza
async function stacje(plik: string): Promise<unknown[]> {
  let r: Response;
  try {
    r = await fetch(`${GBFS}/${plik}`, { signal: AbortSignal.timeout(10000) });
  } catch {
    throw new BladPortalu('timeout', plik);
  }
  if (!r.ok) throw new BladPortalu('klucz_lub_usluga', `${plik}: HTTP ${r.status}`);
  const d = (await r.json()) as { data?: { stations?: unknown } };
  if (!Array.isArray(d.data?.stations)) throw new BladPortalu('schemat', plik);
  return d.data.stations;
}

export async function handler(_req: Request, _env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
  try {
    const [info, status] = await Promise.all([stacje('station_information.json'), stacje('station_status.json')]);
    return odpowiedz(mapujRowery(info as Opis[], status as Stan[]), 'Veturilo (GBFS nextbike)', 60);
  } catch (e) {
    return blad(e);
  }
}
