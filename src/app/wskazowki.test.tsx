import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, Modul, Wskazowka } from '../contracts';
import { useWskazowki } from './wskazowki';

const karta = (id: string, kolejnosc: number): Wskazowka => ({ id, kolejnosc, tytul: id, poziom: 'ok', tekst: id, akcje: [], zrodlo: 'test' });
const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k: KontekstWskazowek = { miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online: true };
const Panel = () => <div />;

afterEach(() => {
  vi.restoreAllMocks();
});

it('zbiera karty, sortuje po kolejności, błąd modułu zamienia na kartę „brak”', async () => {
  const moduly: Modul[] = [
    { id: 'live', nazwa: 'Na żywo', Panel, wskazowki: async () => [karta('powietrze', 40)] },
    { id: 'syreny', nazwa: 'Syreny', Panel, wskazowki: async () => [karta('syreny', 10)] },
    { id: 'punkty', nazwa: 'Pomoc', Panel, wskazowki: async () => Promise.reject(new Error('x')) },
    { id: 'transport', nazwa: 'Dojazd', Panel },
  ];
  const blad = vi.spyOn(console, 'error').mockImplementation(() => {});
  const pierwszyRender: number[] = [];
  const { result } = renderHook(() => {
    const r = useWskazowki(moduly, k, 0);
    pierwszyRender.push(r.ladowanie);
    return r;
  });
  // już pierwszy render (przed efektem) pokazuje szkielety, a nie „Brak wskazówek”
  expect(pierwszyRender[0]).toBe(3);
  expect(result.current.ladowanie).toBe(3);
  await waitFor(() => expect(result.current.ladowanie).toBe(0));
  expect(result.current.karty.map((w) => w.id)).toEqual(['syreny', 'powietrze', 'blad-punkty']);
  expect(result.current.karty[2]).toMatchObject({ poziom: 'brak', tytul: 'Pomoc' });
  expect(blad).toHaveBeenCalledWith('[karty]', 'punkty', expect.any(Error));
});

it('odświeżenie po akcji (tylko proba) zostawia stare karty do czasu nowych', async () => {
  let oddaj!: (w: Wskazowka[]) => void;
  const wskazowki = vi.fn(async () => [karta('powietrze', 40)]);
  const moduly: Modul[] = [{ id: 'live', nazwa: 'Na żywo', Panel, wskazowki }];
  const { result, rerender } = renderHook(({ proba }) => useWskazowki(moduly, k, proba), { initialProps: { proba: 0 } });
  await waitFor(() => expect(result.current.karty).toHaveLength(1));
  wskazowki.mockReturnValueOnce(new Promise((r) => (oddaj = r)));
  rerender({ proba: 1 });
  expect(result.current).toEqual({ karty: [karta('powietrze', 40)], ladowanie: 0 });
  await act(async () => oddaj([{ ...karta('powietrze', 40), tekst: 'nowa' }]));
  expect(result.current.karty[0].tekst).toBe('nowa');
});

it('bez kontekstu nic nie ładuje', () => {
  const { result } = renderHook(() => useWskazowki([], null, 0));
  expect(result.current).toEqual({ karty: [], ladowanie: 0 });
});
