# Plan budowy: Warszawa w trybie kryzysowym

> **Dla agentów:** wykonuj zadania po kolei w swoim pasie, z TDD (najpierw test, potem kod). Zalecany skill: `superpowers:subagent-driven-development` albo `superpowers:executing-plans`. Kroki mają pola `- [ ]` do odhaczania. Specyfikacja: [SPEC.md](SPEC.md). Kontekst: [HANDOFF.md](../HANDOFF.md).

**Cel:** strona PWA dla mieszkańca Warszawy, która odpowiada na pytania o syreny, najbliższą pomoc, dojazd przy blackoucie i sytuację na żywo, i działa bez sieci.

**Architektura:** Vite + React + TS z modułami w osobnych folderach. Dane liczone z góry w Pythonie trafiają do `public/pack/`. Proxy na żywo to czyste funkcje `(Request, env) => Response` w `server/`, zarejestrowane w `server/live/index.ts`, obsługiwane przez Cloudflare Worker (`worker/index.ts`) i przez middleware w `vite dev`.

**Stos:** Vite, React, TypeScript, vite-plugin-pwa, MapLibre GL JS, pmtiles, @protomaps/basemaps, kdbush + geokdbush, idb-keyval, Vitest, Playwright; Python 3.12 + uv + geopandas; Cloudflare Workers (statyczne pliki + `/api`).

## Ograniczenia globalne (obowiązują w każdym zadaniu)

- Typy wspólne tylko z `src/contracts.ts` (treść w SPEC.md, sekcja 5). Zmiana tylko PR-em `[kontrakt]`.
- Subagent pisze wyłącznie w folderach swojej osoby (SPEC.md, sekcja 9).
- Klucz API tylko w `.env` (lokalnie) i w zmiennych Cloudflare. Nigdy w `src/`, w logach ani w czacie.
- Nowa zależność npm tylko PR-em `[kontrakt]`. Wszystkie znane zależności są w szkielecie.
- Teksty: „miejsca schronienia według PSP”, nigdy „schrony”. Wynik syreny zawsze z dopiskiem o modelu na zewnątrz i o założeniu blackoutu.
- Każdy panel ma 4 stany: ładowanie, brak sieci, brak danych, błąd źródła. Nigdy pusty ekran.
- Współrzędne w paczce mieszczą się w bbox Warszawy: lon 20.85–21.28, lat 52.09–52.37.
- Aplikacja nie odpytuje WFS na żywo.

## Zmiana względem rozmów: hosting na Cloudflare Workers

Darmowy Vercel (Hobby) blokuje wdrożenia z commitów osób innych niż właściciel konta („Hobby teams do not support collaboration”). Przy 4 osobach i podglądach PR to blokada. Cloudflare (darmowy) buduje każdy commit bez tego ograniczenia. Projekt jest **Workerem ze statycznymi plikami** (`wrangler.jsonc`): pliki z `dist/` serwuje Cloudflare, a `/api/*` trafia do `worker/index.ts`, który woła handlery z rejestru `server/live/index.ts`. Ograniczenie: pojedynczy plik do 25 MiB; mapa do zoomu 13 ma 12 MB. Kod proxy jest niezależny od hostingu (`server/`).

---

## Harmonogram i bramki

| Godzina | Co ma być prawdą | Kto sprawdza |
|---|---|---|
| 15:00 | T0 zrobione: dostęp do repo, klucze, projekt Cloudflare | lider |
| 15:45 | O1-A1 szkielet na `main` i wdrożony; kontrakty zamrożone | O1 |
| 16:00 | pierwsza integracja: każdy moduł renderuje coś na `main` (choćby dane testowe) | integrator |
| 16:30 | **decyzja: mapa offline** (O1-B1 działa albo plan B) | O1 |
| 18:00 | każdy moduł pokazuje prawdziwe dane na `main` | integrator |
| 19:00 | **minimum gotowe** (wszystkie pasy A i B na `main`); twarda bramka 20:00 | wszyscy |
| 21:00 | pierwsze przejście narracji prezentacji na działającej stronie | O4 |
| **24:00** | **wszystkie funkcje gotowe**; dalej tylko poprawki i wygląd | wszyscy |
| 0:00–2:00 | wspólne szukanie błędów na ścieżce Kasi | wszyscy |
| 2:00–7:00 | sen na zmiany: 2:00–4:30 śpią O1 i O3, 4:30–7:00 śpią O2 i O4 | dyżurni |
| 7:00–9:00 | prezentacja końcowa, dokumentacja, nagranie demo | O4 + chętni |
| **9:00** | **zamrożenie funkcji**, tylko krytyczne poprawki | wszyscy |
| 9:00–10:00 | dwie próby pitchu (5 min) i pytań (2 min) | prezenter |
| 10:00–10:30 | oddanie: prezentacja, link do repo, dokumentacja | lider |
| 10:30–11:00 | bufor, sprawdzenie dostępności linków | lider |

**Integracja o każdej pełnej godzinie:** każdy scala to, co ma zielone CI. Integrator (subagent O1) uruchamia `npm run test:e2e` na `main` i zgłasza błędy na kanale zespołu.

**Zasada pasów:** pas C osoby scala do `main` dopiero, gdy jej pasy A i B są na `main`.

## Mapa plików

```
.github/workflows/ci.yml            O1  CI dla każdego PR
CLAUDE.md                           O1  zasady dla każdej sesji Claude
package.json, vite.config.ts        O1  wszystkie zależności, PWA, middleware /api
index.html, src/main.tsx            O1
src/contracts.ts                    O1  typy wspólne (SPEC.md §5)
src/app/App.tsx                     O1  układ: mapa + dolne menu + panel
src/app/Onboarding.tsx              O1  4 adresy
src/app/miejsca.ts                  O1  useMiejsca() (IndexedDB)
src/app/Stopka.tsx                  O1  atrybucje
src/map/MapView.tsx                 O1  MapLibre + pmtiles
src/map/styl.ts                     O1  styl Protomaps z lokalnymi fontami
src/offline/siec.ts                 O1  useSiec(), ?offline=1
src/offline/paczka.ts               O1  pobranie paczki, OPFS dla mapy
src/offline/live-cache.ts           O1  zapis/odczyt StanLive w IndexedDB
src/modules/index.ts                O1  rejestr modułów
src/modules/adresy/                 O2  znajdzAdres()
src/modules/syreny/                 O2  wynikSyreny(), Panel
src/modules/transport/              O2  trasyMin(), Panel
src/modules/punkty/                 O3  najblizsze(), Panel, warstwy
src/modules/live/                   O4  Panel, warstwy, fetchLive()
server/portal.ts                    O4  wywołanie API miasta
server/live/*.ts                    O4  pojazdy, wiatr, powietrze, utrudnienia, rowery
server/live/index.ts                O4  rejestr handlerów /api/live/<nazwa>
worker/index.ts, wrangler.jsonc     O1  Cloudflare Worker (statyczne pliki + /api)
pipeline/pyproject.toml             O2  środowisko uv
pipeline/adresy|syreny|transport/   O2
pipeline/punkty/                    O3
pipeline/build_manifest.py          O2  manifest z meta.json
pipeline/validate.py                O2  walidacja paczki (CI)
public/pack/<moduł>/                właściciel modułu
public/map/                         O1  warszawa.pmtiles, fonty, sprite
tests/e2e/kasia.spec.ts             O1  ścieżka Kasi z offline
docs/pitch/, docs/DOKUMENTACJA.md   O4
```

## Jak każda osoba pracuje z subagentami

Każdy pas ma osobny katalog roboczy:

```bash
git fetch origin && git worktree add ../ws-o2-b -b o2/b-syreny-pipeline origin/main
```

Polecenie startowe dla sesji Claude Code w danym katalogu:

```
Pracujesz nad zadaniem <ID> z docs/PLAN.md. Przeczytaj CLAUDE.md, docs/SPEC.md (sekcje 5, 6, 9)
i treść zadania <ID>. Piszesz tylko w folderach z sekcji "Pliki" tego zadania. Najpierw test, potem kod.
Kiedy kryterium "Gotowe, gdy" jest spełnione: npm run typecheck && npm test, rebase na origin/main,
push i PR do main z tytułem "<ID>: <opis>".
```

Przed PR: `git fetch && git rebase origin/main && npm run typecheck && npm test && npm run build`.

---

## T0. Start (lider, do 15:00)

- [ ] **Krok 1: dostęp do repo.** Dodaj 3 osoby jako współpracowników z prawem zapisu:
  ```bash
  gh api -X PUT repos/startupowe1konto1/AI-Slopers-Hackathon/collaborators/<login> -f permission=push
  ```
