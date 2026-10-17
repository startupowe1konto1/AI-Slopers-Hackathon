import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Adres, MiejsceUzytkownika } from '../../contracts';

const adresy = {
  ulice: ['ul. Grochowska'], dzielnice: ['Praga-Południe'],
  id: ['1441381', '1441382'], u: [0, 0], nr: ['200', '202'], dz: [0, 0], lat: [52.24, 52.241], lon: [21.09, 21.091],
};
const syreny = { n: '31', b: '01' };

const adres = (id: string, numer: string): Adres =>
  ({ id, ulica: 'ul. Grochowska', numer, dzielnica: 'Praga-Południe', lat: 52.24, lon: 21.09 });
const dom: MiejsceUzytkownika = { rola: 'dom', etykieta: 'Dom', adres: adres('1441381', '200') };
const praca: MiejsceUzytkownika = { rola: 'praca', etykieta: 'Praca', adres: adres('1441382', '202') };

const KROKI = ['Włącz Alert RCB w telefonie', 'Zainstaluj aplikację RSO', 'Umów się z sąsiadem, kto kogo budzi', 'Wydrukuj kartę z adresami'];
const DOPISEK = 'Model dźwięku na zewnątrz budynków (KG PSP, SOIA 2026.05). Wariant blackout zakłada, że działają tylko syreny cyfrowe.';

function stubFetch(f: (url: string) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(f));
}
const paczki = async (url: string) => Response.json(url === '/pack/syreny/syreny.json' ? syreny : adresy);

// Moduły trzymają paczki w pamięci, więc każdy test ładuje je od nowa.
async function pokaz(miejsca: MiejsceUzytkownika[], online = true) {
  const { modul } = await import('./index');
  render(<modul.Panel miejsca={miejsca} wybrane={null} online={online} />);
  return screen.getByTestId('wynik-syreny');
}

function krokiIDopisek(panel: HTMLElement) {
  for (const k of KROKI) expect(within(panel).getByText(k)).toBeTruthy();
  expect(within(panel).getByText(DOPISEK)).toBeTruthy();
}

const wiersz = (karta: HTMLElement, nazwa: string) => within(karta).getByText(nazwa).nextElementSibling?.textContent;

describe('panel syren', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('rejestruje moduł Syreny', async () => {
    const { modul } = await import('./index');
    expect(modul).toMatchObject({ id: 'syreny', nazwa: 'Syreny' });
  });

  it('pokazuje oba warianty i opis dla każdego miejsca', async () => {
    stubFetch(paczki);
    const panel = await pokaz([dom, praca]);

    const kartaDom = await within(panel).findByRole('article', { name: 'Dom: ul. Grochowska 200' });
    await within(kartaDom).findByText('Jeśli syreny analogowe nie mają zasilania awaryjnego, przy blackoucie możesz jej nie usłyszeć.');
    expect(wiersz(kartaDom, 'Normalnie')).toBe('75 dB i więcej');
    expect(wiersz(kartaDom, 'Przy blackoucie')).toBe('poniżej 65 dB');

    const kartaPraca = within(panel).getByRole('article', { name: 'Praca: ul. Grochowska 202' });
    await within(kartaPraca).findByText('Syrena może być słabo słyszalna, zwłaszcza w mieszkaniu.');
    expect(wiersz(kartaPraca, 'Normalnie')).toBe('65–70 dB');
    expect(wiersz(kartaPraca, 'Przy blackoucie')).toBe('65–70 dB');

    krokiIDopisek(panel);
  });

  it('ładowanie: szkielet zamiast pustego ekranu', async () => {
    stubFetch(() => new Promise<Response>(() => {}));
    const panel = await pokaz([dom]);
    expect(within(panel).getByText('Sprawdzam zasięg syren…')).toBeTruthy();
    krokiIDopisek(panel);
  });

  it('brak danych: adres spoza paczki', async () => {
    stubFetch(paczki);
    const panel = await pokaz([{ ...dom, adres: adres('t1', '200') }]);
    await within(panel).findByText(/^Brak danych dla tego miejsca\./);
    expect(within(panel).getByText(/KG PSP, SOIA 2026\.05/, { selector: 'article p' })).toBeTruthy();
    krokiIDopisek(panel);
  });

  it('błąd źródła przy sieci', async () => {
    stubFetch(async (url) => (url === '/pack/syreny/syreny.json' ? new Response('', { status: 500 }) : Response.json(adresy)));
    const panel = await pokaz([dom]);
    await within(panel).findByText(/^Źródło chwilowo niedostępne\./);
    krokiIDopisek(panel);
  });

  it('brak sieci i brak paczki', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    const panel = await pokaz([dom], false);
    await within(panel).findByText(/^Brak sieci, a dane o syrenach nie są zapisane w telefonie\./);
    krokiIDopisek(panel);
  });

  it('brak sieci z paczką: wynik z paczki', async () => {
    stubFetch(paczki);
    const panel = await pokaz([dom], false);
    expect(within(panel).getByText('Bez sieci: wynik z paczki offline.')).toBeTruthy();
    await within(panel).findByText('Jeśli syreny analogowe nie mają zasilania awaryjnego, przy blackoucie możesz jej nie usłyszeć.');
  });
});
