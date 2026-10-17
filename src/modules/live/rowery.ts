import type { Wsp } from '../../contracts';
import type { StacjaRowerowa } from '../../../server/live/typy';
import { fetchLive } from '../../offline/live-cache';
import { rowerowe } from './okolica';

export type StacjaZRowerami = { nazwa: string; wsp: Wsp; rowery: number; odlegloscM: number };

// Tylko świeże dane: liczba rowerów zmienia się co minutę, więc stan zapisany bez sieci nie wystarcza.
export async function najblizszaStacjaZRowerami(wsp: Wsp, promienM = 3000): Promise<StacjaZRowerami | null> {
  const s = await fetchLive<StacjaRowerowa[]>('rowery').catch(() => null);
  if (!s || s.zCache) return null;
  const [st] = rowerowe(s.dane, wsp, promienM, 1);
  return st ? { nazwa: st.nazwa, wsp: { lat: st.lat, lon: st.lon }, rowery: st.rowery, odlegloscM: Math.round(st.odlegloscM) } : null;
}
