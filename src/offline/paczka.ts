import type { Manifest } from '../contracts';

const MAPA = 'warszawa.pmtiles';

// Fonty i ikony stylu mapy (public/map/). Pobierane z paczką, żeby etykiety działały offline.
const FONTY = ['Noto Sans Regular', 'Noto Sans Medium', 'Noto Sans Italic'];
const ZAKRESY = ['0-255', '256-511', '8192-8447'];
export const ZASOBY_MAPY = [
  ...FONTY.flatMap((f) => ZAKRESY.map((r) => `/map/fonts/${encodeURIComponent(f)}/${r}.pbf`)),
  ...['light.json', 'light.png', 'light@2x.json', 'light@2x.png'].map((s) => `/map/sprites/${s}`),
];

// Plik mapy zapisany w OPFS albo null, jeśli paczki jeszcze nie pobrano.
export async function plikMapy(): Promise<File | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(MAPA);
    return await fh.getFile();
  } catch {
    return null;
  }
}

// Pobiera wszystkie pliki z manifestu (zapisuje je service worker w cache "pack") i mapę do OPFS.
export async function pobierzPaczke(onPostep: (zrobione: number, wszystkie: number) => void): Promise<void> {
  await navigator.storage.persist?.();
  const m = await fetch('/pack/manifest.json');
  if (!m.ok) throw new Error('Nie pobrano manifest.json');
  const manifest = (await m.json()) as Manifest;
  const wszystkie = manifest.pliki.length + 1;
  let z = 0;
  for (const p of manifest.pliki) {
    const r = await fetch(`/pack/${p.sciezka}`);
    if (!r.ok) throw new Error(`Nie pobrano ${p.sciezka}`);
    await r.arrayBuffer();
    onPostep(++z, wszystkie);
  }
  for (const url of ZASOBY_MAPY) {
    const r = await fetch(url); // service worker zapisuje w cache "map-assets"
    if (!r.ok) throw new Error(`Nie pobrano ${url}`);
    await r.arrayBuffer();
  }
  const res = await fetch(`/map/${MAPA}`);
  if (!res.ok || !res.body) throw new Error('Nie pobrano mapy');
  const root = await navigator.storage.getDirectory();
  const fh = await root.getFileHandle(MAPA, { create: true });
  await res.body.pipeTo(await fh.createWritable());
  localStorage.setItem('paczka', JSON.stringify({ wersja: manifest.wersja, zbudowano: manifest.zbudowano }));
  onPostep(++z, wszystkie);
}

export async function stanPaczki(): Promise<{ wersja: string; zbudowano: string } | null> {
  const s = localStorage.getItem('paczka');
  return s ? JSON.parse(s) : null;
}