- [ ] **Krok 2: klucze API.** Każda osoba generuje swój klucz na dane.um.warszawa.pl/pl/key-api i zapisuje w swoim `.env` jako `WARSAW_API_TOKEN=...`. Klucza nie wklejamy w czat ani do repo.
- [ ] **Krok 3: dane PSP.** Surowy `psp_punkty_schronienia_warszawa_bbox.csv` przekaż O3 poza gitem (dysk). Ląduje w `dane/psp-schronienia/` (ignorowane przez git).
- [x] **Krok 4: Cloudflare Worker `warszawa-kryzys`** (zrobione, https://warszawa-kryzys.startupaplikujmy.workers.dev). Każdy push na `main` wdraża się w około 35 s. Po wdrożeniu pierwsze otwarcie może pokazać starą wersję z service workera; drugie odświeżenie ładuje nową. Ustawienia → Build: build command `npm run build`, deploy command `npx wrangler deploy`, buildy gałęzi innych niż produkcyjna: `npx wrangler versions upload` (daje link podglądu). Variables and Secrets: `WARSAW_API_TOKEN` jako Secret.
- [ ] **Krok 5: ochrona `main`.** Settings → Branches → reguła dla `main`: wymagany PR, wymagany status `ci`.

Gotowe, gdy: 3 osoby mają dostęp, każdy ma działający klucz (`curl` z SPEC.md §6 zwraca dane), projekt Cloudflare istnieje.

---

## Pas O1: szkielet, mapa, offline, integracja

### O1-A1. Szkielet na `main` (15:00–15:45, blokuje UI wszystkich)

**Pliki:** utwórz wszystkie pliki O1 z mapy plików poza `src/map/*`, `src/offline/paczka.ts`, `tests/e2e/`.

**Interfejsy:**
- Produkuje: `src/contracts.ts` (SPEC.md §5, dosłownie), `src/modules/index.ts` z `export const moduly: Modul[]`, `useSiec()`, `useMiejsca(): { miejsca, gotowe }`, `fetchLive` z `src/offline/live-cache.ts`, middleware `/api/live/:nazwa` w dev.

- [ ] **Krok 1: projekt i zależności (wszystkie od razu)**
  ```bash
  npm create vite@latest . -- --template react-ts
  npm i maplibre-gl pmtiles @protomaps/basemaps kdbush geokdbush idb-keyval
  npm i -D vite-plugin-pwa vitest @vitest/coverage-v8 jsdom @testing-library/react @playwright/test @cloudflare/workers-types @types/geokdbush
  ```
  W `package.json` ustaw skrypty:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
  ```
- [ ] **Krok 2: `src/contracts.ts`** — skopiuj dosłownie blok z SPEC.md §5.
- [ ] **Krok 3: `src/offline/siec.ts`**
  ```ts
  import { useEffect, useState } from 'react';

  export const wymuszonyOffline = (): boolean =>
    new URLSearchParams(location.search).get('offline') === '1';

  export function useSiec(): { online: boolean; wymuszonyOffline: boolean } {
    const wym = wymuszonyOffline();
    const [online, setOnline] = useState(navigator.onLine);
    useEffect(() => {
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      addEventListener('online', on);
      addEventListener('offline', off);
      return () => { removeEventListener('online', on); removeEventListener('offline', off); };
    }, []);
    return { online: online && !wym, wymuszonyOffline: wym };
  }
  ```
- [ ] **Krok 4: `src/offline/live-cache.ts`** (używa go moduł `live`)
  ```ts
  import { get, set } from 'idb-keyval';
  import type { StanLive } from '../contracts';
  import { wymuszonyOffline } from './siec';

  export async function fetchLive<T>(nazwa: string): Promise<StanLive<T> | null> {
    const klucz = `live:${nazwa}`;
    if (navigator.onLine && !wymuszonyOffline()) {
      try {
        const r = await fetch(`/api/live/${nazwa}`, { signal: AbortSignal.timeout(10000) });
        if (r.ok) {
          const stan = (await r.json()) as StanLive<T>;
          await set(klucz, stan);
          return stan;
        }
      } catch { /* przechodzimy do cache */ }
    }
    const zapis = await get<StanLive<T>>(klucz);
    return zapis ? { ...zapis, zCache: true } : null;
  }
  ```
- [ ] **Krok 5: `src/app/miejsca.ts`**
  ```ts
  import { get, set } from 'idb-keyval';
  import { useEffect, useState } from 'react';
  import type { MiejsceUzytkownika } from '../contracts';

  const KLUCZ = 'miejsca';
  const sluchacze = new Set<(m: MiejsceUzytkownika[]) => void>();

  export async function zapiszMiejsca(m: MiejsceUzytkownika[]): Promise<void> {
    await set(KLUCZ, m);
    sluchacze.forEach((f) => f(m));
  }

  export function useMiejsca(): MiejsceUzytkownika[] {
    const [m, setM] = useState<MiejsceUzytkownika[]>([]);
    useEffect(() => {
      get<MiejsceUzytkownika[]>(KLUCZ).then((v) => setM(v ?? []));
      sluchacze.add(setM);
      return () => { sluchacze.delete(setM); };
    }, []);
    return m;
  }
  ```
- [ ] **Krok 6: `src/modules/index.ts` i atrapy modułów.** Każdy właściciel podmieni swoją atrapę w swoim folderze, bez dotykania tego pliku.
  ```ts
  import type { Modul } from '../contracts';
  import { modul as syreny } from './syreny';
  import { modul as punkty } from './punkty';
  import { modul as transport } from './transport';
  import { modul as live } from './live';

  export const moduly: Modul[] = [syreny, punkty, transport, live];
  ```
  W każdym z `src/modules/{syreny,punkty,transport,live}/index.tsx` atrapa:
  ```tsx
  import type { Modul } from '../../contracts';
  export const modul: Modul = {
    id: 'syreny', // odpowiednio: punkty, transport, live
    nazwa: 'Syreny',
    Panel: () => <p>Moduł w budowie</p>,
  };
  ```
  W `src/modules/adresy/index.ts` atrapa z 3 adresami testowymi:
  ```ts
  import type { Adres } from '../../contracts';
  const TEST: Adres[] = [
    { id: 't1', ulica: 'ul. Powstańców Śląskich', numer: '10', dzielnica: 'Bemowo', lat: 52.2385, lon: 20.9131 },
    { id: 't2', ulica: 'rondo Ignacego Daszyńskiego', numer: '1', dzielnica: 'Wola', lat: 52.2302, lon: 20.9840 },
    { id: 't3', ulica: 'ul. Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0911 },
  ];
  export async function znajdzAdres(q: string, limit = 10): Promise<Adres[]> {
    const s = q.toLowerCase();
    return TEST.filter((a) => `${a.ulica} ${a.numer}`.toLowerCase().includes(s)).slice(0, limit);
  }
  ```
- [ ] **Krok 7: `src/app/App.tsx`** — układ mobilny (max-width 480 px, wyśrodkowany): na górze pasek z wybranym miejscem i wskaźnikiem sieci („Online” / „Offline — dane z paczki”), w środku `<MapView>` (na razie `<div id="mapa">`), na dole 4 przyciski z `moduly` i panel aktywnego modułu, który dostaje `ModulProps`. Gdy `useMiejsca()` jest puste, pokaż `<Onboarding>`. Wybrane miejsce domyślnie `dom`.
- [ ] **Krok 8: `src/app/Onboarding.tsx`** — 4 pola z etykietami „Dom”, „Praca”, „Przedszkole”, „Bliska osoba” (`<label>`), każde jako combobox z podpowiedziami z `znajdzAdres(q, 8)` (podpowiedzi z `role="option"`, wymaga tego test e2e), przycisk „Zapisz” → `zapiszMiejsca`. Pola poza „dom” są opcjonalne. Pod spodem przycisk „Pobierz paczkę offline” (podłączy go O1-B1).
- [ ] **Krok 9: middleware `/api` w `vite.config.ts` i PWA**
  ```ts
  /// <reference types="vitest/config" />
  import { defineConfig, loadEnv, type Plugin } from 'vite';
  import react from '@vitejs/plugin-react';
  import { VitePWA } from 'vite-plugin-pwa';

  function apiDev(env: Record<string, string>): Plugin {
    return {
      name: 'api-dev',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const m = req.url?.match(/^\/api\/live\/([a-z]+)/);
          if (!m) return next();
          try {
            const mod = await server.ssrLoadModule(`/server/live/${m[1]}.ts`);
            const r: Response = await mod.handler(new Request(`http://localhost${req.url}`), env);
            res.statusCode = r.status;
            r.headers.forEach((v, k) => res.setHeader(k, v));
            res.end(Buffer.from(await r.arrayBuffer()));
          } catch (e) {
            res.statusCode = 404;
            res.end(JSON.stringify({ blad: 'brak handlera ' + m[1] }));
          }
        });
      },
    };
  }

  export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      plugins: [
        react(),
        apiDev(env),
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
            globIgnores: ['pack/**', 'map/**'],
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api\//],
            runtimeCaching: [
              { urlPattern: /\/pack\//, handler: 'CacheFirst', options: { cacheName: 'pack' } },
              { urlPattern: /\/map\/(fonts|sprites)\//, handler: 'CacheFirst', options: { cacheName: 'map-assets' } },
            ],
          },
          manifest: { name: 'Warszawa w trybie kryzysowym', short_name: 'WawaKryzys', lang: 'pl', theme_color: '#b91c1c', display: 'standalone' },
        }),
      ],
      test: { environment: 'jsdom' },
    };
  });
  ```
  Każdy handler w `server/live/<nazwa>.ts` eksportuje `handler(req: Request, env: { WARSAW_API_TOKEN?: string }): Promise<Response>`.
- [ ] **Krok 10: `CLAUDE.md`** w korzeniu repo:
  ```markdown
  # Zasady repo (czytaj przed każdą zmianą)
  - Specyfikacja: docs/SPEC.md. Plan i zadania: docs/PLAN.md. Pracujesz nad jednym zadaniem z PLAN.md.
  - Piszesz tylko w folderach swojej osoby (SPEC.md §9). Inne pliki: osobny PR z tytułem "[kontrakt] ...".
  - Typy wspólne tylko z src/contracts.ts. Nie dodawaj zależności npm bez PR [kontrakt].
  - Klucz API tylko w .env jako WARSAW_API_TOKEN. Nigdy w src/, logach, testach ani commitach.
  - API miasta: POST https://dane.um.warszawa.pl/api/action/get_<zbiór>, nagłówek Authorization: <klucz>.
    Zły klucz daje 500 "Service unavailable", nie 401.
  - Dokumentacja pól API: kontekst/dokumentacja-api/*_pa.json i *_pw.json (kodowanie utf-8-sig).
  - Teksty: "miejsca schronienia według PSP", nigdy "schrony". Nie ogłaszamy alarmów. Nie pokazujemy miejsc uderzeń.
  - Każdy panel ma stany: ładowanie, brak sieci, brak danych, błąd źródła.
  - TDD: test → czerwony → kod → zielony. Przed PR: rebase na origin/main, npm run typecheck, npm test, npm run build.
  - Nie pisz kodu na zapas. Najmniejsza zmiana, która spełnia "Gotowe, gdy".
  ```
- [ ] **Krok 11: CI `.github/workflows/ci.yml`**
  ```yaml
  name: ci
  on: [pull_request, push]
  jobs:
    ci:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 22, cache: npm }
        - run: npm ci
        - run: npm run typecheck
        - run: npm test -- --passWithNoTests
        - run: npm run build
        - uses: astral-sh/setup-uv@v5
        - run: if [ -f pipeline/validate.py ]; then uv run --project pipeline pipeline/validate.py; fi
  ```
- [ ] **Krok 12: `.env.example`** z linią `WARSAW_API_TOKEN=` i dopisanie `dist/`, `dev-dist/` do `.gitignore`.
- [ ] **Krok 13: sprawdzenie i PR**
  Run: `npm run typecheck && npm test -- --passWithNoTests && npm run build && npm run dev`
  Expected: strona na `localhost:5173` pokazuje onboarding; po zapisaniu adresu testowego widać dolne menu z 4 modułami „Moduł w budowie”.
  PR `O1-A1: szkielet`, scal od razu po zielonym CI. Ogłoś zespołowi: „szkielet na main, róbcie rebase”.

Gotowe, gdy: `main` jest zielony, wdrożony na Cloudflare, a podgląd PR innej osoby buduje się automatycznie (sprawdź na pierwszym PR O2/O3/O4).

### O1-A2. Mapa Warszawy online (15:45–16:45)

**Pliki:** `src/map/MapView.tsx`, `src/map/styl.ts`, `public/map/**`, `src/app/App.tsx`.

**Interfejsy:** produkuje `<MapView centrum={Wsp} moduly={Modul[]} onMapa?={(m) => void} />`. Woła `modul.dodajWarstwy(map)` dla każdego modułu po `load` i sprzątanie przy odmontowaniu.

- [ ] **Krok 1: wytnij mapę.** Zainstaluj CLI (`brew install pmtiles` albo binarka z github.com/protomaps/go-pmtiles/releases):
  ```bash
  pmtiles extract https://build.protomaps.com/20261017.pmtiles public/map/warszawa.pmtiles --bbox=20.85,52.09,21.28,52.37 --maxzoom=13
  ls -lh public/map/warszawa.pmtiles
  ```
  Expected: plik poniżej 25 MiB (limit Cloudflare na plik). Jeśli większy: zawęź bbox o 0.01° z każdej strony. Usuń `*.pmtiles` z `.gitignore` i dodaj plik do repo.
- [ ] **Krok 2: fonty i sprite lokalnie** (mapa offline nie może ich pobierać z sieci):
  ```bash
  B=https://protomaps.github.io/basemaps-assets
  for f in "Noto Sans Regular" "Noto Sans Medium" "Noto Sans Italic"; do
    for r in 0-255 256-511 8192-8447; do
      mkdir -p "public/map/fonts/$f"; curl -sf "$B/fonts/${f// /%20}/$r.pbf" -o "public/map/fonts/$f/$r.pbf"
    done
  done
  mkdir -p public/map/sprites
  for s in light.json light.png light@2x.json light@2x.png; do curl -sf "$B/sprites/v4/$s" -o "public/map/sprites/$s"; done
  ```
- [ ] **Krok 3: `src/map/styl.ts`**
  ```ts
  import { layers, namedFlavor } from '@protomaps/basemaps';
  import type { StyleSpecification } from 'maplibre-gl';

  export function styl(pmtilesUrl: string): StyleSpecification {
    return {
      version: 8,
      glyphs: `${location.origin}/map/fonts/{fontstack}/{range}.pbf`,
      sprite: `${location.origin}/map/sprites/light`,
      sources: {
        osm: {
          type: 'vector',
          url: pmtilesUrl,
          attribution: '© OpenStreetMap (ODbL), Protomaps',
        },
      },
      layers: layers('osm', namedFlavor('light'), { lang: 'pl' }),
    };
  }
  ```
- [ ] **Krok 4: `src/map/MapView.tsx`** — `maplibregl.addProtocol('pmtiles', protocol.tile)` raz na moduł; źródło: jeśli `plikMapy()` (z O1-B1) zwraca plik, użyj `new PMTiles(new FileSource(plik))`, `protocol.add(p)` i URL `pmtiles://${plik.name}`; w przeciwnym razie `pmtiles://${location.origin}/map/warszawa.pmtiles`. Centrum: wybrane miejsce, zoom 13, `maxBounds` = bbox Warszawy. Do czasu O1-B1 `plikMapy` zwraca `null`.
- [ ] **Krok 5: sprawdzenie.** `npm run dev`. Expected: mapa Warszawy z polskimi nazwami, brak błędów 404 w konsoli dla fontów zakresu 0-255.
- [ ] **Krok 6: PR** `O1-A2: mapa`.

Gotowe, gdy: mapa działa na podglądzie Cloudflare.

### O1-B1. Offline: paczka i mapa w OPFS (spike do 16:30, potem dokończenie)

**Pliki:** `src/offline/paczka.ts`, `src/offline/paczka.test.ts`, `src/app/Onboarding.tsx`.

**Interfejsy:** produkuje `pobierzPaczke(onPostep: (zrobione: number, wszystkie: number) => void): Promise<void>`, `plikMapy(): Promise<File | null>`, `stanPaczki(): Promise<{ wersja: string; zbudowano: string } | null>`.

- [ ] **Krok 1: test** `src/offline/paczka.test.ts` — zamockuj `fetch` (manifest z 2 plikami) i `navigator.storage.getDirectory`; sprawdź, że `pobierzPaczke` pobiera manifest, oba pliki z `manifest.pliki` i mapę, a `onPostep` dostaje `(3, 3)` na końcu.
- [ ] **Krok 2: uruchom** `npx vitest run src/offline/paczka.test.ts` → FAIL (brak modułu).
- [ ] **Krok 3: implementacja**
  ```ts
  import type { Manifest } from '../contracts';

  const MAPA = 'warszawa.pmtiles';

  export async function plikMapy(): Promise<File | null> {
    try {
      const root = await navigator.storage.getDirectory();
      const fh = await root.getFileHandle(MAPA);
      return await fh.getFile();
    } catch { return null; }
  }

  export async function pobierzPaczke(onPostep: (z: number, w: number) => void): Promise<void> {
    await navigator.storage.persist?.();
    const manifest = (await (await fetch('/pack/manifest.json')).json()) as Manifest;
    const wszystkie = manifest.pliki.length + 1;
    let z = 0;
    for (const p of manifest.pliki) {
      const r = await fetch(`/pack/${p.sciezka}`); // service worker zapisuje w cache "pack"
      if (!r.ok) throw new Error(`Nie pobrano ${p.sciezka}`);
      await r.arrayBuffer();
      onPostep(++z, wszystkie);
    }
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(MAPA, { create: true });
    const res = await fetch(`/map/${MAPA}`);
    if (!res.ok || !res.body) throw new Error('Nie pobrano mapy');
    await res.body.pipeTo(await fh.createWritable());
    localStorage.setItem('paczka', JSON.stringify({ wersja: manifest.wersja, zbudowano: manifest.zbudowano }));
    onPostep(++z, wszystkie);
  }

  export async function stanPaczki(): Promise<{ wersja: string; zbudowano: string } | null> {
    const s = localStorage.getItem('paczka');
    return s ? JSON.parse(s) : null;
  }
  ```
- [ ] **Krok 4: uruchom test** → PASS.
- [ ] **Krok 5: spike ręczny (do 16:30).** `npm run build && npm run preview`, w Chrome: onboarding → „Pobierz paczkę” → DevTools → Network → Offline → odśwież. Expected: strona się ładuje, mapa wyświetla Warszawę z OPFS. **Jeśli nie działa o 16:30:** plan B — w offline zamiast mapy wektorowej rysuj na tle `#eef2f3` warstwy GeoJSON granic dzielnic (`public/pack/punkty/dzielnice.json`, O3 pobiera z `wfs:GRANICE_DZIELNIC`) i punkty; zgłoś decyzję zespołowi.
- [ ] **Krok 6: podłącz w onboardingu** przycisk z paskiem postępu i komunikatem „Paczka offline z dnia …”. W pasku górnym pokaż „Offline — dane z paczki z HH:MM”, gdy `!online`.
- [ ] **Krok 7: PR** `O1-B1: offline`.

Gotowe, gdy: po „Pobierz paczkę” i przełączeniu w Offline strona i mapa działają po odświeżeniu.

### O1-C1. Integrator: ścieżka Kasi w Playwright (od 18:00, potem co godzinę)

**Pliki:** `tests/e2e/kasia.spec.ts`, `playwright.config.ts`.

- [ ] **Krok 1: konfiguracja** `playwright.config.ts`: `webServer: { command: 'npm run build && npm run preview -- --port 4173', port: 4173 }`, `use: { baseURL: 'http://localhost:4173', viewport: { width: 390, height: 844 } }`.
- [ ] **Krok 2: test**
  ```ts
  import { test, expect } from '@playwright/test';

  test('Kasia: onboarding, moduły, offline', async ({ page, context }) => {
    await page.goto('/');
    await page.getByLabel('Dom').fill('Powstańców Śląskich 10');
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await page.getByRole('button', { name: 'Pobierz paczkę offline' }).click();
    await expect(page.getByText(/Paczka offline z dnia/)).toBeVisible({ timeout: 120000 });

    await page.getByRole('button', { name: 'Syreny' }).click();
    await expect(page.getByTestId('wynik-syreny')).toBeVisible();
    await page.getByRole('button', { name: 'Pomoc' }).click();
    await expect(page.getByTestId('lista-punktow').getByRole('listitem')).toHaveCount(3);

    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button', { name: 'Syreny' }).click();
    await expect(page.getByTestId('wynik-syreny')).toBeVisible();
    await page.getByRole('button', { name: 'Na żywo' }).click();
    await expect(page.getByText(/stan na/i)).toBeVisible();
  });
  ```
  Etykiety przycisków modułów: `Syreny`, `Pomoc`, `Dojazd`, `Na żywo` (pole `nazwa` w `Modul`). Ten test jest umową z O2, O3 i O4: `data-testid="wynik-syreny"`, `data-testid="lista-punktow"`.
- [ ] **Krok 3: co godzinę** `git pull && npm run test:e2e`; wynik i błędy na kanał zespołu.

### O1-C2. Dobudowa UI (po 19:00)

- [ ] Wskaźnik „stan na …” spójny w całej aplikacji; stopka z atrybucjami z `manifest.zrodla` (`src/app/Stopka.tsx`).
- [ ] Przełącznik języka PL/EN dla nagłówków i przycisków (słownik w `src/app/i18n.ts`; moduły mogą z niego korzystać przez PR `[kontrakt]`).
- [ ] Przegląd UI skillem `impeccable` (audit) na podglądzie, poprawki kontrastu i rozmiarów dotyku.

---

## Pas O2: adresy, syreny, transport

### O2-B1. Środowisko Python i paczka adresów (15:00–16:00)

**Pliki:** `pipeline/pyproject.toml`, `pipeline/adresy/build.py`, `pipeline/adresy/test_build.py`, `public/pack/adresy/adresy.json`, `public/pack/adresy/meta.json`.

**Interfejsy:** produkuje `public/pack/adresy/adresy.json` w formacie kolumnowym (kolejność wierszy = kolejność w CSV):
```json
{ "ulice": ["ul. Kapelusznicza", "..."], "dzielnice": ["Rembertów", "..."],
  "id": ["1315200"], "u": [0], "nr": ["22"], "dz": [0], "lat": [52.277396], "lon": [21.168228] }
```

- [ ] **Krok 1: `pipeline/pyproject.toml`**
  ```toml
  [project]
  name = "pipeline"
  version = "0.1.0"
  requires-python = ">=3.12"
  dependencies = ["geopandas>=1.0", "shapely>=2.0", "pyproj>=3.6", "pandas>=2.2", "pytest>=8", "requests>=2.32"]
  ```
  Run: `cd pipeline && uv sync` → Expected: środowisko utworzone bez błędów.
- [ ] **Krok 2: test** `pipeline/adresy/test_build.py`
  ```python
  import json
  from pathlib import Path
  ROOT = Path(__file__).resolve().parents[2]

  def test_adresy_pack():
      d = json.loads((ROOT / "public/pack/adresy/adresy.json").read_text(encoding="utf-8"))
      n = len(d["id"])
      assert n == 126923
      assert all(len(d[k]) == n for k in ("u", "nr", "dz", "lat", "lon"))
      assert all(52.09 <= x <= 52.37 for x in d["lat"])
      assert all(20.85 <= x <= 21.28 for x in d["lon"])
  ```
  Run: `uv run --project pipeline pytest pipeline/adresy -q` → FAIL (brak pliku).
- [ ] **Krok 3: `pipeline/adresy/build.py`**
  ```python
  import json
  from datetime import datetime, timezone
  from pathlib import Path
  import pandas as pd

  ROOT = Path(__file__).resolve().parents[2]
  OUT = ROOT / "public/pack/adresy"
  OUT.mkdir(parents=True, exist_ok=True)

  a = pd.read_csv(ROOT / "dane/adresy/punkty_adresowe_wgs84.csv", dtype={"id": str, "numer": str})
  ulice = sorted(a["ulica"].unique())
  dzielnice = sorted(a["dzielnica"].unique())
  ui = {u: i for i, u in enumerate(ulice)}
  di = {d: i for i, d in enumerate(dzielnice)}
  pack = {
      "ulice": ulice, "dzielnice": dzielnice, "id": a["id"].tolist(),
      "u": [ui[u] for u in a["ulica"]], "nr": a["numer"].tolist(), "dz": [di[d] for d in a["dzielnica"]],
      "lat": a["lat"].round(6).tolist(), "lon": a["lon"].round(6).tolist(),
  }
  (OUT / "adresy.json").write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
  (OUT / "meta.json").write_text(json.dumps({
      "modul": "adresy", "rekordy": len(a),
      "zrodla": {"wfs-adresy": {"nazwa": "m.st. Warszawa, WFS PUNKTY_ADRESOWE_WGS84", "licencja": "CC BY",
                                 "url": "https://wfs.um.warszawa.pl/serwis", "pobrano": "2026-10-17T14:28:00+02:00"}},
  }, ensure_ascii=False, indent=1), encoding="utf-8")
  print("adresy:", len(a))
  ```
  Run: `uv run --project pipeline python pipeline/adresy/build.py && uv run --project pipeline pytest pipeline/adresy -q` → `1 passed`.
- [ ] **Krok 4: `pipeline/build_manifest.py` i `pipeline/validate.py`**
  ```python
  # build_manifest.py
  import json
  from datetime import datetime, timezone
  from pathlib import Path
  ROOT = Path(__file__).resolve().parents[1]
  PACK = ROOT / "public/pack"
  pliki, zrodla = [], {}
  for meta in sorted(PACK.glob("*/meta.json")):
      m = json.loads(meta.read_text(encoding="utf-8"))
      zrodla.update(m["zrodla"])
      for f in sorted(meta.parent.glob("*")):
          pliki.append({"sciezka": f.relative_to(PACK).as_posix(), "bajty": f.stat().st_size, "modul": m["modul"]})
  teraz = datetime.now(timezone.utc).isoformat(timespec="seconds")
  (PACK / "manifest.json").write_text(json.dumps(
      {"wersja": teraz[:16], "zbudowano": teraz, "pliki": pliki, "zrodla": zrodla}, ensure_ascii=False, indent=1), encoding="utf-8")
  print(len(pliki), "plików")
  ```
  ```python
  # validate.py
  import json, sys
  from pathlib import Path
  ROOT = Path(__file__).resolve().parents[1]
  PACK = ROOT / "public/pack"
  m = json.loads((PACK / "manifest.json").read_text(encoding="utf-8"))
  bledy = [p["sciezka"] for p in m["pliki"] if not (PACK / p["sciezka"]).exists()]
  for p in PACK.glob("*/meta.json"):
      meta = json.loads(p.read_text(encoding="utf-8"))
      if not meta["zrodla"] or meta["rekordy"] <= 0:
          bledy.append(f"{p}: brak źródła lub rekordów")
  print("\n".join(bledy) or "paczka OK")
  sys.exit(1 if bledy else 0)
  ```
  **Zasada:** każdy, kto zmienia paczkę, uruchamia na końcu `uv run --project pipeline python pipeline/build_manifest.py` i commituje `manifest.json`. Przy konflikcie w `manifest.json`: weź dowolną wersję i uruchom skrypt ponownie.
- [ ] **Krok 5: PR** `O2-B1: pipeline i adresy`.

### O2-B2. Syreny dla każdego adresu (16:00–17:00)

**Pliki:** `pipeline/syreny/build.py`, `pipeline/syreny/test_build.py`, `public/pack/syreny/syreny.json`, `public/pack/syreny/meta.json`.

**Interfejsy:** `syreny.json` = `{ "n": "<126923 znaki>", "b": "<126923 znaki>" }`, znak `i` dotyczy wiersza `i` w `adresy.json`: `3` = ≥75 dB, `2` = 70–75, `1` = 65–70, `0` = poniżej 65. `n` = wszystkie syreny, `b` = tylko cyfrowe.

- [ ] **Krok 1: test** (wartości z analizy w handoffie: 92,5% i 69,1% adresów w zasięgu ≥65 dB)
  ```python
  import json
  from pathlib import Path
  ROOT = Path(__file__).resolve().parents[2]

  def test_syreny_zgodne_z_analiza():
      s = json.loads((ROOT / "public/pack/syreny/syreny.json").read_text())
      n = len(s["n"])
      assert n == len(s["b"]) == 126923
      zasieg_n = sum(c != "0" for c in s["n"]) / n
      zasieg_b = sum(c != "0" for c in s["b"]) / n
      assert abs(zasieg_n - 0.925) < 0.01
      assert abs(zasieg_b - 0.691) < 0.01
      assert all(b <= a for a, b in zip(s["n"], s["b"]))
  ```
  Uwaga: analiza liczyła tylko adresy wewnątrz granicy miasta. Jeśli wynik różni się o więcej niż 1 pp, sprawdź to w `dane/soia-warszawa/analiza/syreny_blackout.py` i opisz różnicę, zamiast poprawiać test na siłę.
- [ ] **Krok 2: `pipeline/syreny/build.py`**
  ```python
  import json
  from pathlib import Path
  import geopandas as gpd
  import pandas as pd

  ROOT = Path(__file__).resolve().parents[2]
  OUT = ROOT / "public/pack/syreny"
  OUT.mkdir(parents=True, exist_ok=True)

  cr = gpd.read_file(ROOT / "dane/soia-warszawa/soia-warszawa.gpkg", layer="coverage_ranges")  # EPSG:2180, kolumny db (65/70/75), typ
  cr["geometry"] = cr.geometry.simplify(10).buffer(0)
  a = pd.read_csv(ROOT / "dane/adresy/punkty_adresowe_wgs84.csv", dtype={"id": str})
  pts = gpd.GeoDataFrame(a[["id"]], geometry=gpd.points_from_xy(a.lon, a.lat), crs=4326).to_crs(cr.crs)

  def najlepszy_db(zasiegi):
      j = gpd.sjoin(pts[["geometry"]], zasiegi[["geometry", "db"]], predicate="within")
      return j.groupby(level=0)["db"].max().reindex(pts.index).fillna(0).astype(int)

  KOD = {75: "3", 70: "2", 65: "1", 0: "0"}
  n = najlepszy_db(cr).map(KOD)
  b = najlepszy_db(cr[cr["typ"] == "cyfrowa"]).map(KOD)
  (OUT / "syreny.json").write_text(json.dumps({"n": "".join(n), "b": "".join(b)}), encoding="utf-8")
  (OUT / "meta.json").write_text(json.dumps({
      "modul": "syreny", "rekordy": len(n),
      "zrodla": {"soia": {"nazwa": "KG PSP, SOIA, wersja danych 2026.05 (Zenodo 10.5281/zenodo.21921103); przycięte do granic m.st. Warszawy",
                          "licencja": "CC BY 4.0", "url": "https://doi.org/10.5281/zenodo.21921103", "pobrano": "2026-10-17T13:02:00+02:00"}},
  }, ensure_ascii=False, indent=1), encoding="utf-8")
  ```
- [ ] **Krok 3: uruchom** build i test → `1 passed`. Następnie `build_manifest.py`.
- [ ] **Krok 4: PR** `O2-B2: syreny dla adresów`.

### O2-A1. Moduł `adresy`: wyszukiwanie offline (16:00–17:30)

**Pliki:** `src/modules/adresy/index.ts`, `src/modules/adresy/szukaj.ts`, `src/modules/adresy/szukaj.test.ts`.

**Interfejsy:** produkuje `znajdzAdres(q: string, limit = 10): Promise<Adres[]>` i `adresPoIndeksie(i: number): Promise<Adres>`, `indeksAdresu(id: string): Promise<number>` (dla syren).

- [ ] **Krok 1: test** `szukaj.test.ts` na małej paczce w pamięci:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { normalizuj, szukaj } from './szukaj';

  const pack = {
    ulice: ['al. Jerozolimskie', 'ul. Grochowska', 'ul. Powstańców Śląskich'],
    dzielnice: ['Ochota', 'Praga-Południe', 'Bemowo'],
    id: ['1', '2', '3', '4'], u: [0, 1, 2, 2], nr: ['100', '200', '10', '10A'], dz: [0, 1, 2, 2],
    lat: [52.22, 52.24, 52.23, 52.231], lon: [20.98, 21.09, 20.91, 20.911],
  };

  describe('szukaj', () => {
    it('ignoruje polskie znaki i przedrostki', () => {
      expect(normalizuj('ul. Powstańców Śląskich')).toBe('powstancow slaskich');
    });
    it('znajduje ulicę i numer', () => {
      expect(szukaj(pack, 'powstancow 10', 5).map((a) => a.numer)).toEqual(['10', '10A']);
    });
    it('dokładny numer pierwszy', () => {
      expect(szukaj(pack, 'Powstańców Śląskich 10A', 5)[0].id).toBe('4');
    });
    it('sama ulica zwraca adresy', () => {
      expect(szukaj(pack, 'jerozolimskie', 5)[0].ulica).toBe('al. Jerozolimskie');
    });
    it('pusty wynik dla nieznanej ulicy', () => {
      expect(szukaj(pack, 'nieistniejaca 5', 5)).toEqual([]);
    });
  });
  ```
