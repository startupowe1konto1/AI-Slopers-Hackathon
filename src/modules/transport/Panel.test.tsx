import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { MiejsceUzytkownika, RolaMiejsca } from '../../contracts';
import { Panel } from './Panel';

const miejsce = (rola: RolaMiejsca, etykieta: string, lat: number): MiejsceUzytkownika => ({
  rola,
  etykieta,
  adres: { id: rola, ulica: 'ul. Testowa', numer: '1', dzielnica: 'Wola', lat, lon: 21.0 },
});
const DOM = miejsce('dom', 'Dom', 52.23);
const PRACA = miejsce('praca', 'Praca', 52.25);

const przystanki = [
  { id: 's1', nazwa: 'Przy domu 01', lat: 52.231, lon: 21.0, linie: ['128'] },
  { id: 's2', nazwa: 'Przy pracy 01', lat: 52.248, lon: 21.0, linie: ['128'] },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Kolejność ma znaczenie: indeks przystanków jest zapamiętywany po pierwszym udanym pobraniu.
describe('Panel Dojazd', () => {
  it('z jednym adresem prosi o drugi zamiast pustego ekranu', () => {
    render(<Panel miejsca={[DOM]} wybrane={DOM.adres} online />);
    expect(screen.getByText(/Dodaj drugi adres/)).toBeTruthy();
  });

  it('bez sieci i bez paczki mówi o braku sieci', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<Panel miejsca={[DOM, PRACA]} wybrane={DOM.adres} online={false} />);
    expect(await screen.findByText(/Brak sieci i brak paczki offline/)).toBeTruthy();
  });

  it('przy błędzie źródła pokazuje komunikat i przycisk ponowienia', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    render(<Panel miejsca={[DOM, PRACA]} wybrane={DOM.adres} online />);
    expect(await screen.findByText(/Nie udało się wczytać przystanków/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Spróbuj ponownie' })).toBeTruthy();
  });

  it('pokazuje kartę pary z czasem i autobusami', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(przystanki)));
    render(<Panel miejsca={[DOM, PRACA]} wybrane={DOM.adres} online />);
    expect(screen.getByText(/Liczę dojazd/)).toBeTruthy();
    expect(await screen.findByText('Dom → Praca')).toBeTruthy();
    expect(screen.getByText(/^Pieszo ~\d+ min, rowerem ~\d+ min$/)).toBeTruthy();
    expect(screen.getByText(/Autobusy z przystanku Przy domu 01 .*: linie 128/)).toBeTruthy();
  });
});
