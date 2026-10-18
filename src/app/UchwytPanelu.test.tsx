import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { UchwytPanelu } from './UchwytPanelu';

// Uchwyt między mapą a panelem: ustawia --panel (wysokość panelu w dvh) na elemencie nadrzędnym.
afterEach(cleanup);

const uchwyt = () => screen.getByRole('separator', { name: 'Wysokość panelu z wynikami' });
const panel = () => uchwyt().parentElement!.style.getPropertyValue('--panel');

it('startuje z 48% wysokości ekranu', () => {
  render(<div><UchwytPanelu /></div>);
  expect(panel()).toBe('48dvh');
  expect(uchwyt().getAttribute('aria-valuenow')).toBe('48');
});

it('strzałki zmieniają wysokość o 10%, w granicach 15–80%', () => {
  render(<div><UchwytPanelu /></div>);
  fireEvent.keyDown(uchwyt(), { key: 'ArrowUp' });
  expect(panel()).toBe('58dvh');
  for (let i = 0; i < 10; i++) fireEvent.keyDown(uchwyt(), { key: 'ArrowDown' });
  expect(panel()).toBe('15dvh');
  for (let i = 0; i < 10; i++) fireEvent.keyDown(uchwyt(), { key: 'ArrowUp' });
  expect(panel()).toBe('80dvh');
});

it('przeciągnięcie w górę powiększa panel, w dół zmniejsza (mapa rośnie)', () => {
  render(<div><UchwytPanelu /></div>);
  const krok = Math.round(window.innerHeight / 10); // ok. 10% wysokości okna
  fireEvent.pointerDown(uchwyt(), { clientY: 500, pointerId: 1 });
  fireEvent.pointerMove(uchwyt(), { clientY: 500 - krok, pointerId: 1 });
  expect(Number(uchwyt().getAttribute('aria-valuenow'))).toBe(58);
  fireEvent.pointerMove(uchwyt(), { clientY: 500 + 2 * krok, pointerId: 1 });
  expect(Number(uchwyt().getAttribute('aria-valuenow'))).toBe(28);
  fireEvent.pointerUp(uchwyt(), { pointerId: 1 });
  fireEvent.pointerMove(uchwyt(), { clientY: 0, pointerId: 1 });
  expect(panel()).toBe('28dvh');
});