- [ ] **Krok 2:** `npx vitest run src/modules/adresy` → FAIL.
- [ ] **Krok 3: `szukaj.ts`**
  ```ts
  import type { Adres } from '../../contracts';

  export type PaczkaAdresow = {
    ulice: string[]; dzielnice: string[]; id: string[]; u: number[]; nr: string[]; dz: number[]; lat: number[]; lon: number[];
  };

  const PRZEDROSTKI = /^(ul|al|pl|os|rondo|aleja|plac|osiedle|skwer)\.?\s+/;
  export const normalizuj = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')
      .replace(PRZEDROSTKI, '').replace(/\s+/g, ' ').trim();

  export const adres = (p: PaczkaAdresow, i: number): Adres => ({
    id: p.id[i], ulica: p.ulice[p.u[i]], numer: p.nr[i], dzielnica: p.dzielnice[p.dz[i]], lat: p.lat[i], lon: p.lon[i],
  });

  export function szukaj(p: PaczkaAdresow, q: string, limit: number): Adres[] {
    const m = normalizuj(q).match(/^(.*?)(?:\s+(\d+[a-z]?(?:\/\d+)?))?$/);
    if (!m || !m[1]) return [];
    const slowa = m[1].split(' ');
    const numer = m[2]?.toLowerCase();
    const ulice = new Set<number>();
    p.ulice.forEach((u, i) => {
      const w = normalizuj(u).split(' ');
      if (slowa.every((s) => w.some((x) => x.startsWith(s)))) ulice.add(i);
    });
    const wynik: number[] = [];
    for (let i = 0; i < p.id.length; i++) {
      if (!ulice.has(p.u[i])) continue;
      if (numer && !p.nr[i].toLowerCase().startsWith(numer)) continue;
      wynik.push(i);
    }
    wynik.sort((a, b) => Number(p.nr[b].toLowerCase() === numer) - Number(p.nr[a].toLowerCase() === numer)
      || p.nr[a].localeCompare(p.nr[b], 'pl', { numeric: true }));
    return wynik.slice(0, limit).map((i) => adres(p, i));
  }
  ```
