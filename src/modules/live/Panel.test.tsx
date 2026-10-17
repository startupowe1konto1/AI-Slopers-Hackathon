import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Pojazd, StanLive, Wiatr } from '../../contracts';
import type { Powietrze, StacjaRowerowa, Utrudnienie } from '../../../server/live/typy';
import { fetchLive } from '../../offline/live-cache';
import { ustawDym, ustawPojazdy, ustawRowery, ustawUtrudnienia, wybierzNaMapie } from './warstwy';
import { Panel } from './Panel';

vi.mock('../../offline/live-cache', () => ({ fetchLive: vi.fn() }));
vi.mock('./warstwy', () => ({ ustawPojazdy: vi.fn(), ustawDym: vi.fn(), ustawRowery: vi.fn(), ustawUtrudnienia: vi.fn(), wybierzNaMapie: vi.fn() }));

const DOM = { lat: 52.2317, lon: 21.0064 };
const STAN_NA = '2026-10-17T12:56:01.528Z'; // 14:56 w Warszawie
const poj = (linia: string, typ: Pojazd['typ'], dLat: number): Pojazd => ({ linia, typ, lat: DOM.lat + dLat, lon: DOM.lon, czas: '2026-10-17 14:55:50' });
const stan = <T,>(dane: T, zCache = false): StanLive<T> => ({ dane, stanNa: STAN_NA, zrodlo: 'ZTM', zCache });
const WIATR: Wiatr[] = [
  { stacja: 'Stacja Torwar', lat: 52.2244, lon: 21.0343, kierunekDeg: 237, predkoscMs: 1.3, czas: '2026-10-17 14:40:00' },
  { stacja: 'Stacja Bielany', lat: 52.29241, lon: 20.97288, kierunekDeg: 90, predkoscMs: 0, czas: '2026-10-17 14:40:00' },
];

const POWIETRZE: Powietrze[] = [
  { stacja: 'Warszawa-Grochowska', lat: 52.2457, lon: 21.0806, pm10: 8.9, pm25: 7.5, czas: '2026-10-17 15:00:00' },
  { stacja: 'Warszawa, Al. Niepodległości', lat: 52.2193, lon: 21.0047, pm10: 14.8, pm25: 10.3, czas: '2026-10-17 15:00:00' },
];
const ROWERY: StacjaRowerowa[] = [
  { nazwa: 'Pałac Kultury', lat: DOM.lat + 0.002, lon: DOM.lon, rowery: 6, wypozycza: true },
  { nazwa: 'Koneser', lat: 52.256, lon: 21.046, rowery: 20, wypozycza: true },
];
const UTRUDNIENIA: Utrudnienie[] = [
  { id: '1', nazwa: 'Remont Marszałkowskiej', od: '2026-10-01 06:00:00', do: '2026-12-31 09:02:53', ulice: ['Marszałkowska'], linie: [[[DOM.lon - 0.01, DOM.lat + 0.003], [DOM.lon + 0.01, DOM.lat + 0.003]]], punkty: [] },
  { id: '2', nazwa: 'Przebudowa Dyrekcyjnej', od: '2026-10-19 06:00:00', do: '2026-12-31 00:00:00', ulice: ['Dyrekcyjna'], linie: [[[20.888, 52.198], [20.894, 52.2]]], punkty: [] },
];

type Odp = { pojazdy?: StanLive<Pojazd[]> | null; wiatr?: StanLive<Wiatr[]> | null; powietrze?: StanLive<Powietrze[]> | null; rowery?: StanLive<StacjaRowerowa[]> | null; utrudnienia?: StanLive<Utrudnienie[]> | null };
function odpowiedzi(pojazdy: StanLive<Pojazd[]> | null, wiatr: StanLive<Wiatr[]> | null = stan(WIATR), reszta: Odp = {}) {
  const o: Odp = { pojazdy, wiatr, powietrze: stan(POWIETRZE), rowery: stan(ROWERY), utrudnienia: stan(UTRUDNIENIA), ...reszta };
  vi.mocked(fetchLive).mockImplementation(async (nazwa: string) => o[nazwa as keyof Odp] as never);
}
const wszystkoNull = { powietrze: null, rowery: null, utrudnienia: null };

const panel = (online = true) => render(<Panel miejsca={[]} wybrane={DOM} online={online} />);

