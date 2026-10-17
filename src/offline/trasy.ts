import { distance } from 'geokdbush';
import type { Profil, Trasa, Wsp } from '../contracts';

// Szacunek bez sieci: droga ok. 1,3 razy dłuższa niż linia prosta, pieszo 5 km/h, rowerem 15 km/h
// (te same założenia co src/modules/transport/trasy.ts).
const KRETOSC = 1.3;
const M_NA_MIN: Record<Profil, number> = { pieszo: 83, rower: 250 };

export function trasaProsta(od: Wsp, do_: Wsp, profil: Profil): Trasa {
  const dystansM = Math.round(distance(od.lon, od.lat, do_.lon, do_.lat) * 1000);
  return {
    od,
    do: do_,
    profil,
    dystansM,
    czasMin: Math.max(1, Math.round((dystansM * KRETOSC) / M_NA_MIN[profil])),
    linia: [
      [od.lon, od.lat],
      [do_.lon, do_.lat],
    ],
    zrodlo: 'prosta',
  };
}

// V1: zawsze linia prosta. V5: zapis w IndexedDB → /api/live/trasa → linia prosta.
export async function trasa(od: Wsp, do_: Wsp, profil: Profil): Promise<Trasa> {
  return trasaProsta(od, do_, profil);
}
