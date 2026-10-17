import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, StanLive, Wiatr } from '../../contracts';
import type { Powietrze } from '../../../server/live/typy';

vi.mock('../../offline/live-cache', () => ({ fetchLive: vi.fn() }));
vi.mock('./warstwy', () => ({ ustawDym: vi.fn(), wybierzNaMapie: vi.fn() }));
import { fetchLive } from '../../offline/live-cache';
import { ustawDym, wybierzNaMapie } from './warstwy';
import { stozekDymu, wczytajDym, zapiszDym } from './dym';
import { kartaPowietrza, ocenaPM25 } from './wskazowki';

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.23, lon: 21.02 };
const k = (online = true): KontekstWskazowek => ({ miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online });
const stan = <T,>(dane: T, zCache: boolean): StanLive<T> => ({ dane, stanNa: '2026-10-17T16:40:00Z', zrodlo: 'test', zCache });
const pow = (pm25: number): Powietrze[] => [{ stacja: 'Grochów', lat: 52.235, lon: 21.02, pm10: 30, pm25, czas: '2026-10-17 18:00:00' }];
const wiatr = (kierunekDeg: number): Wiatr[] => [{ stacja: 'Praga', lat: 52.23, lon: 21.0, kierunekDeg, predkoscMs: 3.2, czas: '2026-10-17 18:30:00' }];

function dane(p: Powietrze[] | null, w: Wiatr[] | null, zCache = false) {
  vi.mocked(fetchLive).mockImplementation((async (nazwa: string) =>
    nazwa === 'powietrze' ? p && stan(p, zCache) : w && stan(w, zCache)) as typeof fetchLive);
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.clearAllMocks());

it('progi PM2,5 wg indeksu GIOŚ (HANDOFF-v3 §3)', () => {
  expect(ocenaPM25(35)).toEqual({ poziom: 'ok', tekst: 'Powietrze dobre. Możesz wietrzyć.' });
  expect(ocenaPM25(35.1)).toEqual({ poziom: 'uwaga', tekst: 'Powietrze gorsze. Ogranicz wietrzenie i wysiłek na zewnątrz.' });
  expect(ocenaPM25(75).poziom).toBe('uwaga');
  expect(ocenaPM25(75.1)).toEqual({ poziom: 'alarm', tekst: 'Powietrze złe. Zamknij okna, wyłącz wentylację, na zewnątrz maska FFP2.' });
});

it('rekomendacja z najbliższej stacji; pomiar i wiatr w szczegółach; „Widzę dym” jako akcja', async () => {
  dane(pow(12), wiatr(270));
  const w = await kartaPowietrza(k());
  expect(w).toMatchObject({ id: 'powietrze', kolejnosc: 40, tytul: 'Powietrze i wiatr', poziom: 'ok', tekst: 'Powietrze dobre. Możesz wietrzyć.', stanNa: '18:40' });
  expect(w.szczegoly).toEqual(['PM2,5: 12,0 µg/m³, PM10: 30,0 µg/m³. Grochów, 560 m, pomiar z 18:00.', 'Wiatr z zachodu, 3,2 m/s (Praga).']);
  expect(w.akcje).toEqual([expect.objectContaining({ typ: 'przycisk', etykieta: 'Widzę dym (potem kliknij na mapie)' })]);
});

it('dym w stożku wiatru: „alarm”, instrukcja, dopisek i stożek na mapie', async () => {
  zapiszDym({ lat: 52.23, lon: 21.0 }); // 1,4 km na zachód od adresu, wiatr z zachodu
  dane(pow(12), wiatr(270));
  const w = await kartaPowietrza(k());
  expect(w.poziom).toBe('alarm');
  expect(w.tekst).toBe('Wiatr niesie dym w Twoją stronę (z zachodu, 3,2 m/s). Zamknij okna, wyłącz wentylację. Jeśli musisz wyjść, idź w poprzek kierunku wiatru.');
  expect(w.szczegoly).toContain('To kierunek wiatru, nie model rozprzestrzeniania się dymu.');
  expect(w.akcje.map((a) => a.typ)).toEqual(['mapa', 'przycisk']);
});