- [ ] **Krok 4:** testy → PASS.
- [ ] **Krok 5: `index.ts`** — ładuje `/pack/adresy/adresy.json` raz (memo w `Promise`), eksportuje `znajdzAdres`, `adresPoIndeksie`, `indeksAdresu` (mapa `id → i` budowana leniwie, `-1` gdy brak). Zastępuje atrapę z O1-A1.
- [ ] **Krok 6: PR** `O2-A1: wyszukiwanie adresów`. Sprawdź na podglądzie: onboarding podpowiada prawdziwe adresy.

### O2-A2. Moduł `syreny`: karta wyniku (17:30–19:00)

**Pliki:** `src/modules/syreny/index.tsx`, `src/modules/syreny/wynik.ts`, `src/modules/syreny/wynik.test.ts`, `src/modules/syreny/Panel.tsx`.

**Interfejsy:** produkuje `wynikSyreny(adresId: string): Promise<WynikSyreny | null>` i `modul` z `nazwa: 'Syreny'`.

- [ ] **Krok 1: test** `wynik.test.ts`
  ```ts
  import { it, expect } from 'vitest';
  import { klasa, ocena } from './wynik';

  it('mapuje kody na klasy', () => {
    expect(['3', '2', '1', '0'].map(klasa)).toEqual(['75+', '70-75', '65-70', 'ponizej_65']);
  });
  it('ocena łączy oba warianty', () => {
    expect(ocena({ adresId: 'x', normalnie: '75+', blackout: 'ponizej_65' }).poziom).toBe('ryzyko_blackout');
    expect(ocena({ adresId: 'x', normalnie: 'ponizej_65', blackout: 'ponizej_65' }).poziom).toBe('nie_slychac');
    expect(ocena({ adresId: 'x', normalnie: '70-75', blackout: '70-75' }).poziom).toBe('slychac');
  });
  ```
