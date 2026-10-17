import { distance } from 'geokdbush';
import { get, set } from 'idb-keyval';
import type { Profil, Trasa, Wsp } from '../contracts';
import { wymuszonyOffline } from './siec';

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

const r5 = (x: number) => x.toFixed(5);
const punkt = (w: Wsp) => `${r5(w.lon)},${r5(w.lat)}`;
export const kluczTrasy = (od: Wsp, do_: Wsp, profil: Profil) => `trasa:${profil}:${punkt(od)};${punkt(do_)}`;

type OdpowiedzTrasy = Pick<Trasa, 'dystansM' | 'czasMin' | 'linia'>;

// Kolejność: zapis w telefonie → OSRM przez /api/live/trasa (gdy jest sieć) → linia prosta.
export async function trasa(od: Wsp, do_: Wsp, profil: Profil): Promise<Trasa> {
  const klucz = kluczTrasy(od, do_, profil);
  const zapis = await get<Trasa>(klucz).catch(() => undefined);
  if (zapis) return { ...zapis, zrodlo: 'osrm-zapisana' };
  if (navigator.onLine && !wymuszonyOffline()) {
    try {
      const q = new URLSearchParams({ od: punkt(od), do: punkt(do_), profil });
      const r = await fetch(`/api/live/trasa?${q}`, { signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const o = (await r.json()) as OdpowiedzTrasy;
        const t: Trasa = { od, do: do_, profil, dystansM: o.dystansM, czasMin: o.czasMin, linia: o.linia, zrodlo: 'osrm' };
        await set(klucz, t).catch(() => {});
        return t;
      }
    } catch {
      // brak sieci albo OSRM nie odpowiada: linia prosta
    }
  }
  return trasaProsta(od, do_, profil);
}
