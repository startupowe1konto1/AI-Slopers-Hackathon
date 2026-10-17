import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Trasa } from '../contracts';
import { trasa } from '../offline/trasy';
import { planKomunikacji } from '../modules/transport/komunikacja';
import { ArkuszTrasy } from './ArkuszTrasy';

vi.mock('../offline/trasy', () => ({ trasa: vi.fn() }));
vi.mock('../modules/transport/komunikacja', () => ({
  planKomunikacji: vi.fn(),
  najblizszyOdjazd: vi.fn(),
  opisPrzejazdu: () => '',
  opisPlanu: () => 'W pobliżu nie ma bezpośredniego połączenia.',
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const od = { lat: 52.23, lon: 21 };
const cel = { cel: { lat: 52.24, lon: 21.02 }, nazwa: 'Apteka Pod Lwem' };
const t: Trasa = { od, do: cel.cel, profil: 'pieszo', dystansM: 1800, czasMin: 22, linia: [[21, 52.23], [21.02, 52.24]], zrodlo: 'osrm' };
const atrapaMapy = () => {
  const warstwy = new Set<string>();
  return {
    warstwy,
    mapa: {
      isStyleLoaded: () => true,
      addSource: vi.fn(),
      addLayer: (l: { id: string }) => void warstwy.add(l.id),
      removeLayer: (id: string) => void warstwy.delete(id),
      getLayer: (id: string) => (warstwy.has(id) ? {} : undefined),
      getSource: () => undefined,
      fitBounds: vi.fn(),
    } as unknown as MapLibreMap,
  };
};

it('arkusz: nazwa celu, od razu trasa pieszo, przełącznik komunikacji, zamknięcie czyści mapę', async () => {
  vi.mocked(trasa).mockResolvedValue(t);
  vi.mocked(planKomunikacji).mockResolvedValue({ warianty: [], pieszoM: 1800, pieszoMin: 22, pieszoSzybciej: true, blackout: false });
  const a = atrapaMapy();
  const onZamknij = vi.fn();
  const { unmount } = render(<ArkuszTrasy mapa={a.mapa} od={od} cel={cel} blackout={false} onBlackout={() => {}} onZamknij={onZamknij} />);
  expect(screen.getByRole('heading', { name: 'Apteka Pod Lwem' })).toBeTruthy();
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('1,8 km po ulicach, pieszo ok. 22 min.'));
  expect(a.warstwy.size).toBe(2); // linia i znacznik celu
  fireEvent.click(screen.getByRole('radio', { name: 'Komunikacja' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('W pobliżu nie ma bezpośredniego połączenia. 1,8 km po ulicach, pieszo ok. 22 min.'));
  expect(planKomunikacji).toHaveBeenCalledWith(od, cel.cel, { blackout: false });
  fireEvent.click(screen.getByRole('button', { name: 'Zamknij trasę' }));
  expect(onZamknij).toHaveBeenCalled();
  unmount();
  expect(a.warstwy.size).toBe(0);
});

it('Esc zamyka arkusz, a po otwarciu fokus jest na nagłówku', async () => {
  vi.mocked(trasa).mockResolvedValue(t);
  const onZamknij = vi.fn();
  render(<ArkuszTrasy mapa={atrapaMapy().mapa} od={od} cel={cel} blackout={false} onBlackout={() => {}} onZamknij={onZamknij} />);
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Apteka Pod Lwem' }));
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onZamknij).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('po ulicach'));
});
