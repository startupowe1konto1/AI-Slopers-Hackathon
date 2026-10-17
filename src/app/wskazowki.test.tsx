import { renderHook, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import type { KontekstWskazowek, Modul, Wskazowka } from '../contracts';
import { useWskazowki } from './wskazowki';

const karta = (id: string, kolejnosc: number): Wskazowka => ({ id, kolejnosc, tytul: id, poziom: 'ok', tekst: id, akcje: [], zrodlo: 'test' });
const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k: KontekstWskazowek = { miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online: true };
const Panel = () => <div />;

it('zbiera karty, sortuje po kolejności, błąd modułu zamienia na kartę „brak”', async () => {
  const moduly: Modul[] = [
    { id: 'live', nazwa: 'Na żywo', Panel, wskazowki: async () => [karta('powietrze', 40)] },
    { id: 'syreny', nazwa: 'Syreny', Panel, wskazowki: async () => [karta('syreny', 10)] },
    { id: 'punkty', nazwa: 'Pomoc', Panel, wskazowki: async () => Promise.reject(new Error('x')) },
    { id: 'transport', nazwa: 'Dojazd', Panel },
  ];
  const { result } = renderHook(() => useWskazowki(moduly, k, 0));
  expect(result.current.ladowanie).toBe(3);
  await waitFor(() => expect(result.current.ladowanie).toBe(0));
  expect(result.current.karty.map((w) => w.id)).toEqual(['syreny', 'powietrze', 'blad-punkty']);
  expect(result.current.karty[2]).toMatchObject({ poziom: 'brak', tytul: 'Pomoc' });
});

it('bez kontekstu nic nie ładuje', () => {
  const { result } = renderHook(() => useWskazowki([], null, 0));
  expect(result.current).toEqual({ karty: [], ladowanie: 0 });
});
