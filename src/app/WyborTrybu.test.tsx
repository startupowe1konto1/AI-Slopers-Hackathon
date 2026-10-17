import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { WyborTrybu, type Tryb } from './WyborTrybu';

afterEach(cleanup);

const pokaz = (tryb: Tryb, onTryb = vi.fn()) => {
  render(<WyborTrybu tryb={tryb} onTryb={onTryb} blackout={false} onBlackout={() => {}} />);
  return { pieszo: screen.getByRole('radio', { name: 'Pieszo' }), komunikacja: screen.getByRole('radio', { name: 'Komunikacja' }), onTryb };
};

it('w kolejności Tab jest tylko zaznaczony przycisk (roving tabindex)', () => {
  const { pieszo, komunikacja } = pokaz('pieszo');
  expect(pieszo.tabIndex).toBe(0);
  expect(komunikacja.tabIndex).toBe(-1);
  cleanup();
  const druga = pokaz('komunikacja');
  expect(druga.pieszo.tabIndex).toBe(-1);
  expect(druga.komunikacja.tabIndex).toBe(0);
});

it('strzałki zmieniają wybór i przenoszą fokus, w kółko', () => {
  const { pieszo, komunikacja, onTryb } = pokaz('pieszo');
  pieszo.focus();
  fireEvent.keyDown(pieszo, { key: 'ArrowRight' });
  expect(onTryb).toHaveBeenLastCalledWith('komunikacja');
  expect(document.activeElement).toBe(komunikacja);
  fireEvent.keyDown(pieszo, { key: 'ArrowDown' });
  expect(onTryb).toHaveBeenLastCalledWith('komunikacja');
  fireEvent.keyDown(pieszo, { key: 'ArrowLeft' }); // z pierwszego na ostatni
  expect(onTryb).toHaveBeenLastCalledWith('komunikacja');
  expect(onTryb).toHaveBeenCalledTimes(3);
  fireEvent.keyDown(pieszo, { key: 'Tab' });
  expect(onTryb).toHaveBeenCalledTimes(3);
});

it('strzałka z „Komunikacja” wraca na „Pieszo”', () => {
  const { pieszo, komunikacja, onTryb } = pokaz('komunikacja');
  fireEvent.keyDown(komunikacja, { key: 'ArrowUp' });
  expect(onTryb).toHaveBeenLastCalledWith('pieszo');
  expect(document.activeElement).toBe(pieszo);
});
