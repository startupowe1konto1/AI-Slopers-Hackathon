# Stos, środowisko, dostarczanie i odporność

## Domyślna decyzja

Osobna aplikacja Next.js z TypeScript, App Router i serwerowymi Route Handlers. Jeden proces aplikacyjny, lokalny katalog danych, walidacja Zod, testy logiki Vitest oraz kilka testów Playwright. Nie dodawaj mikroserwisów, kont użytkowników, systemu kolejek ani osobnej bazy wektorowej.

To propozycja dla pustego repozytorium. Jeżeli zespół ma działający, dopuszczony stos, utrzymaj go i przenieś kontrakty domenowe. Brak znajomości Next.js jest wystarczającym powodem wyboru znanego frameworka.

Warstwa danych: na P0 pliki JSON plus indeks w pamięci. SQLite i FTS5 dodaj, gdy wielkość lub czas przeszukiwania to uzasadnią. Backend repozytorium ukrywa format przechowywania, więc zmiana nie dotyka UX. Chroni to przed utknięciem na natywnym sterowniku SQLite na Windows. Jeśli wybierasz SQLite, sprawdź dostępność FTS5 i kompatybilność sterownika z zainstalowanym Node.

## Struktura przyszłego repozytorium

```text
app/                         # kod aplikacji w katalogu projektu planistycznego
  src/app/                   # strony i endpointy
  src/components/            # widoki
  src/domain/                # logika bez zależności od UI i dostawcy AI
  src/server/data/           # import, repozytorium, manifesty
  src/server/ai/             # adapter opcjonalnego dostawcy
  scripts/                   # import, indeksowanie, raport danych
  tests/unit/
  tests/integration/
  tests/e2e/
  data/raw/                  # niepubliczna kopia odpowiedzi
  data/normalized/           # dane do repozytorium domenowego
  data/manifests/
  work/                      # dzienniki pracy, lokalne raporty
  docs/                      # dokumentacja oddawana
```

Surowe odpowiedzi nie trafiają automatycznie do Git. Najpierw sprawdź zawartość i warunki publikacji. Oczyszczona kopia demonstracyjna może być dołączona tylko z prawidłowym pochodzeniem i licencją.

## Środowisko

Przygotuj `.env.example` z pustymi wartościami:

| Zmienna projektowana | Znaczenie |
|---|---|
| `WARSAW_API_TOKEN` | Token przechowywany wyłącznie na serwerze |
| `DATA_MODE` | `snapshot` lub `live`; demo używa `snapshot` |
| `DATA_DIR` | Katalog danych poza publicznymi zasobami |
| `AI_ENABLED` | Domyślnie `false`, dopóki adapter nie jest skonfigurowany |
| `AI_PROVIDER` | Jawnie wybrany dostawca albo `none` |
| `AI_API_KEY` | Sekret opcjonalnej usługi |
| `AI_TEXT_MODEL` | Model tekstowy wybrany przy realizacji |
| `AI_VISION_MODEL` | Opcjonalny model rozpoznania obrazu |
| `AI_TIMEOUT_MS` | Ograniczenie oczekiwania; propozycja 8000 |
| `AI_MAX_CALLS_PER_SESSION` | Limit wywołań; propozycja 5 |
| `UPLOAD_MAX_BYTES` | Dla zdjęć propozycja 5 MiB |

Nie dodawaj sekretów do zmiennych `NEXT_PUBLIC_*`, logów, zrzutów ekranu ani komunikatów błędów. Klucz Claude Code nie jest automatycznie kluczem dostawcy dla aplikacji. Nie zakładaj, że subskrypcja narzędzia daje backendowi dostęp do modelu. Brak klucza wstrzymuje tylko funkcje AI.

## Planowane polecenia repozytorium

Claude ma je dopiero zaimplementować i opisać. Nie są obecnie działającymi poleceniami tego pakietu:

- `npm run dev` — praca lokalna.
- `npm run build` i `npm start` — uruchomienie wersji produkcyjnej.
- `npm run typecheck`, `npm run lint` — kontrola statyczna.
- `npm test` — testy logiki i integracji.
- `npm run test:e2e` — krytyczne przepływy.
- `npm run data:inspect` — bezpieczny raport danych.
- `npm run data:import` — import z jawnym zakresem i potwierdzonym endpointem.
- `npm run data:validate` — walidacja wersji danych i manifestu.

Nie umieszczaj tokenu w argumencie linii poleceń. Importer czyta środowisko i nigdy go nie wypisuje. Użyj jednego menedżera pakietów i lockfile. Najpierw odczytaj środowisko i istniejące skrypty.

## Import i manifest

Każdy import zapisuje manifest: identyfikator zbioru, URL dokumentacji, endpoint, niejawne nagłówki pominięte, jawne filtry, czas UTC, skrót pliku, liczbę rekordów, liczbę zaakceptowanych/odrzuconych, wersję normalizatora, rozpoznane warunki licencyjne. `fetchedAt` oznacza pobranie, nie datę aktualizacji każdego rekordu.

Zapis do pliku tymczasowego, walidacja, potem atomowa zamiana aktywnej wersji. Nie zastępuj dobrego snapshotu pustą lub błędną odpowiedzią. W raporcie rozdziel: brak danych, błąd autoryzacji, niedostępność usługi i błąd schematu. Ogranicz ponowienia i czas importu; bez nieskończonych pętli i zgadywania paginacji.

## Sposób dostarczenia

P0: lokalne demo na laptopie, produkcyjny build, sprawdzone uruchomienie po restarcie. Wewnętrzne linki źródłowe mogą wymagać internetu; przeglądanie zaimportowanych danych i logika P0 nie powinny.

Publiczny hosting jest P1 i wymaga istniejącego konta oraz zgodnego środowiska. Lokalny SQLite i zapisywanie plików wymagają trwałego dysku; nie zakładaj trwałości systemu plików platform serverless. Dla wersji tylko do odczytu można użyć zgodnie przygotowanego snapshotu i indeksu w pamięci. Przy publikacji usuń endpoint importu lub zabezpiecz go po stronie serwera. Nie twórz otwartego proxy do usług płatnych.

Nie obiecuj pełnego offline: zdjęcia z modelem chmurowym, zewnętrzne mapy i źródła wymagają sieci. Na demo wybierz listę/lokalne dane, a mapę dodaj później. Jeżeli używasz mapy, sprawdź warunki dostawcy podkładu i pokaż atrybucję; nie pobieraj masowo kafelków na zapas.

## Minimalna ochrona

Walidacja wejścia, ograniczenie długości, parametryzowane zapytania, kodowanie HTML. FTS ma własną składnię: parametr SQL nie wystarcza do bezpiecznego potraktowania tekstu jako zwykłego zapytania; tokenizuj/escapuj także składnię FTS. Linki źródłowe tylko o potwierdzonym pochodzeniu i protokole HTTP(S). Bez pobierania dowolnych URL użytkownika. Wyłącz logowanie treści pomysłów, zdjęć i lokalizacji. Nie wprowadzaj uwierzytelniania, jeśli nie zapisujesz kont ani historii.

## Przed oddaniem

Uruchom na czysto instalację z lockfile, walidację danych, testy, build i start produkcyjny. Sprawdź aplikację z wyłączonym AI i niedostępnym API miejskim. Zapisz faktyczne wyniki i pozostałe ograniczenia. Nie deklaruj zgodności produkcyjnej ani audytu bezpieczeństwa na podstawie tych kilku kontroli.
