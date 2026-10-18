import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { MiejsceUzytkownika } from '../contracts';
import { pobierzPaczke } from '../offline/paczka';
import { sprawdzPolaczenie } from '../offline/polaczenie';
import { zapiszTrasyOffline } from '../offline/zapisTras';
import App from './App';

// Wersja tylko online (VITE_TYLKO_ONLINE=1, Vercel): bez ekranu „Sprawdzam połączenie”, paczki i zapisu tras.
let zapisane: MiejsceUzytkownika[] | undefined;
vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => zapisane),
  set: vi.fn(async (_k: string, v: MiejsceUzytkownika[]) => {
    zapisane = v;
  }),
}));
vi.mock('../offline/zapisTras', () => ({ zapiszTrasyOffline: vi.fn() }));
vi.mock('../offline/polaczenie', () => ({ sprawdzPolaczenie: vi.fn() }));
vi.mock('../modules/adresy', () => ({ znajdzAdres: vi.fn(async () => []), najblizszyAdres: vi.fn() }));
vi.mock('../offline/paczka', () => ({ stanPaczki: vi.fn(async () => null), pobierzPaczke: vi.fn() }));
vi.mock('../map/MapView', () => ({ MapView: () => null }));
vi.mock('./Polaczenie', () => ({ Polaczenie: () => <p>Sprawdzam połączenie…</p> }));
vi.mock('../modules', () => ({ moduly: [{ id: 'syreny', nazwa: 'Syreny', Panel: () => <p>Panel</p> }] }));

const dom: MiejsceUzytkownika = { rola: 'dom', etykieta: 'Dom', adres: { id: '1', ulica: 'X', numer: '1', dzielnica: 'Wola', lat: 52.23, lon: 21.0 } };

beforeEach(() => {
  vi.stubEnv('VITE_TYLKO_ONLINE', '1');
  zapisane = [dom];
  vi.mocked(sprawdzPolaczenie).mockResolvedValue({ siec: true, api: false });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

it('od razu ekran główny, bez ekranu „Sprawdzam połączenie”; status z sprawdzenia w tle', async () => {
  render(<App />);
  expect(await screen.findByRole('combobox', { name: 'Wybrane miejsce' })).toBeTruthy();
  expect(screen.queryByText('Sprawdzam połączenie…')).toBeNull();
  expect(await screen.findByText('Online · bez danych na żywo')).toBeTruthy();
});

it('nie zapisuje tras na offline', async () => {
  render(<App />);
  await screen.findByText('Online · bez danych na żywo');
  expect(zapiszTrasyOffline).not.toHaveBeenCalled();
});

it('ekran adresów bez przycisku „Pobierz paczkę offline”', async () => {
  zapisane = undefined;
  render(<App />);
  expect(await screen.findByRole('button', { name: 'Użyj mojej lokalizacji' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Pobierz paczkę offline' })).toBeNull();
  expect(pobierzPaczke).not.toHaveBeenCalled();
});
