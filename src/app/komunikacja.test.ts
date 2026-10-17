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
  opisPrzejazdu: (p: Przejazd) => `Linia ${p.linia}.`,
  opisPlanu: (p: PlanKomunikacji) => (p.warianty.length ? `Pieszo ${p.pieszoMin} min.` : 'Brak połączenia.'),
}));
vi.mock('../offline/trasy', () => ({ trasa: vi.fn() }));
vi.mock('../map/trasaNaMapie', () => ({ pokazPlan: vi.fn(() => () => {}), pokazTrase: vi.fn(() => () => {}) }));

afterEach(() => vi.clearAllMocks());

const mapa = { isStyleLoaded: () => true } as unknown as MapLibreMap;
const od = { lat: 52.23, lon: 21.0 };
const cel = { lat: 52.25, lon: 21.03 };
const z = { id: '700901', nazwa: 'Marszałkowska 01', lat: 52.231, lon: 21.005 };
const doP = { id: '701307', nazwa: 'Plac Zbawiciela 07', lat: 52.249, lon: 21.029 };
const p: Przejazd = {
  linia: '4', typ: 'tramwaj', kierunek: 'Wyścigi', z, do: doP, przystanki: [z, doP], liczbaPrzystankow: 1,
  dojscieM: 400, dojscieMin: 5, czekanieMin: 5, przejazdMin: 8, zejscieM: 150, zejscieMin: 2, razemMin: 20,
};
const plan = (x: Partial<PlanKomunikacji> = {}): PlanKomunikacji => ({ warianty: [p], pieszoM: 3000, pieszoMin: 36, pieszoSzybciej: false, blackout: false, ...x });
const pieszo = (a: typeof od, b: typeof od): Trasa => ({ od: a, do: b, profil: 'pieszo', dystansM: 400, czasMin: 5, linia: [[a.lon, a.lat], [b.lon, b.lat]], zrodlo: 'osrm' });

it('rysuje dojście, przejazd po przystankach i zejście; opis z najbliższym odjazdem', async () => {
  vi.mocked(planKomunikacji).mockResolvedValue(plan());
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  vi.mocked(najblizszyOdjazd).mockResolvedValue({ godzina: '22:58', zaMin: 6, zCache: false });
  const w = await wykonajKomunikacje(mapa, od, cel, false);
  expect(planKomunikacji).toHaveBeenCalledWith(od, cel, { blackout: false });
  expect(najblizszyOdjazd).toHaveBeenCalledWith('700901', '4');
  expect(vi.mocked(pokazPlan).mock.calls[0][1].map((o) => o.rodzaj)).toEqual(['pieszo', 'tramwaj', 'pieszo']);
  expect(vi.mocked(pokazPlan).mock.calls[0][2]).toEqual([[21.005, 52.231], [21.029, 52.249]]);
  expect(w.opis).toBe('Linia 4. Najbliższy odjazd: 22:58 (za 6 min, według rozkładu).');
});

it('bez godziny odjazdu opis zostaje, a w szczegółach jest powód', async () => {
  vi.mocked(planKomunikacji).mockResolvedValue(plan({ pieszoSzybciej: true }));
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  vi.mocked(najblizszyOdjazd).mockResolvedValue(null);
  const w = await wykonajKomunikacje(mapa, od, cel, false);
  expect(w.opis).toBe('Linia 4.');
  expect(w.szczegoly).toContain('Pieszo 36 min.');
  expect(w.szczegoly).toContain('Według rozkładu ta linia dziś już nie jedzie.');
});

it('linia, która dziś już nie jedzie, ustępuje miejsca linii z odjazdem', async () => {
  const p2: Przejazd = { ...p, linia: '175', typ: 'autobus', razemMin: 25 };
  vi.mocked(planKomunikacji).mockResolvedValue(plan({ warianty: [p, p2] }));
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  vi.mocked(najblizszyOdjazd).mockImplementation(async (_id, linia) => (linia === '175' ? { godzina: '23:10', zaMin: 4, zCache: false } : null));
  const w = await wykonajKomunikacje(mapa, od, cel, false);
  expect(w.opis).toBe('Linia 175. Najbliższy odjazd: 23:10 (za 4 min, według rozkładu).');
  expect(w.szczegoly).toContain('Inna opcja: Linia 4. Według rozkładu ta linia dziś już nie jedzie.');
});

it('bez połączenia pokazuje trasę pieszo i opis planu', async () => {
  vi.mocked(planKomunikacji).mockResolvedValue(plan({ warianty: [], pieszoSzybciej: true }));
  vi.mocked(trasa).mockImplementation(async (a, b) => pieszo(a, b));
  const w = await wykonajKomunikacje(mapa, od, cel, true);
  expect(pokazTrase).toHaveBeenCalledTimes(1);
  expect(pokazPlan).not.toHaveBeenCalled();
  expect(w.opis).toBe('Brak połączenia.');
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