it('dym, ale wiatr niesie go gdzie indziej: rekomendacja z pomiaru i dopisek', async () => {
  zapiszDym({ lat: 52.23, lon: 21.0 });
  dane(pow(50), wiatr(90));
  const w = await kartaPowietrza(k());
  expect(w.poziom).toBe('uwaga');
  expect(w.szczegoly).toContain('To kierunek wiatru, nie model rozprzestrzeniania się dymu.');
});

it('„Widzę dym” zapisuje punkt kliknięty na mapie', async () => {
  dane(pow(12), wiatr(270));
  vi.mocked(wybierzNaMapie).mockResolvedValue({ lat: 52.24, lon: 21.0 });
  const a = (await kartaPowietrza(k())).akcje[0];
  if (a.typ !== 'przycisk') throw new Error('oczekiwano przycisku');
  await a.wykonaj();
  expect(wczytajDym()).toEqual({ lat: 52.24, lon: 21.0 });
});

it('bez sieci i bez zapisu: „brak”; z zapisem: ostatni stan z godziną', async () => {
  dane(null, null);
  const brak = await kartaPowietrza(k(false));
  expect(brak).toMatchObject({ poziom: 'brak', tekst: 'Brak sieci i brak zapisanego pomiaru powietrza.' });
  expect(brak.zrodlo).toContain('Monitoring jakości powietrza');
  expect(brak.zrodlo).toContain('Stacje pogodowe');
  dane(pow(12), wiatr(270), true);
  expect((await kartaPowietrza(k(false))).szczegoly).toContain('Brak sieci: ostatni zapisany stan z 18:40.');
});

it('jest wiatr, brak PM2,5: „brak” z nazwą źródła pyłu, wiatr w szczegółach', async () => {
  dane(null, wiatr(270));
  const w = await kartaPowietrza(k());
  expect(w.poziom).toBe('brak');
  expect(w.tekst).toContain('PM2,5');
  expect(w.tekst).toContain('Monitoring jakości powietrza m.st. Warszawy przez dane.um.warszawa.pl');
  expect(w.szczegoly).toContain('Wiatr z zachodu, 3,2 m/s (Praga).');
  expect(w.zrodlo).toBe('test');
  // stacje odpowiedziały, ale żadna nie mierzy PM2,5: ta sama zasada
  dane([{ stacja: 'Grochów', lat: 52.235, lon: 21.02, pm10: 30, pm25: null, czas: '2026-10-17 18:00:00' }], wiatr(270));
  const w2 = await kartaPowietrza(k());
  expect(w2.poziom).toBe('brak');
  expect(w2.tekst).toContain('Monitoring jakości powietrza');
});

it('jest PM2,5, brak wiatru: rekomendacja z pomiaru i nazwa źródła wiatru w szczegółach', async () => {
  dane(pow(12), null);
  const w = await kartaPowietrza(k());
  expect(w.poziom).toBe('ok');
  expect(w.szczegoly).toContain('Brak danych o wietrze: Stacje pogodowe m.st. Warszawy przez dane.um.warszawa.pl.');
});

it('akcja „mapa”: pokazanie rysuje punkt dymu ze stożkiem wiatru, sprzątanie go usuwa', async () => {
  const dym = { lat: 52.23, lon: 21.0 };
  zapiszDym(dym);
  dane(pow(12), wiatr(270));
  const a = (await kartaPowietrza(k())).akcje[0];
  if (a.typ !== 'mapa') throw new Error('oczekiwano akcji mapa');
  const sprzatnij = a.pokaz({} as never);
  expect(ustawDym).toHaveBeenLastCalledWith(dym, stozekDymu(dym, 270));
  sprzatnij();
  expect(ustawDym).toHaveBeenLastCalledWith(null, null);
});