- [ ] **Krok 2:** FAIL → **Krok 3: `wynik.ts`**
  ```ts
  import type { KlasaSyreny, WynikSyreny } from '../../contracts';
  import { indeksAdresu } from '../adresy';

  const KLASY: KlasaSyreny[] = ['ponizej_65', '65-70', '70-75', '75+'];
  export const klasa = (c: string): KlasaSyreny => KLASY[Number(c)];

  export type Poziom = 'slychac' | 'slabo' | 'ryzyko_blackout' | 'nie_slychac';
  export function ocena(w: WynikSyreny): { poziom: Poziom } {
    if (w.normalnie === 'ponizej_65') return { poziom: 'nie_slychac' };
    if (w.blackout === 'ponizej_65') return { poziom: 'ryzyko_blackout' };
    if (w.normalnie === '65-70') return { poziom: 'slabo' };
    return { poziom: 'slychac' };
  }

  let dane: Promise<{ n: string; b: string }> | null = null;
  export async function wynikSyreny(adresId: string): Promise<WynikSyreny | null> {
    dane ??= fetch('/pack/syreny/syreny.json').then((r) => r.json());
    const [s, i] = await Promise.all([dane, indeksAdresu(adresId)]);
    if (i < 0) return null;
    return { adresId, normalnie: klasa(s.n[i]), blackout: klasa(s.b[i]) };
  }
  ```
