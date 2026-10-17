import { beforeEach, expect, it, vi } from 'vitest';
import type { MiejsceUzytkownika, Profil, Punkt, RodzajPunktu, Trasa, Wsp } from '../contracts';

vi.mock('./trasy', () => ({
  trasa: vi.fn(async (od: Wsp, d: Wsp, profil: string) => ({ od, do: d, profil, dystansM: 1, czasMin: 1, linia: [], zrodlo: 'osrm' })),
}));
import { trasa } from './trasy';
import { celeTras, zapiszTrasyOffline } from './zapisTras';

const adres = (id: string, lat: number) => ({ id, ulica: 'X', numer: id, dzielnica: 'Wola', lat, lon: 21.0 });
const miejsca: MiejsceUzytkownika[] = [
  { rola: 'dom', etykieta: 'Dom', adres: adres('1', 52.23) },
  { rola: 'praca', etykieta: 'Praca', adres: adres('2', 52.24) },
];
const szukaj = async (w: Wsp, rodzaj: RodzajPunktu, n: number): Promise<Punkt[]> =>
  Array.from({ length: n }, (_, i) => ({ id: `${rodzaj}-${i}`, rodzaj, nazwa: rodzaj, lat: w.lat + 0.001 * (i + 1), lon: w.lon, zrodlo: 'x' }));

const wynik = (od: Wsp, d: Wsp, profil: Profil, zrodlo: Trasa['zrodlo']): Trasa => ({ od, do: d, profil, dystansM: 1, czasMin: 1, linia: [], zrodlo });

beforeEach(() => vi.mocked(trasa).mockReset()); // wraca do domyślnej implementacji z vi.mock

it('cele: 3 PSP + AED + SOR + apteka + przychodnia pieszo z każdego miejsca, między miejscami pieszo i rowerem', async () => {
  const c = await celeTras(miejsca, szukaj);
  // na miejsce: 7 punktów + 1 inne miejsce × 2 profile = 9; dwa miejsca = 18
  expect(c).toHaveLength(18);
  expect(c.filter((x) => x.profil === 'rower')).toHaveLength(2);
  expect(c[0]).toMatchObject({ od: miejsca[0].adres, do: { lon: 21.0 }, profil: 'pieszo' });
  expect(c[0].do.lat).toBeCloseTo(52.231, 6); // 52.23 + 0.001 w liczbach zmiennoprzecinkowych
});

it('cele: „Tutaj” jest początkiem tras, ale nie celem (karta bliskich i tak go pomija)', async () => {
  const tutaj: MiejsceUzytkownika = { rola: 'tutaj', etykieta: 'Tutaj', adres: adres('3', 52.25) };
  const c = await celeTras([...miejsca, tutaj], szukaj);
  expect(c.some((x) => x.do === tutaj.adres)).toBe(false);
  // z „Tutaj”: 7 punktów + 2 miejsca × 2 profile = 11
  expect(c.filter((x) => x.od === tutaj.adres)).toHaveLength(11);
});

it('cele: błąd wyszukiwania punktów (np. brak paczki) nie przerywa, zostają trasy między miejscami', async () => {
  const c = await celeTras(miejsca, async () => {
    throw new Error('brak paczki');
  });
  expect(c).toHaveLength(4); // 2 miejsca × (pieszo + rower)
});

it('zapisuje każdą trasę i raportuje postęp', async () => {
  const postep = vi.fn();
  expect(await zapiszTrasyOffline(miejsca, postep, szukaj)).toBe(18);
  expect(trasa).toHaveBeenCalledTimes(18);
  expect(postep).toHaveBeenLastCalledWith(18, 18);
});

it('zwraca tylko trasy po ulicach: linia prosta nie liczy się jako zapisana', async () => {
  vi.mocked(trasa).mockImplementation(async (od, d, profil) => wynik(od, d, profil, profil === 'rower' ? 'prosta' : 'osrm'));
  expect(await zapiszTrasyOffline(miejsca, undefined, szukaj)).toBe(16);
});

it('najwyżej 2 zapytania naraz, także gdy zapis uruchomiono dwa razy (np. po zmianie miejsc)', async () => {
  let naraz = 0;
  let max = 0;
  vi.mocked(trasa).mockImplementation(async (od, d, profil) => {
    max = Math.max(max, ++naraz);
    await new Promise((r) => setTimeout(r, 1));
    naraz--;
    return wynik(od, d, profil, 'osrm');
  });
  await Promise.all([zapiszTrasyOffline(miejsca, undefined, szukaj), zapiszTrasyOffline(miejsca, undefined, szukaj)]);
  expect(trasa).toHaveBeenCalledTimes(36);
  expect(max).toBe(2);
});

it('gdy OSRM nie odpowiada (dwie kolejne pary tras w linii prostej): przestaje, bez dalszych zapytań', async () => {
  vi.mocked(trasa).mockImplementation(async (od, d, profil) => wynik(od, d, profil, 'prosta'));
  expect(await zapiszTrasyOffline(miejsca, undefined, szukaj)).toBe(0);
  expect(trasa).toHaveBeenCalledTimes(4);
});

it('pojedyncza trasa bez wyniku nie zatrzymuje zapisu pozostałych', async () => {
  let n = 0;
  vi.mocked(trasa).mockImplementation(async (od, d, profil) => wynik(od, d, profil, ++n === 3 ? 'prosta' : 'osrm'));
  expect(await zapiszTrasyOffline(miejsca, undefined, szukaj)).toBe(17);
  expect(trasa).toHaveBeenCalledTimes(18);
});

it('błąd jednego zapisu nie psuje kolejnego uruchomienia', async () => {
  vi.mocked(trasa).mockRejectedValueOnce(new Error('boom'));
  await expect(zapiszTrasyOffline(miejsca, undefined, szukaj)).rejects.toThrow('boom');
  vi.mocked(trasa).mockImplementation(async (od, d, profil) => wynik(od, d, profil, 'osrm'));
  expect(await zapiszTrasyOffline(miejsca, undefined, szukaj)).toBe(18);
});
