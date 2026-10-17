import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import type { Pojazd, StanLive, Wiatr } from '../../contracts';
import { fetchLive } from '../../offline/live-cache';
import { ustawPojazdy } from './warstwy';
import { Panel } from './Panel';

vi.mock('../../offline/live-cache', () => ({ fetchLive: vi.fn() }));
vi.mock('./warstwy', () => ({ ustawPojazdy: vi.fn() }));

const DOM = { lat: 52.2317, lon: 21.0064 };
const STAN_NA = '2026-10-17T12:56:01.528Z'; // 14:56 w Warszawie
const poj = (linia: string, typ: Pojazd['typ'], dLat: number): Pojazd => ({ linia, typ, lat: DOM.lat + dLat, lon: DOM.lon, czas: '2026-10-17 14:55:50' });
const stan = <T,>(dane: T, zCache = false): StanLive<T> => ({ dane, stanNa: STAN_NA, zrodlo: 'ZTM', zCache });
const WIATR: Wiatr[] = [
  { stacja: 'Stacja Torwar', lat: 52.2244, lon: 21.0343, kierunekDeg: 237, predkoscMs: 1.3, czas: '2026-10-17 14:40:00' },
  { stacja: 'Stacja Bielany', lat: 52.29241, lon: 20.97288, kierunekDeg: 90, predkoscMs: 0, czas: '2026-10-17 14:40:00' },
];

function odpowiedzi(pojazdy: StanLive<Pojazd[]> | null, wiatr: StanLive<Wiatr[]> | null = stan(WIATR)) {
  vi.mocked(fetchLive).mockImplementation(async (nazwa: string) => (nazwa === 'pojazdy' ? pojazdy : wiatr) as never);
}

const panel = (online = true) => render(<Panel miejsca={[]} wybrane={DOM} online={online} />);

beforeEach(() => odpowiedzi(stan([poj('9', 'tramwaj', 0.001), poj('128', 'autobus', 0.002), poj('22', 'tramwaj', 0.003), poj('175', 'autobus', 0.05)])));
afterEach(() => {
  cleanup();
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
  odpowiedzi(null, null);
  panel(false);
  expect((await screen.findAllByText('Brak sieci i brak zapisanego stanu. Połącz się, żeby zobaczyć dane na żywo.')).length).toBe(2);
});

it('błąd źródła przy działającej sieci', async () => {
  odpowiedzi(null, null);
  panel(true);
  expect((await screen.findAllByText('Źródło danych nie odpowiada. Spróbujemy ponownie za 20 s.')).length).toBe(2);
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
