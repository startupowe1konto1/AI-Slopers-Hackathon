import { readFileSync } from 'node:fs';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Stopka } from './Stopka';

// Prawdziwy manifest paczki: stopka ma wyglądać dobrze na danych, które widzi użytkownik.
const manifest = JSON.parse(readFileSync('public/pack/manifest.json', 'utf-8'));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Największa głębokość nawiasów w tekście, np. „a (b (c))” → 2.
function glebokosc(t: string): number {
  let d = 0;
  let max = 0;
  for (const z of t) {
    if (z === '(') max = Math.max(max, ++d);
    if (z === ')') d--;
  }
  return max;
}

it('źródła z paczki bez zagnieżdżonych nawiasów i bez zdublowanego SOIA', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(manifest))));
  render(<Stopka />);
  await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(5));
  const wiersze = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
  expect(wiersze.filter((w) => glebokosc(w) > 1)).toEqual([]);
  expect(wiersze.filter((w) => w.includes('SOIA'))).toHaveLength(1);
  expect(wiersze.find((w) => w.includes('SOIA'))).toContain('CC BY 4.0');
});
