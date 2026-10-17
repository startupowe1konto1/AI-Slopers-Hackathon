# Architektura i API — Zanim zgłosisz

## Granice modułów

`importer → normalizer → repository → search → comparison → UI`.

Generator językowy jest opcjonalnym dodatkiem do `comparison`. Nie kontroluje repozytorium, filtrów, kosztów ani linków. Import nie jest wykonywany na każde zapytanie mieszkańca.

Repozytorium udostępnia `searchText`, `getByIds`, `getCoverage`, opcjonalnie `searchVectors`. Implementacja P0 może wczytać oczyszczony JSON raz na start. Dane tylko do odczytu. Stan formularza i wyboru porównań pozostaje w przeglądarce; nie wymaga kont.

## Endpointy projektowane

| Endpoint | Wejście | Wynik |
|---|---|---|
| `GET /api/coverage` | Brak | Snapshot, zakres, braki, tryb |
| `POST /api/search` | query, location?, filters? | searchId, wyniki, źródła, diagnostyka |
| `GET /api/projects/:id` | Wewnętrzny identyfikator | Oczyszczone dane i dowody |
| `POST /api/compare` | idea, projectIds, location? | Porównanie, luki, pytania |

To nasze API, nie miejskie. Nie dodawaj publicznego `import` ani endpointu wykonującego dowolny URL.

## Kontrakt wyszukiwania

Wejście: tekst 30–1500 znaków, locale `pl`, opcjonalna lokalizacja WGS84 oraz jawnie dostępne filtry. Maksymalna liczba wyników 5. Współrzędne i typy walidowane. `filters` tylko z whitelisty; SQL/FTS zbudowane bez interpretowania poleceń użytkownika.

Wynik:

```text
searchId, snapshotId, searchMode: lexical | hybrid
coverage: {editionLabels, recordCount, fetchedAt}
results[]:
  projectId, title, editionLabel, statusLabel
  relation: nearby | elsewhere | location_unknown
  distanceMeters: number | null
  reasons[]: {kind, text, evidenceIds[]}
  sourceUrl, evidence[]
warnings[]
```

Nie pokazuj surowego score jako procentu prawdopodobieństwa. `searchId` może być nieprzechowywanym identyfikatorem żądania; nie twórz historii bez potrzeby.

## Kontrakt porównania

Do 3 identyfikatorów. Serwer ponownie odczytuje projekty ze swojego repozytorium; nie ufa danym projektu przesłanym przez klienta. Wynik zawiera wiersze pól, różnice, maksymalnie 3 pytania oraz sekcję „do sprawdzenia”. Każda obserwacja opisująca miejski projekt wskazuje evidenceIds. Brakujące pole to `unknown`, nie tekst wygenerowany przez model.

Karta robocza składa się deterministycznie z: tekstu użytkownika, wybranych źródeł, potwierdzonych podobieństw, pytań. Zwykłe kopiowanie tekstu to P0; pobieranie MD jest P1. Nie pobieraj aplikacyjnie cudzych URL źródłowych do eksportu.

## Błędy

- 400: niepoprawne wejście, komunikat przy polu.
- 404: brak projektu w aktywnym snapshocie.
- 409: wybrane rekordy należą do nieaktywnej wersji danych; odśwież wybór.
- 429: limit żądań AI; nadal dostępne porównanie pól.
- 503: brak aktywnego zbioru; nie pokazuj pustki jako braku realizacji.
- Timeout AI: status 200 z `explanationMode=template` i jawnym komunikatem o uproszczonym porównaniu.

## Wydajność i koszt

Cele do zmierzenia na laptopie zespołu: wyszukiwanie bez AI do 1 sekundy po rozgrzaniu, pokazanie pierwszych wyników niezależnie od dalszego wyjaśnienia. Nie obiecuj tego bez pomiaru. Embeddingi rekordów licz raz dla wersji tekstu i modelu, nie przy każdym wyszukiwaniu. Maksymalnie jeden krok generowania wyjaśnienia na wybrane porównanie. Timeout i limit wywołań według wspólnego dokumentu.

Klucz cache obejmuje snapshot, wersję algorytmu i znormalizowane parametry. Pomysły użytkownika nie trafiają do trwałego cache na serwerze w P0. Nie umieszczaj pełnego tekstu pomysłu w URL ani w logach.

## Mapa i lokalizacja

Mapa jest adapterem UI, nie zależnością wyszukiwania. Lista pozostaje użyteczna bez podkładu. Odległość do najbliższego punktu projektu jest odległością geometryczną w linii prostej. Nie jest odległością pieszą ani dowodem nakładania obszaru oddziaływania. Projekt ogólnomiejski nie dostaje mylącej odległości do przypadkowego punktu.