beforeEach(() => odpowiedzi(stan([poj('9', 'tramwaj', 0.001), poj('128', 'autobus', 0.002), poj('22', 'tramwaj', 0.003), poj('175', 'autobus', 0.05)])));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  vi.useRealTimers();
});

it('ładowanie: zanim przyjdą dane, pokazuje stan ładowania', () => {
  vi.mocked(fetchLive).mockReturnValue(new Promise(() => {}));
  panel();
  expect(screen.getAllByLabelText(/ładowanie/i).length).toBeGreaterThan(0);
});

it('pokazuje pojazdy do 1 km, ich linie i godzinę stanu, a na mapę przekazuje tylko te z okolicy', async () => {
  panel();
  expect(await screen.findByText('Autobusy: 1 · Tramwaje: 2')).toBeTruthy();
  expect(screen.getByText('Linie: 9, 22, 128')).toBeTruthy();
  expect(screen.getAllByText('Stan na 14:56').length).toBeGreaterThan(0);
  // efekt przekazujący pojazdy na mapę może ruszyć chwilę po pojawieniu się tekstu
  await waitFor(() => expect(vi.mocked(ustawPojazdy).mock.calls.at(-1)?.[0].map((p) => p.linia)).toEqual(['9', '128', '22']));
});

it('wiatr z najbliższej stacji: skąd wieje, prędkość i stacja', async () => {
  panel();
  expect(await screen.findByText('Wiatr z południowego zachodu, 1,3 m/s')).toBeTruthy();
  expect(screen.getByText(/Stacja Torwar, pomiar z 14:40/)).toBeTruthy();
});

it('gdy w okolicy nie ma tramwajów, a w mieście jeżdżą, mówi to wprost', async () => {
  odpowiedzi(stan([poj('128', 'autobus', 0.001), poj('9', 'tramwaj', 0.05)]));
  panel();
  expect(await screen.findByText('W Twojej okolicy nie jeżdżą teraz tramwaje.')).toBeTruthy();
});

it('brak danych: nic w promieniu 1 km', async () => {
  odpowiedzi(stan([poj('175', 'autobus', 0.05)]));
  panel();
  expect(await screen.findByText('W promieniu 1 km nie ma teraz żadnego autobusu ani tramwaju.')).toBeTruthy();
});

it('brak sieci z zapisanym stanem: pokazuje ostatni stan z godziną', async () => {
  odpowiedzi(stan([poj('9', 'tramwaj', 0.001)], true), stan(WIATR, true));
  panel(false);
  expect((await screen.findAllByText('Brak sieci. Ostatni stan z 14:56.')).length).toBe(2);
  expect(screen.getByText('Autobusy: 0 · Tramwaje: 1')).toBeTruthy();
});

it('brak sieci bez zapisanego stanu: prosi o połączenie', async () => {
  odpowiedzi(null, null, wszystkoNull);
  panel(false);
  // jeden komunikat zamiast pięciu takich samych
  expect((await screen.findAllByText('Brak sieci i brak zapisanego stanu. Połącz się, żeby zobaczyć dane na żywo.')).length).toBe(1);
});

it('błąd źródła przy działającej sieci', async () => {
  odpowiedzi(null, null, wszystkoNull);
  panel(true);
  expect((await screen.findAllByText('Źródło danych nie odpowiada. Spróbujemy ponownie za 20 s.')).length).toBe(1);
});

it('źródło padło, ale jest zapisany stan: pokazuje go z godziną', async () => {
  odpowiedzi(stan([poj('9', 'tramwaj', 0.001)], true));
  panel(true);
  expect(await screen.findByText('Źródło nie odpowiada. Ostatni stan z 14:56.')).toBeTruthy();
});

it('online odświeża co 20 s, offline nie odświeża', async () => {
  vi.useFakeTimers();
  panel(true);
  await act(async () => vi.advanceTimersByTime(20_000));
  expect(vi.mocked(fetchLive).mock.calls.filter(([n]) => n === 'pojazdy')).toHaveLength(2);
  cleanup();
  vi.mocked(fetchLive).mockClear();
  panel(false);
  await act(async () => vi.advanceTimersByTime(60_000));
  expect(vi.mocked(fetchLive).mock.calls.filter(([n]) => n === 'pojazdy')).toHaveLength(1);
});

