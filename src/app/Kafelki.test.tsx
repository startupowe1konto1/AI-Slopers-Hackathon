import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Kafelek, RodzajPunktu } from '../contracts';
import { Kafelki } from './Kafelki';

const RODZAJE: [RodzajPunktu, string, string][] = [
  ['schronienie_psp', 'Miejsca schronienia PSP', 'rgb(185, 28, 28)'],
  ['aed', 'AED', 'rgb(21, 128, 61)'],
  ['sor', 'SOR', 'rgb(126, 34, 206)'],
  ['apteka', 'Apteki', 'rgb(14, 116, 144)'],
  ['przychodnia', 'Przychodnie', 'rgb(190, 24, 93)'],
  ['toaleta', 'Toalety', 'rgb(107, 114, 128)'],
  ['metro', 'Metro', 'rgb(29, 78, 216)'],
];
const mapa = {} as MapLibreMap;

function pokaz() {
  const sprzatanie = vi.fn();
  const kafelki: Kafelek[] = RODZAJE.map(([id, etykieta, kolor]) => ({ id, etykieta, kolor, dodajWarstwe: vi.fn(() => sprzatanie) }));
  render(<Kafelki kafelki={kafelki} mapa={mapa} />);
  const pasek = screen.getByRole('navigation', { name: 'Warstwy na mapie' });
  return { kafelki, sprzatanie, pasek };
}

// jsdom nie liczy układu: udajemy pasek węższy niż treść.
function zaWaski(el: HTMLElement, tresc = 900, widok = 300) {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: tresc });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: widok });
}

const mysz = { pointerType: 'mouse', button: 0, pointerId: 1 };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('każdy kafelek ma własną ikonę ukrytą przed czytnikiem, a nazwą przycisku zostaje etykieta', () => {
  pokaz();
  const ksztalty = new Set<string>();
  for (const [, etykieta] of RODZAJE) {
    const svg = screen.getByRole('button', { name: etykieta }).querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 256 256');
    ksztalty.add(svg?.querySelector('path')?.getAttribute('d') ?? '');
  }
  expect(ksztalty.size).toBe(RODZAJE.length);
  expect(document.querySelector('.kropka')).toBeNull();
});

it('ikona ma kolor rodzaju, a na włączonym kafelku bierze kolor tekstu', () => {
  pokaz();
  const aed = screen.getByRole('button', { name: 'AED' });
  expect(aed.querySelector('svg')?.style.color).toBe('rgb(21, 128, 61)');
  fireEvent.click(aed);
  expect(aed.querySelector('svg')?.style.color).toBe('');
});

it('kliknięcie włącza i wyłącza warstwę', () => {
  const { kafelki, sprzatanie } = pokaz();
  const aed = screen.getByRole('button', { name: 'AED' });
  expect(aed.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(aed);
  expect(aed.getAttribute('aria-pressed')).toBe('true');
  expect(kafelki[1].dodajWarstwe).toHaveBeenCalledWith(mapa);
  fireEvent.click(aed);
  expect(aed.getAttribute('aria-pressed')).toBe('false');
  expect(sprzatanie).toHaveBeenCalledTimes(1);
});

it('przeciągnięcie myszą o ponad 5 px przewija pasek i nie przełącza kafelka', () => {
  const { kafelki, pasek } = pokaz();
  zaWaski(pasek);
  const aed = screen.getByRole('button', { name: 'AED' });
  fireEvent.pointerDown(aed, { ...mysz, clientX: 200 });
  fireEvent.pointerMove(aed, { ...mysz, clientX: 150 });
  expect(pasek.hasAttribute('data-przeciaganie')).toBe(true);
  fireEvent.pointerUp(aed, { ...mysz, clientX: 150 });
  fireEvent.click(aed);
  expect(pasek.scrollLeft).toBe(50);
  expect(pasek.hasAttribute('data-przeciaganie')).toBe(false);
  expect(aed.getAttribute('aria-pressed')).toBe('false');
  expect(kafelki[1].dodajWarstwe).not.toHaveBeenCalled();

  // Następne zwykłe kliknięcie już działa.
  fireEvent.pointerDown(aed, { ...mysz, clientX: 150 });
  fireEvent.pointerUp(aed, { ...mysz, clientX: 150 });
  fireEvent.click(aed);
  expect(aed.getAttribute('aria-pressed')).toBe('true');
});

it('drgnięcie myszy do 5 px to nadal kliknięcie, a dotyk zostaje przeglądarce', () => {
  const { pasek } = pokaz();
  zaWaski(pasek);
  const aed = screen.getByRole('button', { name: 'AED' });
  fireEvent.pointerDown(aed, { ...mysz, clientX: 200 });
  fireEvent.pointerMove(aed, { ...mysz, clientX: 195 });
  fireEvent.pointerUp(aed, { ...mysz, clientX: 195 });
  fireEvent.click(aed);
  expect(aed.getAttribute('aria-pressed')).toBe('true');
  expect(pasek.scrollLeft).toBe(0);

  fireEvent.pointerDown(aed, { ...mysz, pointerType: 'touch', clientX: 200 });
  fireEvent.pointerMove(aed, { ...mysz, pointerType: 'touch', clientX: 100 });
  expect(pasek.scrollLeft).toBe(0);
});

it('kółko w pionie przewija pasek w poziomie tylko wtedy, gdy treść się nie mieści', () => {
  const { pasek } = pokaz();
  // Wszystko się mieści: kółko zostaje przeglądarce.
  expect(fireEvent.wheel(pasek, { deltaY: 30 })).toBe(true);
  expect(pasek.scrollLeft).toBe(0);

  zaWaski(pasek);
  expect(fireEvent.wheel(pasek, { deltaY: 30 })).toBe(false);
  expect(pasek.scrollLeft).toBe(30);
  // Ruch głównie w poziomie (gładzik) przewija przeglądarka sama.
  expect(fireEvent.wheel(pasek, { deltaX: 20, deltaY: 5 })).toBe(true);
  expect(pasek.scrollLeft).toBe(30);
});

it('skok kółka myszy przewija płynnie, a przy prefers-reduced-motion od razu', () => {
  const { pasek } = pokaz();
  zaWaski(pasek);
  const scrollBy = vi.fn();
  Object.defineProperty(pasek, 'scrollBy', { configurable: true, value: scrollBy });

  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q }));
  fireEvent.wheel(pasek, { deltaY: 100 });
  expect(scrollBy).toHaveBeenCalledWith({ left: 100, behavior: 'smooth' });
  expect(pasek.scrollLeft).toBe(0);

  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q }));
  fireEvent.wheel(pasek, { deltaY: 100 });
  expect(scrollBy).toHaveBeenCalledTimes(1);
  expect(pasek.scrollLeft).toBe(100);
});

it('wygasza krawędź po tej stronie, gdzie jest więcej kafelków', () => {
  const { pasek } = pokaz();
  zaWaski(pasek);
  fireEvent.scroll(pasek);
  expect(pasek.hasAttribute('data-wiecej-lewo')).toBe(false);
  expect(pasek.hasAttribute('data-wiecej-prawo')).toBe(true);

  pasek.scrollLeft = 300;
  fireEvent.scroll(pasek);
  expect(pasek.hasAttribute('data-wiecej-lewo')).toBe(true);
  expect(pasek.hasAttribute('data-wiecej-prawo')).toBe(true);

  pasek.scrollLeft = 600;
  fireEvent.scroll(pasek);
  expect(pasek.hasAttribute('data-wiecej-lewo')).toBe(true);
  expect(pasek.hasAttribute('data-wiecej-prawo')).toBe(false);
});
