import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Adres, MiejsceUzytkownika } from '../contracts';
import { najblizszyAdres } from '../modules/adresy';
import { zapiszTrasyOffline } from '../offline/zapisTras';
import App from './App';

// Zapis tras na offline w tle (V5b): kiedy App go uruchamia. Sam zapis ma test w src/offline/zapisTras.test.ts.
let zapisane: MiejsceUzytkownika[] | undefined;
vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => zapisane),
  set: vi.fn(async (_k: string, v: MiejsceUzytkownika[]) => {
    zapisane = v;
  }),
}));
vi.mock('../offline/zapisTras', () => ({ zapiszTrasyOffline: vi.fn() }));
vi.mock('../modules/adresy', () => ({ znajdzAdres: vi.fn(async () => []), najblizszyAdres: vi.fn() }));
vi.mock('../offline/paczka', () => ({ stanPaczki: vi.fn(async () => null), pobierzPaczke: vi.fn() }));
vi.mock('../map/MapView', () => ({ MapView: () => null }));
vi.mock('./Polaczenie', async () => {
  const { useEffect } = await import('react');
  return {
    Polaczenie: ({ onGotowe }: { onGotowe: (p: { siec: boolean; api: boolean; paczka: null }) => void }) => {
      useEffect(() => onGotowe({ siec: true, api: true, paczka: null }), [onGotowe]);
      return null;
    },
  };
});
vi.mock('../modules', () => ({ moduly: [{ id: 'syreny', nazwa: 'Syreny', Panel: () => <p>Panel</p> }] }));

const adres = (id: string, lat: number): Adres => ({ id, ulica: 'X', numer: id, dzielnica: 'Wola', lat, lon: 21.0 });
const dom: MiejsceUzytkownika = { rola: 'dom', etykieta: 'Dom', adres: adres('1', 52.23) };
const praca: MiejsceUzytkownika = { rola: 'praca', etykieta: 'Praca', adres: adres('2', 52.24) };

const ustawSiec = (online: boolean) => vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
const ekranGlowny = () => screen.findByRole('combobox', { name: 'Wybrane miejsce' });

beforeEach(() => {
  zapisane = [dom, praca];
  vi.mocked(zapiszTrasyOffline).mockResolvedValue(0);
});
afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

it('online: po wejściu na ekran główny zapisuje trasy raz, bez ponownego zapisu przy zmianie widoku', async () => {
  render(<App />);
  fireEvent.change(await ekranGlowny(), { target: { value: 'praca' } });
  await waitFor(() => expect(zapiszTrasyOffline).toHaveBeenCalledTimes(1));
  expect(zapiszTrasyOffline).toHaveBeenCalledWith([dom, praca]);
  fireEvent.change(screen.getByRole('combobox', { name: 'Wybrane miejsce' }), { target: { value: 'dom' } });
  expect(zapiszTrasyOffline).toHaveBeenCalledTimes(1);
});

it('?offline=1: nie zapisuje tras', async () => {
  history.replaceState(null, '', '/?offline=1');
  render(<App />);
  await ekranGlowny();
  await act(async () => {});
  expect(zapiszTrasyOffline).not.toHaveBeenCalled();
});

it('błąd zapisu nie psuje ekranu głównego ani nie kończy się nieobsłużonym odrzuceniem', async () => {
  vi.mocked(zapiszTrasyOffline).mockRejectedValue(new Error('boom'));
  render(<App />);
  await ekranGlowny();
  await waitFor(() => expect(zapiszTrasyOffline).toHaveBeenCalledTimes(1));
  await act(async () => {});
  expect(screen.getByRole('combobox', { name: 'Wybrane miejsce' })).toBeTruthy();
});

it('ponowny zapis tych samych adresów (nowa tablica miejsc) nie uruchamia zapisu tras drugi raz', async () => {
  render(<App />);
  await ekranGlowny();
  await waitFor(() => expect(zapiszTrasyOffline).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Edytuj adresy' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Zapisz' }));
  await ekranGlowny();
  await act(async () => {});
  expect(zapiszTrasyOffline).toHaveBeenCalledTimes(1);
});

it('nowy zestaw miejsc (np. „Tutaj”) zapisuje trasy jeszcze raz', async () => {
  history.replaceState(null, '', '/?lokalizacja=52.2297,21.0122');
  const tutajAdres = adres('9', 52.2297);
  vi.mocked(najblizszyAdres).mockResolvedValue(tutajAdres);
  render(<App />);
  await ekranGlowny();
  await waitFor(() => expect(zapiszTrasyOffline).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Użyj mojej lokalizacji' }));
  await waitFor(() => expect(zapiszTrasyOffline).toHaveBeenCalledTimes(2));
  expect(vi.mocked(zapiszTrasyOffline).mock.calls[1][0].map((m) => m.rola)).toEqual(['tutaj', 'dom', 'praca']);
});

it('po utracie sieci i jej powrocie dokańcza brakujące trasy', async () => {
  const onLine = ustawSiec(true);
  render(<App />);
  await ekranGlowny();
  await waitFor(() => expect(zapiszTrasyOffline).toHaveBeenCalledTimes(1));
  onLine.mockReturnValue(false);
  act(() => void dispatchEvent(new Event('offline')));
  await act(async () => {});
  expect(zapiszTrasyOffline).toHaveBeenCalledTimes(1);
  onLine.mockReturnValue(true);
  act(() => void dispatchEvent(new Event('online')));
  await waitFor(() => expect(zapiszTrasyOffline).toHaveBeenCalledTimes(2));
});
