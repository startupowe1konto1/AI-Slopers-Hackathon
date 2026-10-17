import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Trasa, Wskazowka } from '../contracts';
import { trasa } from '../offline/trasy';
import { planKomunikacji } from '../modules/transport/komunikacja';
import { Karty } from './Karty';

vi.mock('../offline/trasy', () => ({ trasa: vi.fn() }));
vi.mock('../modules/transport/komunikacja', () => ({
  planKomunikacji: vi.fn(),
  najblizszyOdjazd: vi.fn(),
  opisPrzejazdu: () => '',
  opisPlanu: () => 'Brak połączenia.',
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const od = { lat: 52.23, lon: 21 };
const t: Trasa = { od, do: { lat: 52.24, lon: 21.02 }, profil: 'pieszo', dystansM: 1800, czasMin: 22, linia: [[21, 52.23], [21.02, 52.24]], zrodlo: 'osrm' };
const schronienie: Wskazowka = {
  id: 'schronienie', kolejnosc: 20, tytul: 'Najbliższe miejsce schronienia według PSP', poziom: 'ok', tekst: 'Garwolińska 9, 1,8 km.',
  akcje: [{ typ: 'trasa', cel: t.do, nazwa: 'Garwolińska 9' }], zrodlo: 'PSP',
};
const atrapaMapy = () => ({ isStyleLoaded: () => true, addSource: vi.fn(), addLayer: vi.fn(), fitBounds: vi.fn(), getLayer: vi.fn(), getSource: vi.fn() });
// Trasa, która przychodzi dopiero po wywołaniu oddaj().
function trasaWToku() {
  let oddaj!: (x: Trasa) => void;
  vi.mocked(trasa).mockReturnValue(new Promise((r) => (oddaj = r)));
  return () => act(async () => oddaj(t));
}

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

it('spóźniona trasa po zamknięciu karty albo po odmontowaniu nie rysuje i nie przesuwa mapy', async () => {
  const mapa = atrapaMapy();
  let oddaj = trasaWToku();
  render(<Karty karty={[schronienie]} ladowanie={0} mapa={mapa as unknown as MapLibreMap} od={od} onOdswiez={() => {}} />);
  const przycisk = screen.getByRole('button', { name: /schronienia/ });
  fireEvent.click(przycisk);
  fireEvent.click(przycisk);
  await oddaj();
  expect(mapa.fitBounds).not.toHaveBeenCalled();
  expect(mapa.addLayer).not.toHaveBeenCalled();

  oddaj = trasaWToku();
  fireEvent.click(przycisk);
  cleanup();
  await oddaj();
  expect(mapa.fitBounds).not.toHaveBeenCalled();
  expect(mapa.addLayer).not.toHaveBeenCalled();
});

it('„Wyznaczam trasę…” w trakcie, potem opis; przed mapą „Mapa jeszcze się wczytuje.”', async () => {
  const mapa = atrapaMapy();
  const oddaj = trasaWToku();
  const { rerender } = render(<Karty karty={[schronienie]} ladowanie={0} mapa={null} od={od} onOdswiez={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /schronienia/ }));
  expect(screen.getByRole('status').textContent).toBe('Mapa jeszcze się wczytuje.');
  rerender(<Karty karty={[schronienie]} ladowanie={0} mapa={mapa as unknown as MapLibreMap} od={od} onOdswiez={() => {}} />);
  expect(screen.queryByRole('status')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Trasa pieszo: Garwolińska 9' }));
  expect(screen.getByRole('status').textContent).toBe('Wyznaczam trasę…');
  await oddaj();
  expect(screen.getByRole('status').textContent).toBe('1,8 km po ulicach, pieszo ok. 22 min.');
  expect(mapa.fitBounds).toHaveBeenCalledTimes(1);
});

it('pod trasą przełącznik „Pieszo | Komunikacja”; komunikacja i blackout liczą plan od nowa', async () => {
  vi.mocked(trasa).mockResolvedValue(t);
  vi.mocked(planKomunikacji).mockResolvedValue({ warianty: [], pieszoM: 1800, pieszoMin: 22, pieszoSzybciej: true, blackout: false });
  const onBlackout = vi.fn();
  render(<Karty karty={[schronienie]} ladowanie={0} mapa={atrapaMapy() as unknown as MapLibreMap} od={od} onOdswiez={() => {}} onBlackout={onBlackout} />);
  fireEvent.click(screen.getByRole('button', { name: /miejsce schronienia/ }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('1,8 km po ulicach, pieszo ok. 22 min.'));
  expect(screen.getByRole('radio', { name: 'Pieszo' }).getAttribute('aria-checked')).toBe('true');
  expect(screen.queryByRole('switch')).toBeNull();
  fireEvent.click(screen.getByRole('radio', { name: 'Komunikacja' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Brak połączenia.'));
  expect(planKomunikacji).toHaveBeenCalledWith(od, t.do, { blackout: false });
  fireEvent.click(screen.getByRole('switch', { name: 'Zakładam blackout' }));
  expect(onBlackout).toHaveBeenCalledWith(true);
  await waitFor(() => expect(planKomunikacji).toHaveBeenLastCalledWith(od, t.do, { blackout: true }));
  fireEvent.click(screen.getByRole('radio', { name: 'Pieszo' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('1,8 km po ulicach, pieszo ok. 22 min.'));
});
