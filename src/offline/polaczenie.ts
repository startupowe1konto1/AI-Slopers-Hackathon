import { pobierzPaczke, stanPaczki } from './paczka';
import { wymuszonyOffline } from './siec';

export type WynikPolaczenia = { siec: boolean; api: boolean };
export type Przygotowanie = WynikPolaczenia & { paczka: { wersja: string; zbudowano: string } | null };

const LIMIT_API_MS = 6000;

// Sieć = nasz serwer odpowiedział czymkolwiek (/api/live/trasa bez parametrów daje od razu 400, offline się odrzuca).
// API = /api/live/wiatr zwróciło dane (klucz i portal miasta działają). Portal bywa wolny (do 10 s po stronie serwera),
// więc jego limit jest osobny i nie mówi nic o sieci: timeout wiatru to tylko api:false.
export async function sprawdzPolaczenie(f: typeof fetch = fetch, limitMs = 4000): Promise<WynikPolaczenia> {
  if (wymuszonyOffline()) return { siec: false, api: false };
  const siecDziala = async () => {
    try {
      await f('/api/live/trasa', { signal: AbortSignal.timeout(limitMs), cache: 'no-store' });
      return true;
    } catch {
      return false;
    }
  };
  const apiDziala = async () => {
    try {
      const r = await f('/api/live/wiatr', { signal: AbortSignal.timeout(LIMIT_API_MS), cache: 'no-store' });
      return r.ok;
    } catch {
      return false;
    }
  };
  const [siec, api] = await Promise.all([siecDziala(), apiDziala()]);
  return { siec, api: siec && api };
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