- [ ] **Krok 4:** PASS → **Krok 5: `Panel.tsx`** z `data-testid="wynik-syreny"`. Dla każdego zapisanego miejsca: dwa wiersze „Normalnie” i „Przy blackoucie” z kolorem klasy i krótkim opisem. Teksty:
  - `slychac`: „Syrena powinna być słyszalna na zewnątrz.”
  - `slabo`: „Syrena może być słabo słyszalna, zwłaszcza w mieszkaniu.”
  - `ryzyko_blackout`: „Jeśli syreny analogowe nie mają zasilania awaryjnego, przy blackoucie możesz jej nie usłyszeć.”
  - `nie_slychac`: „W tym miejscu syrena prawdopodobnie nie jest słyszalna.”
  Kroki pod spodem (zawsze): „Włącz Alert RCB w telefonie”, „Zainstaluj aplikację RSO”, „Umów się z sąsiadem, kto kogo budzi”, „Wydrukuj kartę z adresami”. Dopisek: „Model dźwięku na zewnątrz budynków (KG PSP, SOIA 2026.05). Wariant blackout zakłada, że działają tylko syreny cyfrowe.”
- [ ] **Krok 6: PR** `O2-A2: syreny`.

### O2-C1. Moduł `transport` (wersja minimalna, od 17:00 w osobnym pasie)

**Pliki:** `pipeline/transport/build.py`, `pipeline/transport/test_build.py`, `public/pack/transport/przystanki.json`, `public/pack/transport/meta.json`, `src/modules/transport/{index.tsx,trasy.ts,trasy.test.ts,Panel.tsx}`.

**Interfejsy:** `przystanki.json` = `[{ "id": "7002", "nazwa": "Plac Narutowicza 01", "lat": 52.22, "lon": 20.98, "linie": ["128", "157"] }]` — tylko przystanki obsługiwane przez autobusy (`route_type` 3). Produkuje `trasyMin(miejsca: MiejsceUzytkownika[]): Promise<TrasaMin[]>`.

- [ ] **Krok 1: pobierz GTFS** (raz, do `dane/`, poza gitem przez rozmiar — dopisz `dane/gtfs/` do `.gitignore`):
  ```bash
  mkdir -p dane/gtfs && curl -sfL https://mkuran.pl/gtfs/warsaw.zip -o dane/gtfs/warsaw.zip && unzip -o dane/gtfs/warsaw.zip -d dane/gtfs
  ```
- [ ] **Krok 2: test pipeline'u**: plik istnieje, ma ponad 1000 przystanków, każdy ma niepustą listę `linie`, współrzędne w bbox, a w liniach nie ma numerów tramwajów (1–79 bez prefiksu) ani metra (`M1`, `M2`).
- [ ] **Krok 3: `build.py`**: wczytaj `routes.txt` (filtr `route_type == 3`), `trips.txt`, `stop_times.txt` (tylko kolumny `trip_id`, `stop_id`), `stops.txt`; złącz, zgrupuj `stop_id → sorted(set(route_short_name))`; zapisz JSON i `meta.json` ze źródłem „GTFS Warszawa (mkuran.pl), źródło nieoficjalne, na podstawie danych ZTM”.
- [ ] **Krok 4: test logiki** `trasy.test.ts` z 4 przystankami w pamięci: linia wspólna dla przystanku przy A i przystanku ≤500 m od B trafia do wyniku; linia tylko przy A nie trafia; `pieszoMin = round(dystansM * 1.3 / 83)` (5 km/h), `rowerMin = round(dystansM * 1.3 / 250)` (15 km/h).
- [ ] **Krok 5: `trasy.ts`**: dla każdej pary miejsc (dom↔praca, dom↔przedszkole, praca↔przedszkole, dom↔bliska_osoba) policz dystans haversine, 3 najbliższe przystanki do 600 m od startu (`geokdbush.around`), linie przystanków do 500 m od celu, część wspólna.
- [ ] **Krok 6: `Panel.tsx`** (`nazwa: 'Dojazd'`): karta dla każdej pary: „Pieszo ~X min, rowerem ~Y min”, „Przy blackoucie: tramwaje, metro i SKM stoją. Autobusy z przystanku … : linie …”. Gdy brak wspólnej linii: „Brak bezpośredniego autobusu. Pieszo ~X min.”
- [ ] **Krok 7: PR** `O2-C1: transport minimalny`.

### O2-C2. Dobudowa syren (po 19:00)

- [ ] Karta do wydruku: przycisk „Drukuj kartę” → widok `@media print` z adresami, wynikiem syren, 3 najbliższymi miejscami schronienia (z `najblizsze` O3) i krokami.
- [ ] Warstwa „utracony zasięg przy blackoucie” na mapie z `dane/soia-warszawa/analiza/syreny_blackout_utracony_zasieg.geojson` (uproszczona do 20 m, skopiowana do `public/pack/syreny/utracony.json`), włączana przełącznikiem w panelu.

---

## Pas O3: punkty pomocy

### O3-B1. Pipeline punktów (15:00–17:00)

**Pliki:** `pipeline/punkty/build.py`, `pipeline/punkty/zrodla.py`, `pipeline/punkty/test_build.py`, `public/pack/punkty/punkty.json`, `public/pack/punkty/meta.json`, `dane/probki/`.

**Interfejsy:** `punkty.json` = `Punkt[]` (SPEC.md §5), `zrodlo` ∈ `psp`, `wfs-metro`, `wfs-apteki`, `um-aed`, `um-toalety`, `rprm-sor`.

- [ ] **Krok 1: próbki** — zapisz po jednej odpowiedzi każdego źródła do `dane/probki/<zrodlo>.*` i obejrzyj pola przed pisaniem parsera:
  - PSP: `dane/psp-schronienia/psp_punkty_schronienia_warszawa_bbox.csv` (kolumny `id_publiczny, lat, lon, adres, miejscowosc, dostepnosc`).
  - WFS: `https://wfs.um.warszawa.pl/serwis?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=wfs:METRO_WEJSCIA` oraz `wfs:APTEKI` (GML, przestrzeń nazw `http://fdo.osgeo.org/schemas/feature/wfs`, współrzędne w `gml:pos` jako „lon lat”). Przy timeout ponów do 3 razy.
  - Portal: `get_scb_lokalizacja_defibrylatorow` (710; `geometry.coordinates` = `[[lon, lat]]`, opis w `properties.device_location`, `device_availability`), `get_m_toalety` (695; GeoJSON, `properties.lokalizacja`, `godziny`).
  - SOR: `https://api.dane.gov.pl/1.4/datasets/1642/resources` → wybierz zasób CSV/XLSX, filtruj Warszawę, współrzędne z pliku albo z punktu adresowego (dopasowanie ulica + numer w `dane/adresy/punkty_adresowe_wgs84.csv`).
  - Dodatkowo do planu B mapy: `wfs:GRANICE_DZIELNIC` → `public/pack/punkty/dzielnice.json` (GeoJSON, uproszczony do 20 m).
