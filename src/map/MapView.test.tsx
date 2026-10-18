import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

// Wersja tylko online (VITE_TYLKO_ONLINE=1): mapa nie zapisuje się w telefonie, więc napisy nie mówią o 12 MB ani o zapisie.
vi.mock('maplibre-gl', () => ({
  Map: class {
    on() {}
    remove() {}
    addControl() {}
  },
  Marker: class {},
  NavigationControl: class {},
  addProtocol: vi.fn(),
  setWorkerUrl: vi.fn(),
}));
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({ default: '' }));
vi.mock('pmtiles', () => ({ Protocol: class { tile() {} add() {} }, PMTiles: class {}, FileSource: class {} }));
vi.mock('../offline/paczka', () => ({ zapewnijMape: vi.fn(() => new Promise(() => {})) }));
import { MapView } from './MapView';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

it('tylko online: ładowanie mapy bez wzmianki o 12 MB', () => {
  vi.stubEnv('VITE_TYLKO_ONLINE', '1');
  render(<MapView centrum={null} moduly={[]} />);
  expect(screen.getByRole('status').textContent).toBe('Ładowanie mapy Warszawy…');
});

it('z trybem offline: napis o pobraniu 12 MB przy pierwszym otwarciu', () => {
  render(<MapView centrum={null} moduly={[]} />);
  expect(screen.getByRole('status').textContent).toBe('Ładowanie mapy Warszawy (12 MB przy pierwszym otwarciu)…');
});
