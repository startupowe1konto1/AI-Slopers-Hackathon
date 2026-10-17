import { afterEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, Punkt, Wsp } from '../../contracts';

vi.mock('./najblizsze', async (o) => ({ ...(await o<typeof import('./najblizsze')>()), najblizsze: vi.fn(), zrodlaPaczki: vi.fn() }));
vi.mock('../../offline/trasy', () => ({
  trasa: vi.fn(async (od: Wsp, d: Wsp) => ({ od, do: d, profil: 'pieszo', dystansM: 120, czasMin: 2, linia: [], zrodlo: 'osrm' })),
}));
import { najblizsze, zrodlaPaczki } from './najblizsze';
import { kartaSchronienia, wskazowkiPunktow } from './wskazowki';

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k = (online = true): KontekstWskazowek => ({ miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online });
const psp = (id: string, dLat: number, dostepnosc: string): Punkt => ({ id, rodzaj: 'schronienie_psp', nazwa: `ul. Garwolińska ${id}`, dostepnosc, lat: adres.lat + dLat, lon: adres.lon, zrodlo: 'psp' });

afterEach(() => vi.clearAllMocks());

it('najbliższe miejsce z trasą pieszą, dwa kolejne w szczegółach, link do aplikacji PSP', async () => {
  vi.mocked(zrodlaPaczki).mockResolvedValue({ psp: { nazwa: 'Miejsca schronienia według PSP (gdziesieukryc.pl)', licencja: 'za zgodą PSP', url: 'https://gdziesieukryc.pl', pobrano: '2026-10-17' } });
  vi.mocked(najblizsze).mockResolvedValue([psp('9', 0.001, 'Na żądanie'), psp('11', 0.003, 'Całodobowa'), psp('13', 0.005, 'Określone godziny')]);
  const w = await kartaSchronienia(k());
  expect(w).toMatchObject({ id: 'schronienie', kolejnosc: 20, tytul: 'Najbliższe miejsce schronienia według PSP', poziom: 'ok' });
  expect(w.tekst).toBe('ul. Garwolińska 9, 120 m, ok. 2 min pieszo. Dostępność: na żądanie.');
  expect(w.szczegoly).toEqual(['2. ul. Garwolińska 11, 330 m, całodobowa', '3. ul. Garwolińska 13, 560 m, określone godziny']);
  expect(w.akcje[0]).toMatchObject({ typ: 'trasa', nazwa: 'ul. Garwolińska 9', profil: 'pieszo' });
  expect(w.akcje[1]).toMatchObject({ typ: 'link', etykieta: 'Otwórz w aplikacji PSP' });
  expect(w.akcje).toHaveLength(4);
  expect(w.zrodlo).toBe('Miejsca schronienia według PSP (gdziesieukryc.pl)');
});

it('dalej niż 1 km: poziom „uwaga”; bez paczki offline: karta „brak”', async () => {
  vi.mocked(zrodlaPaczki).mockRejectedValue(new Error('brak'));
  vi.mocked(najblizsze).mockResolvedValue([psp('9', 0.02, 'Na żądanie')]);
  expect((await kartaSchronienia(k())).poziom).toBe('uwaga');
  vi.mocked(najblizsze).mockRejectedValue(new Error('brak paczki'));
  const w = await kartaSchronienia(k(false));
  expect(w).toMatchObject({ poziom: 'brak', akcje: [] });
  expect(w.tekst).toMatch(/^Brak sieci/);
});

it('pusty wynik i błąd źródła przy sieci: karta „brak” z nazwą źródła', async () => {
  vi.mocked(zrodlaPaczki).mockRejectedValue(new Error('brak'));
  vi.mocked(najblizsze).mockResolvedValue([]);
  expect(await kartaSchronienia(k())).toMatchObject({
    poziom: 'brak',
    tekst: 'Brak miejsc schronienia według PSP w promieniu 20 km.',
    akcje: [],
    zrodlo: 'Miejsca schronienia według PSP (gdziesieukryc.pl)',
  });
  vi.mocked(najblizsze).mockRejectedValue(new Error('HTTP 500'));
  expect((await kartaSchronienia(k(true))).tekst).toMatch(/^Źródło chwilowo niedostępne/);
});

it('wskazowkiPunktow: karta schronienia i karta medyczna, w kolejności 20 i 30', async () => {
  vi.mocked(zrodlaPaczki).mockResolvedValue({});
  vi.mocked(najblizsze).mockResolvedValue([psp('9', 0.001, 'Na żądanie')]);
  const karty = await wskazowkiPunktow(k());
  expect(karty.map((w) => [w.id, w.kolejnosc])).toEqual([['schronienie', 20], ['medyczna', 30]]);
});