- [ ] **Krok 2: test**
  ```python
  import json
  from collections import Counter
  from pathlib import Path
  ROOT = Path(__file__).resolve().parents[2]

  def test_punkty():
      p = json.loads((ROOT / "public/pack/punkty/punkty.json").read_text(encoding="utf-8"))
      c = Counter(x["rodzaj"] for x in p)
      assert c["schronienie_psp"] > 7000 and c["aed"] > 600 and c["toaleta"] > 600
      assert c["metro"] > 50 and c["apteka"] > 300 and c["sor"] >= 5
      assert all(20.85 <= x["lon"] <= 21.28 and 52.09 <= x["lat"] <= 52.37 for x in p)
      assert all(x["zrodlo"] and x["nazwa"] for x in p)
      assert len({x["id"] for x in p}) == len(p)
  ```
  Progi `metro`, `apteka`, `sor` popraw po obejrzeniu próbek (zapisz rzeczywiste liczby w commicie).
- [ ] **Krok 3: `zrodla.py`** — jedna funkcja na źródło, każda zwraca `list[dict]` w formacie `Punkt`; `build.py` je łączy, odrzuca punkty spoza bbox, zapisuje `punkty.json` i `meta.json` z 6 źródłami (licencje: PSP „za zgodą PSP”, WFS i portal „CC BY”, RPRM „CC BY 4.0”). Id: `<zrodlo>-<id ze źródła>`.
- [ ] **Krok 4:** build, test → PASS, `build_manifest.py`.
- [ ] **Krok 5: PR** `O3-B1: punkty pomocy`.

### O3-A1. Moduł `punkty` (16:00–19:00)

**Pliki:** `src/modules/punkty/{index.tsx,najblizsze.ts,najblizsze.test.ts,Panel.tsx,warstwy.ts}`.

**Interfejsy:** produkuje `najblizsze(wsp: Wsp, rodzaj: RodzajPunktu, n: number): Promise<Punkt[]>`, `linkPSP(p: Wsp): string`, `modul` z `nazwa: 'Pomoc'`.

- [ ] **Krok 1: test** `najblizsze.test.ts`
  ```ts
  import { it, expect } from 'vitest';
  import { zbuduj, najblizszeZ, linkPSP } from './najblizsze';
  import type { Punkt } from '../../contracts';

  const P: Punkt[] = [
    { id: 'a', rodzaj: 'aed', nazwa: 'A', lat: 52.2300, lon: 21.0000, zrodlo: 'um-aed' },
    { id: 'b', rodzaj: 'aed', nazwa: 'B', lat: 52.2400, lon: 21.0000, zrodlo: 'um-aed' },
    { id: 'c', rodzaj: 'apteka', nazwa: 'C', lat: 52.2301, lon: 21.0001, zrodlo: 'wfs-apteki' },
  ];

  it('zwraca najbliższe danego rodzaju w kolejności odległości', () => {
    const idx = zbuduj(P);
    expect(najblizszeZ(idx, { lat: 52.2350, lon: 21.0 }, 'aed', 2).map((p) => p.id)).toEqual(['a', 'b']);
    expect(najblizszeZ(idx, { lat: 52.23, lon: 21.0 }, 'apteka', 3).map((p) => p.id)).toEqual(['c']);
  });
  it('link do aplikacji PSP', () => {
    expect(linkPSP({ lat: 52.23, lon: 21.01 })).toBe('https://gdziesieukryc.pl/?lat=52.23&lng=21.01');
  });
  ```
  Uwaga: punkt `a` i `b` są w równej odległości od 52.2350 — jeśli test jest niestabilny, przesuń zapytanie na 52.2340.