it('po zamknięciu panelu czyści pojazdy z mapy', async () => {
  const { unmount } = panel();
  await screen.findByText('Autobusy: 1 · Tramwaje: 2');
  unmount();
  expect(vi.mocked(ustawPojazdy).mock.calls.at(-1)?.[0]).toEqual([]);
});

it('jedno źródło padło: komunikat tylko w jego sekcji', async () => {
  odpowiedzi(stan([poj('9', 'tramwaj', 0.001)]), stan(WIATR), { rowery: null });
  panel(true);
  expect((await screen.findAllByText('Źródło danych nie odpowiada. Spróbujemy ponownie za 20 s.')).length).toBe(1);
  expect(screen.getByText('Autobusy: 0 · Tramwaje: 1')).toBeTruthy();
});

it('jakość powietrza ze stacji najbliższej adresowi', async () => {
  panel();
  expect(await screen.findByText('PM2,5: 10,3 µg/m³ · PM10: 14,8 µg/m³')).toBeTruthy();
  expect(screen.getByText(/Warszawa, Al. Niepodległości, 1,4 km, pomiar z 15:00/)).toBeTruthy();
});

it('Veturilo: stacje z wolnymi rowerami do 1 km, z odległością; te same na mapie', async () => {
  panel();
  expect(await screen.findByText('Pałac Kultury: 6 rowerów, 220 m')).toBeTruthy();
  expect(screen.queryByText(/Koneser/)).toBeNull();
  await waitFor(() => expect(vi.mocked(ustawRowery).mock.calls.at(-1)?.[0].map((s) => s.nazwa)).toEqual(['Pałac Kultury']));
});

it('utrudnienia do 2 km z datą końca; te same na mapie', async () => {
  panel();
  expect(await screen.findByText('Remont Marszałkowskiej')).toBeTruthy();
  expect(screen.getByText('do 31.12, 330 m')).toBeTruthy();
  expect(screen.queryByText('Przebudowa Dyrekcyjnej')).toBeNull();
  await waitFor(() => expect(vi.mocked(ustawUtrudnienia).mock.calls.at(-1)?.[0].map((u) => u.id)).toEqual(['1']));
});

it('dym: punkt z mapy, stożek w kierunku wiatru i zastrzeżenie; można usunąć', async () => {
  const DYM = { lat: 52.235, lon: 21.01 };
  vi.mocked(wybierzNaMapie).mockResolvedValue(DYM);
  panel();
  fireEvent.click(await screen.findByRole('button', { name: 'Widzę dym — tutaj' }));
  expect(await screen.findByText('To kierunek wiatru, nie model rozprzestrzeniania się dymu.')).toBeTruthy();
  expect(screen.getByText('Szary stożek na mapie pokazuje, dokąd wiatr niesie dym (3 km). Pomiar: Stacja Torwar, 1,3 m/s.')).toBeTruthy();
  await waitFor(() => {
    const [miejsce, stozek] = vi.mocked(ustawDym).mock.calls.at(-1)!;
    expect(miejsce).toEqual(DYM);
    expect(stozek?.length).toBeGreaterThan(3);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Usuń zaznaczenie dymu' }));
  await waitFor(() => expect(vi.mocked(ustawDym).mock.calls.at(-1)).toEqual([null, null]));
});

it('dym przy bezwietrznej pogodzie: punkt bez stożka i wyjaśnienie', async () => {
  vi.mocked(wybierzNaMapie).mockResolvedValue({ lat: 52.2924, lon: 20.9729 }); // przy stacji Bielany, 0 m/s
  panel();
  fireEvent.click(await screen.findByRole('button', { name: 'Widzę dym — tutaj' }));
  expect(await screen.findByText('Bezwietrznie: nie da się wskazać, dokąd wiatr niesie dym.')).toBeTruthy();
  await waitFor(() => expect(vi.mocked(ustawDym).mock.calls.at(-1)?.[1]).toBeNull());
});

it('wiatr ze wschodu: poprawny przyimek przed „wschodu”', async () => {
  odpowiedzi(stan([poj('9', 'tramwaj', 0.001)]), stan([{ ...WIATR[0], kierunekDeg: 90 }]));
  panel();
  expect(await screen.findByText('Wiatr ze wschodu, 1,3 m/s')).toBeTruthy();
});
