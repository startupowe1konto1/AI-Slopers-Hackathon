import { expect, it, vi } from 'vitest';

vi.mock('./warstwy', () => ({ dodajWarstweRodzaju: vi.fn(() => () => {}) }));
import { dodajWarstweRodzaju } from './warstwy';
import { kafelki } from './kafelki';

it('7 kafelków w kolejności z HANDOFF-v3 i każdy włącza warstwę swojego rodzaju', () => {
  expect(kafelki.map((k) => k.etykieta)).toEqual(['Miejsca schronienia PSP', 'AED', 'SOR', 'Apteki', 'Przychodnie', 'Toalety', 'Metro']);
  const mapa = {} as Parameters<(typeof kafelki)[number]['dodajWarstwe']>[0];
  kafelki[1].dodajWarstwe(mapa);
  expect(dodajWarstweRodzaju).toHaveBeenCalledWith(mapa, 'aed');
});
