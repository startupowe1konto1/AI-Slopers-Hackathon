import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../offline/polaczenie', () => ({ przygotuj: vi.fn() }));
import { przygotuj } from '../offline/polaczenie';
import { Polaczenie, opisPrzygotowania } from './Polaczenie';

const paczka = { wersja: 'x', zbudowano: '2026-10-17T16:16:00Z' };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it('opisuje każdy wynik sprawdzenia', () => {
  expect(opisPrzygotowania({ siec: true, api: true, paczka })).toBe('Jest połączenie. Dane na żywo włączone.');
  expect(opisPrzygotowania({ siec: true, api: false, paczka })).toMatch(/dane miasta na żywo chwilowo nie odpowiadają/);
  expect(opisPrzygotowania({ siec: false, api: false, paczka })).toMatch(/^Brak sieci\. Działam na danych z paczki z 17\.10/);
  expect(opisPrzygotowania({ siec: false, api: false, paczka: null })).toMatch(/^Brak sieci i brak paczki offline/);
});

it('bez sieci i bez paczki czeka na „Dalej” i dopiero po kliknięciu idzie dalej', async () => {
  const wynik = { siec: false, api: false, paczka: null };
  vi.mocked(przygotuj).mockResolvedValue(wynik);
  const gotowe = vi.fn();
  render(<Polaczenie onGotowe={gotowe} />);
  expect(screen.getByRole('status').textContent).toBe('Sprawdzam połączenie…');
  expect((await screen.findByRole('status')).textContent).toMatch(/^Brak sieci i brak paczki offline/);
  expect(gotowe).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Dalej' }));
  expect(gotowe).toHaveBeenCalledWith(wynik);
});

it('z siecią przechodzi dalej sam po 0,8 s i nie pokazuje „Dalej”', async () => {
  const wynik = { siec: true, api: true, paczka };
  vi.mocked(przygotuj).mockResolvedValue(wynik);
  const gotowe = vi.fn();
  render(<Polaczenie onGotowe={gotowe} />);
  expect(await screen.findByText('Jest połączenie. Dane na żywo włączone.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Dalej' })).toBeNull();
  expect(gotowe).not.toHaveBeenCalled();
  await vi.waitFor(() => expect(gotowe).toHaveBeenCalledWith(wynik), { timeout: 2000 });
});
