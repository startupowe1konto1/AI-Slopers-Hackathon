import { delMany, keys } from 'idb-keyval';

// Wersja tylko online (Vercel, kod QR dla publiczności): telefon nie zapisuje niczego do pracy bez sieci.
// Bez service workera, paczki, mapy w OPFS, zapisanych tras i ostatnich danych na żywo.
// Włącza ją VITE_TYLKO_ONLINE=1 przy buildzie (vercel.json); Cloudflare i testy e2e działają z trybem offline.
export const tylkoOnline = (): boolean => import.meta.env.VITE_TYLKO_ONLINE === '1';

// Sprząta po wizycie sprzed wersji tylko online: mapę w OPFS, znacznik paczki, zapisane trasy i dane na żywo.
// Stary service worker i jego cache usuwa sw.js z vite.config.ts. Adresy (klucz „miejsca”) zostają.
export async function usunZapisyOffline(): Promise<void> {
  try {
    localStorage.removeItem('paczka');
  } catch {
    // brak dostępu do pamięci: nie ma czego sprzątać
  }
  try {
    await (await navigator.storage.getDirectory()).removeEntry('warszawa.pmtiles');
  } catch {
    // mapy nie było albo przeglądarka nie ma OPFS
  }
  try {
    await delMany((await keys()).filter((k) => /^(live|trasa):/.test(String(k))));
  } catch {
    // brak IndexedDB
  }
}
