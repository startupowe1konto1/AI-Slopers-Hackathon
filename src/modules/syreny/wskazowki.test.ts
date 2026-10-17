import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek } from '../../contracts';

vi.mock('./wynik', async (oryginal) => ({ ...(await oryginal<typeof import('./wynik')>()), wynikSyreny: vi.fn() }));
vi.mock('./druk', () => ({ drukujKarte: vi.fn() }));
vi.mock('./okregi', async (o) => ({ ...(await o<typeof import('./okregi')>()), wczytajOkregi: vi.fn(async () => []) }));
import { drukujKarte } from './druk';
import { DOPISEK_OKREGOW, LEGENDA_OKREGOW, wczytajOkregi } from './okregi';
import { wynikSyreny } from './wynik';
import { DOPISEK } from './teksty';
import { tekstSyren, wskazowkiSyren } from './wskazowki';

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k = (online = true): KontekstWskazowek => ({ miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online });
const w = (normalnie: string, blackout: string, blackoutSzacunek = false) =>
  ({ adresId: '1', normalnie, blackout, blackoutSzacunek }) as Parameters<typeof tekstSyren>[0];

// Domyślnie brak okręgów, więc testy karty z S1 nie zależą od tego pliku.
beforeEach(() => {
  vi.mocked(wczytajOkregi).mockResolvedValue([]);
});
afterEach(() => vi.clearAllMocks());

it('tekst: najpierw zasięg normalnie, potem „jeśli zabraknie prądu”', () => {
  expect(tekstSyren(w('75+', '65-70'))).toBe('Jesteś w zasięgu syreny (75 dB i więcej). Jeśli zabraknie prądu (65–70 dB), możesz jej nie usłyszeć w mieszkaniu.');
  expect(tekstSyren(w('75+', 'ponizej_65', true))).toBe('Jesteś w zasięgu syreny (75 dB i więcej). Jeśli zabraknie prądu (poniżej 65 dB, szacunek), możesz jej nie usłyszeć.');
  expect(tekstSyren(w('75+', '70-75'))).toBe('Jesteś w zasięgu syreny (75 dB i więcej). Jeśli zabraknie prądu (70–75 dB), nadal powinna być słyszalna na zewnątrz.');
  expect(tekstSyren(w('70-75', '70-75'))).toBe('Jesteś w zasięgu syreny (70–75 dB). Jeśli zabraknie prądu, poziom się nie zmienia.');
  expect(tekstSyren(w('65-70', '65-70'))).toBe('Syrena może być tu słabo słyszalna (65–70 dB), zwłaszcza w mieszkaniu.');
  expect(tekstSyren(w('ponizej_65', 'ponizej_65'))).toBe('Syrena prawdopodobnie nie jest tu słyszalna (poniżej 65 dB). Włącz Alert RCB, żeby alarm do Ciebie dotarł.');
});

it('karta: poziom z oceny, kroki i dopisek o modelu w szczegółach, druk jako akcja', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('75+', 'ponizej_65'));
  const [karta] = await wskazowkiSyren(k());
  expect(karta).toMatchObject({ id: 'syreny', kolejnosc: 10, tytul: 'Syreny', poziom: 'uwaga' });
  expect(karta.szczegoly).toContain('Włącz Alert RCB w telefonie.');
  expect(karta.szczegoly).toContain(DOPISEK);
  expect(karta.akcje).toEqual([expect.objectContaining({ typ: 'przycisk', etykieta: 'Drukuj kartę z adresami' })]);
});

it('poziomy: słychać = ok, nie słychać = alarm', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('70-75', '70-75'));
  expect((await wskazowkiSyren(k()))[0].poziom).toBe('ok');
  vi.mocked(wynikSyreny).mockResolvedValue(w('ponizej_65', 'ponizej_65'));
  expect((await wskazowkiSyren(k()))[0].poziom).toBe('alarm');
});

