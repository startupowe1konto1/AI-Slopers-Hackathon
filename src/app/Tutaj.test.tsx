import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Adres, MiejsceUzytkownika } from '../contracts';
import { najblizszyAdres } from '../modules/adresy';
import App from './App';
import { Onboarding } from './Onboarding';

// „Użyj mojej lokalizacji” w onboardingu i w pasku (V2b). Adresy z paczki i zapis w IndexedDB są podstawione.
let zapisane: MiejsceUzytkownika[] | undefined;
vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => zapisane),
  set: vi.fn(async (_k: string, v: MiejsceUzytkownika[]) => {
    zapisane = v;
  }),
}));
vi.mock('../modules/adresy', () => ({ znajdzAdres: vi.fn(async () => []), najblizszyAdres: vi.fn() }));
vi.mock('../offline/paczka', () => ({ stanPaczki: vi.fn(async () => null), pobierzPaczke: vi.fn() }));
vi.mock('../map/MapView', () => ({ MapView: () => null }));
vi.mock('../modules', () => ({ moduly: [{ id: 'syreny', nazwa: 'Syreny', Panel: () => <p>Panel</p> }] }));

const grochowska: Adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const marszalkowska: Adres = { id: '2', ulica: 'Marszałkowska', numer: '1', dzielnica: 'Śródmieście', lat: 52.2297, lon: 21.0122 };
const dom: MiejsceUzytkownika = { rola: 'dom', etykieta: 'Dom', adres: grochowska };
const tutaj = (adres: Adres): MiejsceUzytkownika => ({ rola: 'tutaj', etykieta: 'Tutaj', adres });

beforeEach(() => {
  zapisane = undefined;
  history.replaceState(null, '', '/?lokalizacja=52.2297,21.0122');
});
afterEach(() => {
  cleanup();
  history.replaceState(null, '', '/');
  vi.resetAllMocks();
});

describe('onboarding', () => {
  it('„Użyj mojej lokalizacji” zapisuje „Tutaj” i przechodzi dalej bez wpisywania adresu', async () => {
    vi.mocked(najblizszyAdres).mockResolvedValue(marszalkowska);
    const gotowe = vi.fn();
    render(<Onboarding poczatkowe={[]} onGotowe={gotowe} />);
    fireEvent.click(screen.getByRole('button', { name: 'Użyj mojej lokalizacji' }));
    await waitFor(() => expect(gotowe).toHaveBeenCalled());
    expect(zapisane).toEqual([tutaj(marszalkowska)]);
  });

  it('wpisane już adresy zostają razem z „Tutaj”', async () => {
    vi.mocked(najblizszyAdres).mockResolvedValue(marszalkowska);
    const gotowe = vi.fn();
    render(<Onboarding poczatkowe={[dom]} onGotowe={gotowe} />);
    fireEvent.click(screen.getByRole('button', { name: 'Użyj mojej lokalizacji' }));
    await waitFor(() => expect(gotowe).toHaveBeenCalled());
    expect(zapisane).toEqual([tutaj(marszalkowska), dom]);
  });

  it('poza Warszawą pokazuje komunikat, nic nie zapisuje i nie zamyka formularza', async () => {
    history.replaceState(null, '', '/?lokalizacja=52.5,21.0');
    vi.mocked(najblizszyAdres).mockResolvedValue(null);
    const gotowe = vi.fn();
    render(<Onboarding poczatkowe={[]} onGotowe={gotowe} />);
    fireEvent.click(screen.getByRole('button', { name: 'Użyj mojej lokalizacji' }));
    expect(await screen.findByText(/Jesteś poza Warszawą/)).toBeTruthy();
    expect(gotowe).not.toHaveBeenCalled();
    expect(zapisane).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Użyj mojej lokalizacji' })).toHaveProperty('disabled', false);
  });

  it('zwykły zapis adresów nie gubi wcześniejszego „Tutaj”', async () => {
    const gotowe = vi.fn();
    render(<Onboarding poczatkowe={[tutaj(marszalkowska), dom]} onGotowe={gotowe} />);
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
    await waitFor(() => expect(gotowe).toHaveBeenCalled());
    expect(zapisane).toEqual([tutaj(marszalkowska), dom]);
  });
});

describe('pasek', () => {
  it('przycisk „Tutaj” dodaje miejsce na początek listy i je wybiera', async () => {
    zapisane = [dom];
    vi.mocked(najblizszyAdres).mockResolvedValue(marszalkowska);
    render(<App />);
    const wybor = await screen.findByRole<HTMLSelectElement>('combobox', { name: 'Wybrane miejsce' });
    expect(wybor.value).toBe('dom');
    fireEvent.click(screen.getByRole('button', { name: 'Użyj mojej lokalizacji' }));
    await waitFor(() => expect(wybor.value).toBe('tutaj'));
    expect(wybor.textContent).toContain('Tutaj: Marszałkowska 1');
    expect(wybor.textContent).toContain('Dom: Grochowska 200');
    expect(zapisane).toEqual([tutaj(marszalkowska), dom]);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('poza Warszawą pokazuje komunikat w pasku i zostawia dotychczasowe miejsca', async () => {
    history.replaceState(null, '', '/?lokalizacja=52.5,21.0');
    zapisane = [dom];
    vi.mocked(najblizszyAdres).mockResolvedValue(null);
    render(<App />);
    const wybor = await screen.findByRole<HTMLSelectElement>('combobox', { name: 'Wybrane miejsce' });
    fireEvent.click(screen.getByRole('button', { name: 'Użyj mojej lokalizacji' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/poza Warszawą/);
    expect(wybor.value).toBe('dom');
    expect(zapisane).toEqual([dom]);
    expect(screen.getByRole('button', { name: 'Użyj mojej lokalizacji' })).toHaveProperty('disabled', false);
  });
});
