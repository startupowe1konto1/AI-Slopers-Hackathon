import { afterEach, expect, it, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Trasa } from '../contracts';
import { najblizszyOdjazd, planKomunikacji, type PlanKomunikacji, type Przejazd } from '../modules/transport/komunikacja';
import { trasa } from '../offline/trasy';
import { pokazPlan, pokazTrase } from '../map/trasaNaMapie';
import { wykonajKomunikacje } from './akcje';

vi.mock('../modules/transport/komunikacja', () => ({
  planKomunikacji: vi.fn(),
  najblizszyOdjazd: vi.fn(),
  opisPrzejazdu: (p: Przejazd) => `Linia ${p.linia}, ${p.razemMin} min.`,
  DOPISEK_BLACKOUT: 'Jeśli zabraknie prądu, tramwaje i metro staną. Pokazuję tylko autobusy.',
}));
vi.mock('../offline/trasy', () => ({ trasa: vi.fn() }));
vi.mock('../map/trasaNaMapie', () => ({ pokazPlan: vi.fn(() => () => {}), pokazTrase: vi.fn(() => () => {}) }));

afterEach(() => {
  vi.clearAllMocks();
  history.replaceState(null, '', '/');
});

const mapa = { isStyleLoaded: () => true } as unknown as MapLibreMap;
const od = { lat: 52.23, lon: 21.0 };
const cel = { lat: 52.25, lon: 21.03 };
const z = { id: '700901', nazwa: 'Marszałkowska 01', lat: 52.231, lon: 21.005 };
const doP = { id: '701307', nazwa: 'Plac Zbawiciela 07', lat: 52.249, lon: 21.029 };
const p: Przejazd = {
  linia: '4', typ: 'tramwaj', kierunek: 'Wyścigi', z, do: doP, przystanki: [z, doP], liczbaPrzystankow: 1,
  ksztalt: [[21.005, 52.231], [21.02, 52.24], [21.029, 52.249]],
  dojscieM: 400, dojscieMin: 5, czekanieMin: 5, przejazdMin: 8, zejscieM: 150, zejscieMin: 2, razemMin: 20,
};
const plan = (x: Partial<PlanKomunikacji> = {}): PlanKomunikacji => ({ warianty: [p], pieszoM: 3000, pieszoMin: 36, pieszoSzybciej: false, blackout: false, ...x });
const pieszo = (a: typeof od, b: typeof od): Trasa => ({ od: a, do: b, profil: 'pieszo', dystansM: 400, czasMin: 5, linia: [[a.lon, a.lat], [b.lon, b.lat]], zrodlo: 'osrm' });
const BLACKOUT = 'Jeśli zabraknie prądu, tramwaje i metro staną. Pokazuję tylko autobusy.';

it('rysuje dojście, przejazd po przebiegu linii, zejście i cel; „Razem” z prawdziwym odjazdem, na który zdążysz', async () => {
  vi.mocked(planKomunikacji).mockResolvedValue(plan());
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  vi.mocked(najblizszyOdjazd).mockResolvedValue({ godzina: '22:58', zaMin: 6, zCache: false });
  const w = await wykonajKomunikacje(mapa, od, cel, false);
  expect(planKomunikacji).toHaveBeenCalledWith(od, cel, { blackout: false });
  // najwcześniej po dojściu do przystanku (5 min)
  expect(najblizszyOdjazd).toHaveBeenCalledWith('700901', '4', expect.any(Date), 5);
  const [, odcinki, przystanki, punktCelu] = vi.mocked(pokazPlan).mock.calls[0];
  expect(odcinki.map((o) => o.rodzaj)).toEqual(['pieszo', 'tramwaj', 'pieszo']);
  expect(odcinki[1].linia).toEqual(p.ksztalt);
  expect(przystanki).toEqual([[21.005, 52.231], [21.029, 52.249]]);
  expect(punktCelu).toEqual([21.03, 52.25]);
  // 6 min do odjazdu + 8 przejazdu + 2 zejścia
  expect(w.opis).toBe('Linia 4, 16 min. Odjazd, na który zdążysz: 22:58 (za 6 min, według rozkładu).');
});

it('gdy pieszo szybciej: trasa pieszo na mapie z jednym czasem (po ulicach), bez innych opcji', async () => {
  vi.mocked(planKomunikacji).mockResolvedValue(plan({ pieszoSzybciej: true, pieszoMin: 4 }));
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  const w = await wykonajKomunikacje(mapa, od, cel, false);
  expect(pokazTrase).toHaveBeenCalledTimes(1);
  expect(pokazPlan).not.toHaveBeenCalled();
  expect(w.opis).toBe('Pieszo będzie szybciej. 400 m po ulicach, pieszo ok. 5 min.');
  expect(w.szczegoly).toBeUndefined();
});