it('brak danych dla adresu i brak paczki bez sieci: karta „brak” z wyjaśnieniem', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(null);
  expect((await wskazowkiSyren(k()))[0]).toMatchObject({ poziom: 'brak', tekst: 'Brak danych o syrenach dla tego miejsca.' });
  vi.mocked(wynikSyreny).mockRejectedValue(new Error('Nie pobrano'));
  expect((await wskazowkiSyren(k(false)))[0].tekst).toMatch(/^Brak sieci/);
  expect((await wskazowkiSyren(k(true)))[0].tekst).toMatch(/^Źródło chwilowo niedostępne/);
});

it('akcja „mapa” z okręgami najbliższych syren i opis okręgów w szczegółach', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('75+', '75+'));
  vi.mocked(wczytajOkregi).mockResolvedValue([{ nr: 'a', typ: 'cyfrowa', lat: 52.2459, lon: 21.0874, r75: 345, r70: 641, r65: 1191 }]);
  const [karta] = await wskazowkiSyren(k());
  expect(karta.akcje.map((a) => a.typ)).toEqual(['mapa', 'przycisk']);
  expect(karta.szczegoly).toContain('Syrena cyfrowa, 20 m od Ciebie: mieścisz się w okręgu 75 dB.');
  expect(karta.szczegoly).toContain(DOPISEK_OKREGOW);
  expect(karta.szczegoly).toContain(LEGENDA_OKREGOW);
  const i = karta.szczegoly!.indexOf('Syrena cyfrowa, 20 m od Ciebie: mieścisz się w okręgu 75 dB.');
  expect(karta.szczegoly!.slice(i + 1, i + 3)).toEqual([LEGENDA_OKREGOW, DOPISEK_OKREGOW]); // legenda zaraz po liniach okręgów, przed dopiskiem
});

it('bez pliku okręgów karta działa dalej, bez akcji mapy', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('75+', '75+'));
  vi.mocked(wczytajOkregi).mockRejectedValue(new Error('brak'));
  const [karta] = await wskazowkiSyren(k());
  expect(karta.akcje.map((a) => a.typ)).toEqual(['przycisk']);
  expect(karta.szczegoly).not.toContain(DOPISEK_OKREGOW);
  expect(karta.szczegoly).not.toContain(LEGENDA_OKREGOW);
});

it('ostrzeżenie o blackoucie 65–70 dB nie jest zielone: poziom „uwaga”, a bez takiego ostrzeżenia zostaje „ok”', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('75+', '65-70'));
  expect((await wskazowkiSyren(k()))[0].poziom).toBe('uwaga');
  vi.mocked(wynikSyreny).mockResolvedValue(w('70-75', '65-70'));
  expect((await wskazowkiSyren(k()))[0].poziom).toBe('uwaga');
  vi.mocked(wynikSyreny).mockResolvedValue(w('75+', '70-75'));
  expect((await wskazowkiSyren(k()))[0].poziom).toBe('ok');
});

it('druk: bez miejsca „Tutaj” (to lokalizacja GPS, nie adres), a gdy nic innego nie zostaje, karta nie jest pusta', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('75+', '75+'));
  const tutaj = { rola: 'tutaj' as const, etykieta: 'Tutaj', adres };
  const dom = { rola: 'dom' as const, etykieta: 'Dom', adres };
  const drukuj = async (miejsca: KontekstWskazowek['miejsca']) => {
    const [karta] = await wskazowkiSyren({ ...k(), miejsca });
    const druk = karta.akcje.find((a) => a.typ === 'przycisk');
    if (druk?.typ !== 'przycisk') throw new Error('brak przycisku druku');
    await druk.wykonaj();
  };
  await drukuj([tutaj, dom]);
  expect(drukujKarte).toHaveBeenLastCalledWith([dom]);
  await drukuj([tutaj]);
  expect(drukujKarte).toHaveBeenLastCalledWith([tutaj]);
});
