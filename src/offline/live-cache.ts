import { get, set } from 'idb-keyval';
import type { StanLive } from '../contracts';
import { wymuszonyOffline } from './siec';

// Pobiera /api/live/<nazwa>; bez sieci zwraca ostatni zapisany stan (zCache: true) albo null.
export async function fetchLive<T>(nazwa: string): Promise<StanLive<T> | null> {
  const klucz = `live:${nazwa}`;
  if (navigator.onLine && !wymuszonyOffline()) {
    try {
      const r = await fetch(`/api/live/${nazwa}`, { signal: AbortSignal.timeout(10000) });
      if (r.ok) {
        const stan = (await r.json()) as StanLive<T>;
        await set(klucz, stan);
        return stan;
      }
    } catch {
      // brak sieci lub timeout: przechodzimy do zapisanego stanu
    }
  }
  const zapis = await get<StanLive<T>>(klucz);
  return zapis ? { ...zapis, zCache: true } : null;
}