it('bez połączenia: trasa pieszo i jasny komunikat; przy blackoucie dopisek', async () => {
  vi.mocked(planKomunikacji).mockResolvedValue(plan({ warianty: [], pieszoSzybciej: true, blackout: true }));
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  const w = await wykonajKomunikacje(mapa, od, cel, true);
  expect(pokazTrase).toHaveBeenCalledTimes(1);
  expect(w.opis).toBe('W pobliżu nie ma bezpośredniego połączenia. 400 m po ulicach, pieszo ok. 5 min.');
  expect(w.szczegoly).toEqual([BLACKOUT]);
});

it('godzina odjazdu: „dziś już nie jedzie”, „bez sieci” (także w symulacji ?offline=1) albo „nie mam godziny”', async () => {
  vi.mocked(planKomunikacji).mockResolvedValue(plan());
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  vi.mocked(najblizszyOdjazd).mockResolvedValue('brak');
  expect((await wykonajKomunikacje(mapa, od, cel, false)).szczegoly).toEqual(['Według rozkładu ta linia dziś już nie jedzie.']);
  vi.mocked(najblizszyOdjazd).mockResolvedValue(null);
  expect((await wykonajKomunikacje(mapa, od, cel, false)).szczegoly).toEqual(['Nie mam teraz godziny odjazdu.']);
  history.replaceState(null, '', '/?offline=1');
  const w = await wykonajKomunikacje(mapa, od, cel, false);
  expect(w.opis).toBe('Linia 4, 20 min.');
  expect(w.szczegoly).toEqual(['Bez sieci nie pokażę godziny odjazdu.']);
});

it('linia, która dziś już nie jedzie, ustępuje miejsca linii z odjazdem', async () => {
  const p2: Przejazd = { ...p, linia: '175', typ: 'autobus', razemMin: 25 };
  vi.mocked(planKomunikacji).mockResolvedValue(plan({ warianty: [p, p2] }));
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  vi.mocked(najblizszyOdjazd).mockImplementation(async (_id, linia) => (linia === '175' ? { godzina: '23:10', zaMin: 9, zCache: false } : 'brak'));
  const w = await wykonajKomunikacje(mapa, od, cel, false);
  expect(w.opis).toBe('Linia 175, 19 min. Odjazd, na który zdążysz: 23:10 (za 9 min, według rozkładu).');
  expect(w.szczegoly).toEqual(['Inna opcja: Linia 4, 20 min. Według rozkładu ta linia dziś już nie jedzie.']);
});

it('kurs za więcej niż godzinę (np. pierwszy poranny) nie liczy „Razem” i idzie na koniec', async () => {
  const p2: Przejazd = { ...p, linia: '175', typ: 'autobus', razemMin: 25 };
  vi.mocked(planKomunikacji).mockResolvedValue(plan({ warianty: [p, p2] }));
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  vi.mocked(najblizszyOdjazd).mockImplementation(async (_id, linia) =>
    linia === '4' ? { godzina: '04:51', zaMin: 290, zCache: false } : { godzina: '00:30', zaMin: 12, zCache: false },
  );
  const w = await wykonajKomunikacje(mapa, od, cel, false);
  expect(w.opis).toBe('Linia 175, 22 min. Odjazd, na który zdążysz: 00:30 (za 12 min, według rozkładu).');
  expect(w.szczegoly).toEqual(['Inna opcja: Linia 4, 20 min. Najbliższy kurs dopiero o 04:51.']);
});

it('spóźniony plan nic nie rysuje', async () => {
  vi.mocked(planKomunikacji).mockResolvedValue(plan());
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  vi.mocked(najblizszyOdjazd).mockResolvedValue(null);
  const w = await wykonajKomunikacje(mapa, od, cel, false, () => false);
  expect(pokazPlan).not.toHaveBeenCalled();
  expect(w.opis).toBeUndefined();
});

it('bez danych komunikacji (brak paczki) mówi, co zrobić', async () => {
  vi.mocked(planKomunikacji).mockRejectedValue(new Error('linie.json: HTTP 404'));
  const w = await wykonajKomunikacje(mapa, od, cel, false);
  expect(w.opis).toMatch(/paczk/);
  expect(pokazPlan).not.toHaveBeenCalled();
});
