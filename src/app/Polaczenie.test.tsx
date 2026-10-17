import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../offline/polaczenie', () => ({ przygotuj: vi.fn() }));
import { przygotuj } from '../offline/polaczenie';
import { Polaczenie, opisPrzygotowania } from './Polaczenie';

const paczka = { wersja: 'x', zbudowano: '2026-10-17T16:16:00Z' };

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

it('opisuje każdy wynik sprawdzenia', () => {
  expect(opisPrzygotowania({ siec: true, api: true, paczka })).toBe('Jest połączenie. Dane na żywo włączone. Trasy na offline zapisuję w tle.');
  expect(opisPrzygotowania({ siec: true, api: false, paczka })).toMatch(/dane miasta na żywo chwilowo nie odpowiadają/);
  expect(opisPrzygotowania({ siec: true, api: true, paczka: null })).toBe(
    'Jest połączenie. Dane na żywo włączone. Trasy na offline zapisuję w tle. Nie udało się pobrać paczki offline. Spróbuję przy następnym uruchomieniu.',
  );
  expect(opisPrzygotowania({ siec: true, api: false, paczka: null })).toMatch(
    /dane miasta na żywo chwilowo nie odpowiadają\. Nie udało się pobrać paczki offline\. Spróbuję przy następnym uruchomieniu\.$/,
  );
  expect(opisPrzygotowania({ siec: false, api: false, paczka })).toMatch(/^Brak sieci\. Działam na danych z paczki z 17\.10/);
  expect(opisPrzygotowania({ siec: false, api: false, paczka: null })).toMatch(/^Brak sieci i brak paczki offline/);
});

it('bez sieci i bez paczki czeka na „Dalej” i dopiero po kliknięciu idzie dalej', async () => {
  const wynik = { siec: false, api: false, paczka: null };
  vi.mocked(przygotuj).mockResolvedValue(wynik);
  const gotowe = vi.fn();
  render(<Polaczenie onGotowe={gotowe} />);
  expect(screen.getByRole('status').textContent).toBe('Sprawdzam połączenie…');
  // Kółko „Sprawdzam połączenie…” też ma role=status, więc czekamy na właściwy tekst, a nie na sam element.
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/^Brak sieci i brak paczki offline/));
  expect(gotowe).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Dalej' }));
  expect(gotowe).toHaveBeenCalledWith(wynik);
});

it('z siecią przechodzi dalej sam po 0,8 s i nie pokazuje „Dalej”', async () => {
  const wynik = { siec: true, api: true, paczka };
  vi.mocked(przygotuj).mockResolvedValue(wynik);
  const gotowe = vi.fn();
  render(<Polaczenie onGotowe={gotowe} />);
  expect(await screen.findByText('Jest połączenie. Dane na żywo włączone. Trasy na offline zapisuję w tle.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Dalej' })).toBeNull();
  expect(gotowe).not.toHaveBeenCalled();
  await vi.waitFor(() => expect(gotowe).toHaveBeenCalledWith(wynik), { timeout: 2000 });
});

it('błąd pobrania paczki (sieć jest, paczki nie ma): mówi o tym i zostaje na ekranie 2,5 s', async () => {
  vi.useFakeTimers();
  const wynik = { siec: true, api: true, paczka: null };
  vi.mocked(przygotuj).mockResolvedValue(wynik);
  const gotowe = vi.fn();
  render(<Polaczenie onGotowe={gotowe} />);
  await act(() => vi.advanceTimersByTimeAsync(0));
  expect(screen.getByRole('status').textContent).toMatch(/Nie udało się pobrać paczki offline\. Spróbuję przy następnym uruchomieniu\.$/);
  expect(screen.queryByRole('button', { name: 'Dalej' })).toBeNull();
  await act(() => vi.advanceTimersByTimeAsync(2400));
  expect(gotowe).not.toHaveBeenCalled();
  await act(() => vi.advanceTimersByTimeAsync(200));
  expect(gotowe).toHaveBeenCalledWith(wynik);
});

it('odrzucone przygotowanie nie zostawia kółka: pokazuje brak sieci i „Dalej”', async () => {
  vi.mocked(przygotuj).mockRejectedValue(new Error('boom'));
  const gotowe = vi.fn();
  render(<Polaczenie onGotowe={gotowe} />);
  // Kółko „Sprawdzam połączenie…” też ma role=status, więc czekamy na właściwy tekst, a nie na sam element.
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/^Brak sieci i brak paczki offline/));
  fireEvent.click(screen.getByRole('button', { name: 'Dalej' }));
  expect(gotowe).toHaveBeenCalledWith({ siec: false, api: false, paczka: null });
});
