import type { Modul } from '../contracts';
import { modul as syreny } from './syreny';
import { modul as punkty } from './punkty';
import { modul as transport } from './transport';
import { modul as live } from './live';

// Jedyny plik wspólny dla modułów. Zmiana tylko PR-em "[kontrakt]".
export const moduly: Modul[] = [syreny, punkty, transport, live];
