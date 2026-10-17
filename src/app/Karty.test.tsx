import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Wskazowka } from '../contracts';
import { Karty } from './Karty';

it('klik w kartę wykonuje pierwszą akcję mapową, drugi klik sprząta; szkielet dla modułów w toku', async () => {
  const sprzatanie = vi.fn();
  const pokaz = vi.fn((_m: MapLibreMap) => sprzatanie);
  const mapa = { isStyleLoaded: () => true } as unknown as MapLibreMap;
  const w: Wskazowka = { id: 'syreny', kolejnosc: 10, tytul: 'Syreny', poziom: 'ok', tekst: 'Jesteś w zasięgu syreny.', akcje: [{ typ: 'mapa', pokaz }], zrodlo: 'SOIA' };
  render(<Karty karty={[w]} ladowanie={1} mapa={mapa} od={{ lat: 52.23, lon: 21 }} onOdswiez={() => {}} />);
  expect(screen.getByLabelText('Ładowanie wskazówki')).toBeTruthy();
  const przycisk = screen.getByRole('button', { name: /Syreny/ });
  fireEvent.click(przycisk);
  await waitFor(() => expect(pokaz).toHaveBeenCalledWith(mapa));
  expect(screen.getByText('Źródło: SOIA')).toBeTruthy();
  fireEvent.click(przycisk);
  expect(sprzatanie).toHaveBeenCalled();
});

it('akcja „przycisk” wykonuje się i odświeża karty', async () => {
  const wykonaj = vi.fn();
  const onOdswiez = vi.fn();
  const w: Wskazowka = { id: 'powietrze', kolejnosc: 40, tytul: 'Powietrze i wiatr', poziom: 'ok', tekst: 'Możesz wietrzyć.', akcje: [{ typ: 'przycisk', etykieta: 'Widzę dym', wykonaj }], zrodlo: 'x' };
  render(<Karty karty={[w]} ladowanie={0} mapa={null} od={{ lat: 52.23, lon: 21 }} onOdswiez={onOdswiez} />);
  fireEvent.click(screen.getByRole('button', { name: /Powietrze/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Widzę dym' }));
  await waitFor(() => expect(onOdswiez).toHaveBeenCalled());
  expect(wykonaj).toHaveBeenCalled();
});

it('akcja „przycisk”, która rzuci błędem, nie psuje kart i też je odświeża', async () => {
  const blad = vi.spyOn(console, 'error').mockImplementation(() => {});
  const onOdswiez = vi.fn();
  const w: Wskazowka = { id: 'bliscy', kolejnosc: 50, tytul: 'Dotarcie do bliskich', poziom: 'ok', tekst: 'x', akcje: [{ typ: 'przycisk', etykieta: 'Zapisz', wykonaj: async () => Promise.reject(new Error('x')) }], zrodlo: 'x' };
  render(<Karty karty={[w]} ladowanie={0} mapa={null} od={{ lat: 52.23, lon: 21 }} onOdswiez={onOdswiez} />);
  fireEvent.click(screen.getByRole('button', { name: /Dotarcie do bliskich/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
  await waitFor(() => expect(onOdswiez).toHaveBeenCalled());
  expect(screen.getByTestId('karta-bliscy')).toBeTruthy();
  blad.mockRestore();
});
