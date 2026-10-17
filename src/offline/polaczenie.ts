import { pobierzPaczke, stanPaczki } from './paczka';
import { wymuszonyOffline } from './siec';

export type WynikPolaczenia = { siec: boolean; api: boolean };
export type Przygotowanie = WynikPolaczenia & { paczka: { wersja: string; zbudowano: string } | null };

// Sieć = nasz serwer odpowiedział czymkolwiek. API = /api/live/wiatr zwróciło dane (klucz i portal miasta działają).
export async function sprawdzPolaczenie(f: typeof fetch = fetch, limitMs = 4000): Promise<WynikPolaczenia> {
  if (wymuszonyOffline()) return { siec: false, api: false };
  try {
    const r = await f('/api/live/wiatr', { signal: AbortSignal.timeout(limitMs), cache: 'no-store' });
    return { siec: true, api: r.ok };
  } catch {
    return { siec: false, api: false };
  }
}

// Jedno przygotowanie naraz (StrictMode uruchamia efekt dwa razy); postęp trafia do ostatniego słuchacza.
let wTrakcie: Promise<Przygotowanie> | null = null;
let postep: (tekst: string) => void = () => {};

export function przygotuj(onPostep: (tekst: string) => void): Promise<Przygotowanie> {
  postep = onPostep;
  wTrakcie ??= (async () => {
    const w = await sprawdzPolaczenie();
    let paczka = await stanPaczki();
    if (w.siec && !paczka) {
      try {
        await pobierzPaczke((z, n) => postep(`Jest połączenie. Pobieram paczkę offline: ${z} z ${n}`));
        paczka = await stanPaczki();
      } catch {
        // bez paczki aplikacja działa online; spróbujemy przy następnym uruchomieniu
      }
    }
    return { ...w, paczka };
  })().finally(() => {
    wTrakcie = null;
  });
  return wTrakcie;
}