- [ ] **Krok 2:** FAIL → **Krok 3: `najblizsze.ts`**
  ```ts
  import KDBush from 'kdbush';
  import { around } from 'geokdbush';
  import type { Punkt, RodzajPunktu, Wsp } from '../../contracts';

  export type Indeks = { idx: KDBush; punkty: Punkt[] };
  export function zbuduj(punkty: Punkt[]): Indeks {
    const idx = new KDBush(punkty.length);
    punkty.forEach((p) => idx.add(p.lon, p.lat));
    idx.finish();
    return { idx, punkty };
  }
  export function najblizszeZ(i: Indeks, w: Wsp, rodzaj: RodzajPunktu, n: number): Punkt[] {
    return around(i.idx, w.lon, w.lat, n, 20, (id: number) => i.punkty[id].rodzaj === rodzaj).map((id: number) => i.punkty[id]);
  }
  export const linkPSP = (w: Wsp) => `https://gdziesieukryc.pl/?lat=${w.lat}&lng=${w.lon}`;

  let indeks: Promise<Indeks> | null = null;
  export async function najblizsze(w: Wsp, rodzaj: RodzajPunktu, n: number): Promise<Punkt[]> {
    indeks ??= fetch('/pack/punkty/punkty.json').then((r) => r.json()).then(zbuduj);
    return najblizszeZ(await indeks, w, rodzaj, n);
  }
  ```
- [ ] **Krok 4:** PASS → **Krok 5: `Panel.tsx`**: zakładki z 6 rodzajami (Miejsca schronienia według PSP, Metro, AED, Apteka, SOR, Toaleta); lista 3 najbliższych od wybranego miejsca w `<ul data-testid="lista-punktow">`: nazwa, adres, odległość („350 m”), dostępność, źródło i data z manifestu; przy miejscach PSP przycisk „Otwórz w aplikacji PSP” (`linkPSP`). Pod listą: „Dane: PSP (gdziesieukryc.pl), stan na …”.
- [ ] **Krok 6: `warstwy.ts`** (`dodajWarstwy`): jedno źródło GeoJSON z `punkty.json`, warstwa `circle` z kolorem według `rodzaj`, klastrowanie (`cluster: true`, `clusterRadius: 40`) dla PSP; kliknięcie → popup z nazwą i źródłem. Funkcja zwraca sprzątanie (`removeLayer`, `removeSource`).
- [ ] **Krok 7: PR** `O3-A1: punkty pomocy`.

### O3-C1. Dobudowa punktów (po 19:00)

- [ ] Filtry: „tylko całodobowe” dla PSP i AED.
- [ ] Kierunek i odległość do punktu (strzałka azymutu i metry, działa offline); linia na mapie od wybranego miejsca do punktu.
- [ ] Parkingi wielopoziomowe (`get_m_parkingi_wolne_miejsca`) jako dodatkowe miejsca ukrycia, jeśli starczy czasu (oznaczone „nie jest miejscem schronienia PSP”).

---

## Pas O4: na żywo i prezentacja

### O4-B1. Proxy na żywo (15:00–17:00)

**Pliki:** `server/portal.ts`, `server/portal.test.ts`, `server/live/{pojazdy,wiatr}.ts`, `server/live/pojazdy.test.ts`, `server/live/index.ts`, `dane/probki/`.

**Interfejsy:** `GET /api/live/pojazdy` → `StanLive<Pojazd[]>`; `GET /api/live/wiatr` → `StanLive<Wiatr[]>`. Każdy `server/live/<nazwa>.ts` eksportuje `handler(req: Request, env: { WARSAW_API_TOKEN?: string }): Promise<Response>`.

- [ ] **Krok 1: test** `server/live/pojazdy.test.ts` (pierwsza linia pliku: `// @vitest-environment node`) — z zapisaną próbką (`dane/probki/ztm_pojazdy.json`, pola `Lines, Lat, Lon, Time, VehicleNumber, Brigade`): funkcja `mapujPojazdy(surowe, typ)` zwraca `Pojazd[]` i odrzuca pozycje starsze niż 5 minut od najnowszej w zbiorze (w próbce są pozycje sprzed doby).
- [ ] **Krok 2: `server/portal.ts`**
  ```ts
  export class BladPortalu extends Error {
    rodzaj: 'klucz_lub_usluga' | 'timeout' | 'schemat';
    constructor(rodzaj: BladPortalu['rodzaj'], msg: string) { super(msg); this.rodzaj = rodzaj; }
  }

  export async function portal(zbior: string, body: object, token: string | undefined): Promise<unknown> {
    if (!token) throw new BladPortalu('klucz_lub_usluga', 'brak WARSAW_API_TOKEN');
    let r: Response;
    try {
      r = await fetch(`https://dane.um.warszawa.pl/api/action/${zbior}`, {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
    } catch { throw new BladPortalu('timeout', zbior); }
    // portal zwraca 500 "Service unavailable" także przy złym kluczu
    if (!r.ok) throw new BladPortalu('klucz_lub_usluga', `${zbior}: HTTP ${r.status}`);
    const d = await r.json();
    if (!Array.isArray(d)) throw new BladPortalu('schemat', zbior);
    return d;
  }

  export function odpowiedz<T>(dane: T, zrodlo: string, maxAge = 20): Response {
    return Response.json({ dane, stanNa: new Date().toISOString(), zrodlo, zCache: false },
      { headers: { 'Cache-Control': `public, s-maxage=${maxAge}` } });
  }

  export function blad(e: unknown): Response {
    const rodzaj = e instanceof BladPortalu ? e.rodzaj : 'nieznany';
    console.error('portal', rodzaj); // bez klucza i bez treści zapytania
    return Response.json({ blad: rodzaj }, { status: 502 });
  }
  ```
- [ ] **Krok 3: `server/live/pojazdy.ts`**
  ```ts
  import type { Pojazd } from '../../src/contracts';
  import { portal, odpowiedz, blad } from '../portal';

  type Surowy = { Lines: string; Lat: number; Lon: number; Time: string };
  export function mapujPojazdy(s: Surowy[], typ: Pojazd['typ']): Pojazd[] {
    const czasy = s.map((x) => Date.parse(x.Time.replace(' ', 'T')));
    const naj = Math.max(...czasy);
    return s.filter((_, i) => naj - czasy[i] <= 5 * 60_000)
      .map((x) => ({ linia: x.Lines, typ, lat: x.Lat, lon: x.Lon, czas: x.Time }));
  }

  export async function handler(_req: Request, env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
    try {
      const [a, t] = await Promise.all([
        portal('get_ztm_lokalizacja_pojazdow', { type: 1 }, env.WARSAW_API_TOKEN),
        portal('get_ztm_lokalizacja_pojazdow', { type: 2 }, env.WARSAW_API_TOKEN),
      ]);
      return odpowiedz([...mapujPojazdy(a as Surowy[], 'autobus'), ...mapujPojazdy(t as Surowy[], 'tramwaj')], 'ZTM przez dane.um.warszawa.pl', 15);
    } catch (e) { return blad(e); }
  }
  ```
- [ ] **Krok 4: `server/live/wiatr.ts`** — `get_zom_pogoda` (pola: `lokalizacja, lat, lon, czas, pred_wiatru, kier_wiatru`) → `Wiatr[]` (`kierunekDeg` = `kier_wiatru`, kierunek, Z KTÓREGO wieje), `s-maxage=300`. Test na próbce.
- [ ] **Krok 5: rejestracja** w `server/live/index.ts` (plik istnieje od szkieletu; Worker i `vite dev` czytają ten sam rejestr):
  ```ts
  import { handler as pojazdy } from './pojazdy';
  import { handler as wiatr } from './wiatr';

  export const handlery: Record<string, Handler> = { pojazdy, wiatr };
  ```
  Każdy nowy handler (O4-C1) dopisujesz do `handlery`.
- [ ] **Krok 6: sprawdzenie** `npm run dev` → `curl -s localhost:5173/api/live/pojazdy | head -c 300` → JSON z `dane` i `stanNa`. Na podglądzie Cloudflare to samo pod `/api/live/pojazdy`.
- [ ] **Krok 7: PR** `O4-B1: proxy na żywo`.

### O4-A1. Moduł `live` (17:00–19:00)

**Pliki:** `src/modules/live/{index.tsx,Panel.tsx,warstwy.ts,okolica.ts,okolica.test.ts}`.

**Interfejsy:** używa `fetchLive<T>(nazwa)` (O1-A1), `useSiec()`. Produkuje `modul` z `nazwa: 'Na żywo'`.

- [ ] **Krok 1: test** `okolica.test.ts`: `wOkolicy(pojazdy, wsp, 1000)` zwraca tylko pojazdy do 1 km; `podsumuj(pojazdy)` zwraca `{ autobusy: number, tramwaje: number, linie: string[] }`; `najblizszaStacja(wiatr, wsp)` zwraca najbliższą stację.
- [ ] **Krok 2:** FAIL → implementacja (haversine) → PASS.
- [ ] **Krok 3: `Panel.tsx`**: odświeżanie co 20 s, gdy `online`; sekcja „Co jeździ w Twojej okolicy (1 km)”: liczba autobusów i tramwajów, linie; gdy tramwajów 0, a w danych całego miasta tramwaje są: „W Twojej okolicy nie jeżdżą teraz tramwaje.”; sekcja „Wiatr”: strzałka obrócona o `kierunekDeg + 180` (dokąd wieje), prędkość, stacja; zawsze „Stan na HH:MM”, a przy `zCache`: „Brak sieci. Ostatni stan z HH:MM.” Gdy `fetchLive` zwraca `null`: „Brak sieci i brak zapisanego stanu. Połącz się, żeby zobaczyć dane na żywo.”
- [ ] **Krok 4: `warstwy.ts`**: pojazdy w okolicy jako kropki (autobus niebieski, tramwaj czerwony) z numerem linii.
- [ ] **Krok 5: PR** `O4-A1: na żywo`.

### O4-C1. Dobudowa na żywo (po 19:00, w kolejności)

- [ ] **Dym:** przycisk „Widzę dym — tutaj” (punkt wybierany kliknięciem na mapie, zostaje tylko w telefonie) → na mapie stożek 30° w kierunku, w którym wieje wiatr z najbliższej stacji, długość 3 km; obok pomiary PM2.5/PM10 najbliższej stacji (`server/live/powietrze.ts`, `get_bopipk_monitoring_jakosci_powietrza`; pola `address`, `data[].param_code/value/time`, współrzędne stacji ustal z próbki; jeśli ich brak — dopasuj adres stacji do punktów adresowych). Tekst: „To kierunek wiatru, nie model rozprzestrzeniania się dymu.”
- [ ] **Veturilo:** `server/live/rowery.ts` z `https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_vw/gbfs.json` (`station_information` + `station_status`, bez klucza) → stacje w okolicy z liczbą wolnych rowerów.
- [ ] **Utrudnienia:** `server/live/utrudnienia.ts` z `get_bin_utrudnienia_drogowe` (pola `content[]`, geometria — ustal z próbki) → warstwa linii na mapie i lista w panelu.

### O4-P. Prezentacja i dokumentacja (pas równoległy przez cały czas)

**Pliki:** `docs/pitch/` (scenariusz, zrzuty, pytania), `docs/DOKUMENTACJA.md`, `docs/pitch/prezentacja.pptx`. Skill: `document-skills:pptx`.

- [ ] **P1 (15:00–16:00): szkielet.** `docs/pitch/scenariusz.md`: 5 minut, minuta po minucie — Kijów (0:00–0:45) → Kasia i trzy pytania (0:45–1:30) → demo: live, potem wyłączenie Wi-Fi (1:30–3:00) → syreny: 92,5% → 69,1%, dzielnice (3:00–3:45) → dane miasta i PSP (3:45–4:20) → wdrożenie i następne kroki (4:20–5:00). Treści z HANDOFF.md §9.
- [ ] **P2 (16:00): szkielet dokumentacji** `docs/DOKUMENTACJA.md`: wykorzystane dane miejskie (lista zbiorów z SPEC.md §6), założenia i ograniczenia (SPEC.md §7 i HANDOFF.md §5), frameworki i narzędzia, użycie AI (odnośnik do `docs/AI_USAGE.md` + opis: Claude Code u 4 osób, do czego), atrybucje.
- [ ] **P3 (przy każdym scaleniu): zrzuty.** Autor PR wrzuca do `docs/pitch/zrzuty/` jeden zrzut ekranu i jedno zdanie do `docs/pitch/zrzuty.md`.
- [ ] **P4 (21:00): przejście narracji** na działającej stronie z zespołem; poprawki scenariusza.
- [ ] **P5 (do 24:00): prezentacja v1 `.pptx`** z prawdziwymi zrzutami; ostatni slajd: link do pełnej wersji, link `?offline=1`, link do repo. `docs/pitch/pytania.md`: 8 pytań jury z odpowiedziami (licencje i zgoda PSP, założenie o syrenach analogowych, kto i jak wdroży, koszt utrzymania, dlaczego nie gdziesieukryc.pl, dokładność modelu, prywatność adresów, co z ludźmi bez smartfona → karta do wydruku).
- [ ] **P6 (7:00–9:00): wersja końcowa** prezentacji i dokumentacji, nagranie wideo demo (zapas na brak sieci), README z linkami.
- [ ] **P7 (9:00–10:00): dwie próby** z pomiarem czasu i ćwiczeniem pytań.

---

## F. Oddanie (lider, 9:00–11:00)

- [ ] 9:00 zamrożenie: od teraz tylko PR z etykietą „krytyczny” po akceptacji lidera.
- [ ] Czysta instalacja na świeżym klonie: `npm ci && npm run typecheck && npm test && npm run build && uv run --project pipeline pipeline/validate.py && npm run test:e2e`. Zapisz wyniki w `docs/DOKUMENTACJA.md`.
- [ ] Sprawdź oba linki z prezentacji w oknie incognito; `?offline=1` po pobraniu paczki.
- [ ] Skan sekretów: `git log -p | grep -E "WARSAW_API_TOKEN=.+|Authorization: [A-Za-z0-9]{20,}"` → pusty wynik.
- [ ] Oddanie przez kanał organizatora: prezentacja, link do repo, dokumentacja. Potwierdzenie oddania zapisz w `docs/DOKUMENTACJA.md`.
- [ ] Po 11:00 żadnych zmian w repo (regulamin §5A ust. 6).
