# Zasady repo (czytaj przed każdą zmianą)

- Specyfikacja: `docs/SPEC.md`. Plan i zadania: `docs/PLAN.md`. Pracujesz nad jednym zadaniem z PLAN.md (np. `O3-A1`).
- Iteracja v3 (ekran „Twoja sytuacja”, od 17.10 wieczorem): `HANDOFF-v3.md` i zadania w `docs/PLAN-v3.md` (np. `V1`, `S2`, `P3`, `L1`). Gdzie różni się od PLAN.md, wygrywa PLAN-v3.
- Piszesz tylko w folderach swojej osoby (SPEC.md §9). Inny plik: osobny, mały PR z tytułem `[kontrakt] ...`, przegląda O1.
- Typy wspólne tylko z `src/contracts.ts`. Nie dodawaj zależności npm bez PR `[kontrakt]`.
- Moduł UI = folder `src/modules/<moduł>/` z `index.tsx` eksportującym `modul: Modul`. Nie edytuj `src/modules/index.ts`.
- Dane offline: skrypty w `pipeline/<moduł>/` (Python, `uv run --project pipeline ...`), wynik w `public/pack/<moduł>/` + `meta.json`. Na końcu `uv run --project pipeline python pipeline/build_manifest.py`.
- Na żywo: handler `server/live/<nazwa>.ts` eksportuje `handler(req: Request, env: Env): Promise<Response>` i jest dopisany do rejestru `server/live/index.ts`. Działa pod `/api/live/<nazwa>` w `npm run dev` i na Cloudflare (Worker `worker/index.ts`).
- Klucz API tylko w `.env` jako `WARSAW_API_TOKEN`. Nigdy w `src/`, logach, testach, commitach ani w czacie.
- API miasta: `POST https://dane.um.warszawa.pl/api/action/get_<zbiór>`, nagłówek `Authorization: <klucz>`, body JSON. Zły klucz daje 500 „Service unavailable”, nie 401.
- Dokumentacja pól API: `kontekst/dokumentacja-api/*_pa.json` i `*_pw.json` (czytaj jako `utf-8-sig`). Parser pisz na podstawie zapisanej próbki w `dane/probki/`, nie z pamięci.
- WFS miasta: `https://wfs.um.warszawa.pl/serwis?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=wfs:<WARSTWA>`, namespace `http://fdo.osgeo.org/schemas/feature/wfs`, `gml:pos` = „lon lat”. Bywa niestabilny: ponawiaj, zapisuj kopię, aplikacja nigdy nie pyta WFS na żywo.
- TypeScript ma `erasableSyntaxOnly`: bez `enum`, `namespace` i właściwości w parametrach konstruktora.
- Teksty: „miejsca schronienia według PSP”, nigdy „schrony”. Nie ogłaszamy alarmów. Nie pokazujemy miejsc uderzeń. Przy wyniku syren dopisek o modelu na zewnątrz i o założeniu blackoutu.
- Każdy panel ma stany: ładowanie, brak sieci, brak danych, błąd źródła. Nigdy pusty ekran.
- Test ścieżki Kasi: `npm run test:e2e` (Playwright, wersja produkcyjna + tryb offline; na macOS używa zainstalowanego Chrome). Testy modułów same się włączają, gdy moduł nie jest już atrapą. Umówione `data-testid`: `wynik-syreny`, `lista-punktow`.
- TDD: test → czerwony → kod → zielony. Przed PR: `git fetch && git rebase origin/main && npm run typecheck && npm test && npm run build`.
- Najmniejsza zmiana, która spełnia „Gotowe, gdy” z zadania. Bez kodu na zapas.
