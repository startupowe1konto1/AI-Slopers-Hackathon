import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Adres } from '../contracts';
import { znajdzAdres } from '../modules/adresy';
import { pobierzPaczke, stanPaczki } from '../offline/paczka';
import { Onboarding } from './Onboarding';

vi.mock('../modules/adresy', () => ({ znajdzAdres: vi.fn(), najblizszyAdres: vi.fn() }));
vi.mock('../offline/paczka', () => ({ stanPaczki: vi.fn(async () => null), pobierzPaczke: vi.fn() }));
vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn() }));

const adres = (id: string, ulica: string, numer: string): Adres => ({ id, ulica, numer, dzielnica: 'Praga-Południe', lat: 52.24, lon: 21.08 });
const ADRESY = [adres('1', 'Grochowska', '200'), adres('2', 'Grochowska', '202'), adres('3', 'Grochowska', '204')];

beforeEach(() => {
  vi.mocked(znajdzAdres).mockResolvedValue(ADRESY);
  vi.mocked(stanPaczki).mockResolvedValue(null);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function wpisz(tekst = 'Grochowska 20') {
  render(<Onboarding poczatkowe={[]} onGotowe={() => {}} />);
  const pole = screen.getByRole('combobox', { name: 'Dom' });
  fireEvent.change(pole, { target: { value: tekst } });
  await screen.findAllByRole('option');
  return pole;
}
const zaznaczone = () => screen.getAllByRole('option').map((o) => o.getAttribute('aria-selected'));

describe('podpowiedzi adresu z klawiatury (combobox ARIA)', () => {
  it('strzałki zmieniają zaznaczoną podpowiedź i aria-activedescendant', async () => {
    const pole = await wpisz();
    expect(pole.getAttribute('aria-expanded')).toBe('true');
    expect(zaznaczone()).toEqual(['false', 'false', 'false']);
    expect(pole.hasAttribute('aria-activedescendant')).toBe(false);

    fireEvent.keyDown(pole, { key: 'ArrowDown' });
    expect(zaznaczone()).toEqual(['true', 'false', 'false']);
    expect(pole.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id);

    fireEvent.keyDown(pole, { key: 'ArrowDown' });
    fireEvent.keyDown(pole, { key: 'ArrowDown' });
    expect(zaznaczone()).toEqual(['false', 'false', 'true']);
    fireEvent.keyDown(pole, { key: 'ArrowDown' }); // z ostatniej wraca na pierwszą
    expect(zaznaczone()).toEqual(['true', 'false', 'false']);
    fireEvent.keyDown(pole, { key: 'ArrowUp' }); // z pierwszej na ostatnią
    expect(zaznaczone()).toEqual(['false', 'false', 'true']);
    expect(pole.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[2].id);
  });

  it('Enter wybiera zaznaczony adres i zamyka listę', async () => {
    const pole = await wpisz();
    fireEvent.keyDown(pole, { key: 'ArrowDown' });
    fireEvent.keyDown(pole, { key: 'ArrowDown' });
    fireEvent.keyDown(pole, { key: 'Enter' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(pole.getAttribute('aria-expanded')).toBe('false');
    expect((pole as HTMLInputElement).value).toBe('Grochowska 202');
    expect(screen.getByText('Wybrano: Grochowska 202, Praga-Południe')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zapisz' })).toHaveProperty('disabled', false);
  });

  it('Escape zamyka listę bez wyboru', async () => {
    const pole = await wpisz();
    fireEvent.keyDown(pole, { key: 'ArrowDown' });
    fireEvent.keyDown(pole, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(pole.getAttribute('aria-expanded')).toBe('false');
    expect(pole.hasAttribute('aria-activedescendant')).toBe(false);
    expect(screen.queryByText(/^Wybrano:/)).toBeNull();
    // strzałka w dół otwiera listę z powrotem
    fireEvent.keyDown(pole, { key: 'ArrowDown' });
    expect(zaznaczone()).toEqual(['true', 'false', 'false']);
  });

  it('wyjście z pola zamyka listę, a klik w podpowiedź nadal wybiera adres', async () => {
    const pole = await wpisz();
    fireEvent.blur(pole);
    expect(screen.queryByRole('listbox')).toBeNull();

    fireEvent.keyDown(pole, { key: 'ArrowDown' });
    const opcja = screen.getAllByRole('option')[0];
    // mousedown na podpowiedzi nie zabiera fokusu polu, więc lista nie znika przed kliknięciem
    expect(fireEvent.mouseDown(opcja)).toBe(false);
    fireEvent.click(opcja);
    expect(screen.getByText('Wybrano: Grochowska 200, Praga-Południe')).toBeTruthy();
  });
});

describe('paczka offline', () => {
  it('po pobraniu przycisk mówi „Odśwież paczkę offline”', async () => {
    render(<Onboarding poczatkowe={[]} onGotowe={() => {}} />);
    const przycisk = await screen.findByRole('button', { name: 'Pobierz paczkę offline' });
    vi.mocked(pobierzPaczke).mockResolvedValue(undefined as never);
    vi.mocked(stanPaczki).mockResolvedValue({ zbudowano: '2026-10-17T21:05:00+00:00' } as Awaited<ReturnType<typeof stanPaczki>>);
    fireEvent.click(przycisk);
    expect(await screen.findByRole('button', { name: 'Odśwież paczkę offline' })).toBeTruthy();
    expect(screen.getByText(/^Paczka offline z dnia/)).toBeTruthy();
  });
});
