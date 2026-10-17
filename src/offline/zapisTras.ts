import type { MiejsceUzytkownika, Profil, Punkt, RodzajPunktu, Wsp } from '../contracts';
// Bezpośrednio z najblizsze.ts, nie z index.tsx modułu: bez panelu i warstw MapLibre (lżej, także w testach).
import { najblizsze } from '../modules/punkty/najblizsze';
import { trasa } from './trasy';

type Szukaj = (w: Wsp, rodzaj: RodzajPunktu, n: number) => Promise<Punkt[]>;
type Cel = { od: Wsp; do: Wsp; profil: Profil };

// HANDOFF-v3 §5: z każdego miejsca do 3 miejsc schronienia PSP, AED, SOR, apteki, przychodni; między miejscami pieszo i rowerem.
const PUNKTY: [RodzajPunktu, number][] = [['schronienie_psp', 3], ['aed', 1], ['sor', 1], ['apteka', 1], ['przychodnia', 1]];

// Po 2 zapytania naraz, żeby nie obciążać publicznego serwera OSRM (DECYZJE W6: bez ponowień).
const NARAZ = 2;
// OSRM nie odpowiada (429, 5xx, brak sieci): po tylu kolejnych parach tras w linii prostej przestajemy, resztę zapiszemy następnym razem.
const MAX_PORAZEK = 2;

export async function celeTras(miejsca: MiejsceUzytkownika[], szukaj: Szukaj = najblizsze): Promise<Cel[]> {
  const cele: Cel[] = [];
  for (const m of miejsca) {
    for (const [rodzaj, n] of PUNKTY) {
      for (const p of await szukaj(m.adres, rodzaj, n).catch(() => [])) cele.push({ od: m.adres, do: { lat: p.lat, lon: p.lon }, profil: 'pieszo' });
    }
    for (const inne of miejsca) {
      if (inne !== m) for (const profil of ['pieszo', 'rower'] as const) cele.push({ od: m.adres, do: inne.adres, profil });
    }
  }
  return cele;
}

async function zapisz(miejsca: MiejsceUzytkownika[], onPostep: (zrobione: number, wszystkie: number) => void, szukaj: Szukaj): Promise<number> {
  const cele = await celeTras(miejsca, szukaj);
  let zrobione = 0;
  let poUlicach = 0;
  let porazki = 0;
  for (let i = 0; i < cele.length; i += NARAZ) {
    // trasa() bierze zapisaną trasę z IndexedDB, więc to, co już mamy, nie idzie drugi raz do OSRM.
    const wyniki = await Promise.all(cele.slice(i, i + NARAZ).map((c) => trasa(c.od, c.do, c.profil)));
    const udane = wyniki.filter((t) => t.zrodlo !== 'prosta').length;
    poUlicach += udane;
    zrobione += wyniki.length;
    onPostep(zrobione, cele.length);
    porazki = udane ? 0 : porazki + 1;
    if (porazki >= MAX_PORAZEK) break;
  }
  return poUlicach;
}

// Jeden zapis naraz w całej aplikacji: zapis uruchomiony w trakcie poprzedniego (np. po zmianie miejsc) czeka na jego koniec,
// więc limit 2 zapytań naraz obowiązuje zawsze. Zwraca liczbę tras po ulicach (nie w linii prostej).
let poprzedni: Promise<unknown> = Promise.resolve();

export function zapiszTrasyOffline(
  miejsca: MiejsceUzytkownika[],
  onPostep: (zrobione: number, wszystkie: number) => void = () => {},
  szukaj: Szukaj = najblizsze,
): Promise<number> {
  const wynik = poprzedni.then(() => zapisz(miejsca, onPostep, szukaj));
  poprzedni = wynik.catch(() => {});
  return wynik;
}
