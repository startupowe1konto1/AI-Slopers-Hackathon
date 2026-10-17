import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MiejsceUzytkownika, Punkt } from '../../contracts';

const adresy = {
  ulice: ['ul. Grochowska'], dzielnice: ['Praga-Południe'],
  id: ['1441381'], u: [0], nr: ['200'], dz: [0], lat: [52.24], lon: [21.09],
};
const syreny = { n: '3', b: '2', p: '1' };
const psp = (id: string, nazwa: string, lat: number): Punkt =>
  ({ id, rodzaj: 'schronienie_psp', nazwa, adres: `ul. Testowa ${id}`, lat, lon: 21.09, zrodlo: 'psp', dostepnosc: 'Całodobowa' });
const punkty: Punkt[] = [
  psp('4', 'Czwarte', 52.25), psp('1', 'Pierwsze', 52.2405), psp('3', 'Trzecie', 52.243), psp('2', 'Drugie', 52.242),
  { id: 'a', rodzaj: 'aed', nazwa: 'AED obok', lat: 52.2401, lon: 21.09, zrodlo: 'um-aed' },
];
const dom: MiejsceUzytkownika = {
  rola: 'dom', etykieta: 'Dom', adres: { id: '1441381', ulica: 'ul. Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.24, lon: 21.09 },
};

function stubFetch(bezPunktow = false) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url === '/pack/syreny/syreny.json') return Response.json(syreny);
    if (url === '/pack/adresy/adresy.json') return Response.json(adresy);
    if (url === '/pack/punkty/punkty.json') return bezPunktow ? new Response('', { status: 404 }) : Response.json(punkty);
    return new Response('', { status: 404 });
  }));
}

async function pokazKarte() {
  const { modul } = await import('./index');
  render(<modul.Panel miejsca={[dom]} wybrane={null} online />);
  fireEvent.click(screen.getByRole('button', { name: 'Karta do wydruku' }));
  return screen.getByRole('region', { name: 'Karta do wydruku' });
}

describe('karta do wydruku', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('dla każdego miejsca: adres, syreny i 3 najbliższe miejsca schronienia według PSP', async () => {
    stubFetch();
    const karta = await pokazKarte();
    const miejsce = await within(karta).findByRole('article', { name: 'Dom: ul. Grochowska 200' });
    expect(within(miejsce).getByText('Syrena normalnie: 75 dB i więcej. Przy blackoucie: 70–75 dB (szacunek).')).toBeTruthy();
    const lista = await within(miejsce).findByRole('list', { name: 'Najbliższe miejsca schronienia według PSP' });
    const pozycje = within(lista).getAllByRole('listitem').map((li) => li.textContent);
    expect(pozycje).toHaveLength(3);
    expect(pozycje[0]).toMatch(/^Pierwsze, ul\. Testowa 1: \d+ m, Całodobowa$/);
    expect(pozycje[1]).toMatch(/^Drugie/);
    expect(pozycje[2]).toMatch(/^Trzecie/);
    expect(within(karta).getByText('Włącz Alert RCB w telefonie')).toBeTruthy();
    expect(within(karta).queryByText(/schrony/i)).toBeNull();
  });

  it('bez paczki punktów drukuje syreny i mówi, czego brakuje', async () => {
    stubFetch(true);
    const karta = await pokazKarte();
    const miejsce = await within(karta).findByRole('article', { name: 'Dom: ul. Grochowska 200' });
    await within(miejsce).findByText('Brak danych o miejscach schronienia według PSP w paczce offline.');
    expect(within(miejsce).getByText(/^Syrena normalnie: 75 dB i więcej\./)).toBeTruthy();
  });

  it('Drukuj drukuje samą kartę: osobna kopia w body i klasa na czas wydruku', async () => {
    stubFetch();
    const karta = await pokazKarte();
    await within(karta).findByRole('list', { name: 'Najbliższe miejsca schronienia według PSP' });
    let klasaPodczasDruku = false;
    vi.stubGlobal('print', vi.fn(() => void (klasaPodczasDruku = document.body.classList.contains('druk-karty'))));
    fireEvent.click(within(karta).getByRole('button', { name: 'Drukuj' }));
    expect(window.print).toHaveBeenCalledOnce();
    expect(klasaPodczasDruku).toBe(true);
    expect(document.body.querySelector(':scope > .karta-druk-portal')?.textContent).toContain('Pierwsze');
    window.dispatchEvent(new Event('afterprint'));
    expect(document.body.classList.contains('druk-karty')).toBe(false);
  });
});

describe('strefy syren analogowych', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('moduł rejestruje warstwę, a przełącznik w panelu ją pokazuje', async () => {
    stubFetch();
    const { modul } = await import('./index');
    const { strefyWidoczne } = await import('./warstwy');
    expect(modul.dodajWarstwy).toBeTypeOf('function');
    render(<modul.Panel miejsca={[dom]} wybrane={null} online />);
    fireEvent.click(screen.getByRole('checkbox', { name: /strefy, w których najgłośniejsza jest syrena analogowa/ }));
    expect(strefyWidoczne()).toBe(true);
  });
});
