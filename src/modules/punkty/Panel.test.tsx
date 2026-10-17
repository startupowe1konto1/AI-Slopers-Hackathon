import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { Punkt } from '../../contracts';
import { najblizsze, zrodlaPaczki } from './najblizsze';
import { Panel } from './Panel';

vi.mock('./najblizsze', async (oryginal) => ({
  ...(await oryginal<typeof import('./najblizsze')>()),
  najblizsze: vi.fn(),
  zrodlaPaczki: vi.fn(),
}));

const DOM = { lat: 52.2385, lon: 20.9131 };
const PSP: Punkt[] = [
  { id: 'psp-1', rodzaj: 'schronienie_psp', nazwa: 'Garaż podziemny', adres: 'ul. Powstańców Śląskich 12', dostepnosc: 'Całodobowa', lat: 52.2388, lon: 20.9131, zrodlo: 'psp' },
  { id: 'psp-2', rodzaj: 'schronienie_psp', nazwa: 'Piwnica szkoły', lat: 52.2405, lon: 20.9131, zrodlo: 'psp' },
  { id: 'psp-3', rodzaj: 'schronienie_psp', nazwa: 'Parking', lat: 52.25, lon: 20.9131, zrodlo: 'psp' },
];
const ZRODLA = { psp: { nazwa: 'PSP (gdziesieukryc.pl)', licencja: 'za zgodą PSP', url: 'https://gdziesieukryc.pl', pobrano: '2026-10-17' } };

beforeEach(() => {
  vi.mocked(zrodlaPaczki).mockResolvedValue(ZRODLA);
  vi.mocked(najblizsze).mockResolvedValue(PSP);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it('pokazuje 3 najbliższe miejsca schronienia według PSP ze źródłem, datą i linkiem PSP', async () => {
  render(<Panel miejsca={[]} wybrane={DOM} online />);
  const lista = await screen.findByTestId('lista-punktow');
  const pozycje = within(lista).getAllByRole('listitem');
  expect(pozycje).toHaveLength(3);
  expect(najblizsze).toHaveBeenCalledWith(DOM, 'schronienie_psp', 3);
  expect(pozycje[0].textContent).toContain('Garaż podziemny');
  expect(pozycje[0].textContent).toContain('ul. Powstańców Śląskich 12');
  expect(pozycje[0].textContent).toContain('Całodobowa');
  expect(pozycje[0].textContent).toContain('30 m');
  expect(pozycje[2].textContent).toContain('1,3 km');
  expect(await within(pozycje[0]).findByText(/PSP \(gdziesieukryc\.pl\).*17\.10\.2026/)).toBeTruthy();
  const link = within(pozycje[0]).getByRole('link', { name: 'Otwórz w aplikacji PSP' });
  expect(link.getAttribute('href')).toBe('https://gdziesieukryc.pl/?lat=52.2388&lng=20.9131');
  expect(screen.getByText('Dane: PSP (gdziesieukryc.pl), stan na 17.10.2026.')).toBeTruthy();
});

it('zakładka zmienia rodzaj punktu', async () => {
  vi.mocked(najblizsze).mockResolvedValue([{ id: 'aed-1', rodzaj: 'aed', nazwa: 'AED w urzędzie', lat: 52.239, lon: 20.913, zrodlo: 'um-aed' }]);
  render(<Panel miejsca={[]} wybrane={DOM} online />);
  fireEvent.click(screen.getByRole('tab', { name: /AED/ }));
  const lista = await screen.findByTestId('lista-punktow');
  expect(najblizsze).toHaveBeenLastCalledWith(DOM, 'aed', 3);
  expect(within(lista).queryByRole('link')).toBeNull();
});

it('brak danych: komunikat i sprawdzone źródło', async () => {
  vi.mocked(najblizsze).mockResolvedValue([]);
  render(<Panel miejsca={[]} wybrane={DOM} online />);
  expect(await screen.findByText(/Brak danych dla tego miejsca\. Sprawdziliśmy: PSP \(gdziesieukryc\.pl\)/)).toBeTruthy();
});

it('błąd źródła: komunikat i ponowna próba', async () => {
  vi.mocked(najblizsze).mockRejectedValueOnce(new Error('HTTP 500'));
  render(<Panel miejsca={[]} wybrane={DOM} online />);
  expect(await screen.findByText('Źródło chwilowo niedostępne.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
  expect(await screen.findByTestId('lista-punktow')).toBeTruthy();
  expect(najblizsze).toHaveBeenCalledTimes(2);
});

it('bez sieci: lista z paczki z dopiskiem, a bez paczki prośba o pobranie', async () => {
  render(<Panel miejsca={[]} wybrane={DOM} online={false} />);
  expect(await screen.findByTestId('lista-punktow')).toBeTruthy();
  expect(screen.getByText(/Bez sieci: dane z pobranej paczki/)).toBeTruthy();
  cleanup();

  vi.mocked(najblizsze).mockRejectedValue(new Error('Failed to fetch'));
  render(<Panel miejsca={[]} wybrane={DOM} online={false} />);
  expect(await screen.findByText(/Brak sieci i brak pobranej paczki danych/)).toBeTruthy();
});

it('bez wybranego miejsca prosi o wybór', () => {
  render(<Panel miejsca={[]} wybrane={null} online />);
  expect(screen.getByText(/Wybierz miejsce/)).toBeTruthy();
  expect(najblizsze).not.toHaveBeenCalled();
});
