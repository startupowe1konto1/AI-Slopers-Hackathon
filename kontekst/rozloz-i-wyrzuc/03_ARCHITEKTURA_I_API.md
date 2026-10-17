# Architektura i API — Rozłóż i wyrzuć

## Granice

Import → normalizacja → przegląd reguł → repozytorium. W czasie żądania: rozpoznanie → wybór kandydatów → silnik warunków → pytanie albo wynik → opcjonalne punkty. Generacja nie ma prawa samodzielnie wskazywać frakcji lub przyjęcia odpadu.

Stan sesji w pamięci przeglądarki, bez bazy historii. Serwer przy każdym kroku ponownie waliduje odpowiedzi, kandydatów i aktywny snapshot. Nie ufa zaleceniu przesłanemu przez klienta. Maksymalnie jeden przedmiot w P0.

## Endpointy własnej aplikacji — projektowane

| Endpoint | Wejście | Wyjście |
|---|---|---|
| `GET /api/coverage` | Brak | Zakres danych i obsługiwanych scenariuszy |
| `POST /api/recognize` | Tekst do 1000 znaków | Do 3 hipotez z kandydatami, bez zalecenia |
| `POST /api/evaluate` | entryId, answers, snapshotId | NEED_CONFIRMATION / NEED_INFO / READY / UNKNOWN / CONFLICT |
| `POST /api/points` | Zweryfikowany decisionId i lokalizacja opcjonalna | Zgodne punkty lub brak wyniku |
| `POST /api/recognize-image` | P1: plik JPEG/PNG/WebP | Hipotezy rozpoznania, nigdy zalecenie |

Nie przyjmuj od klienta dowolnej kategorii jako zaufanej decyzji. `decisionId` może być krótko żyjącym odwołaniem lub podpisanym minimalnym stanem bez prywatnych treści. Prostszy wariant: `/points` dostaje entryId i answers i ponownie oblicza decyzję na serwerze. Wybierz jedną implementację i opisz ją.

## Kontrakt oceny

```text
snapshotId, status, recognizedLabel,
question?: {id, text, options[], reasonEvidenceIds[]},
decision?: {
  ruleId, instructionText, preparationSteps[],
  components[]?, destinationCategory?, evidenceIds[]
},
unknownReasons[], limitations[]
```

Pytanie ma stabilne ID i dozwolone odpowiedzi, w tym unknown. `preparationSteps` wyłącznie z przejrzanej reguły. `components` tylko dla obsługiwanego scenariusza. Wynik bez dowodu nie dostaje READY.

## Interfejsy modułów

`recognizer.propose(text|image)` zwraca hipotezy. `catalog.findCandidates` szuka w źródłach. `ruleEngine.evaluate(entryId, answers)` jest czystą funkcją. `pointRepository.findAccepted(category)` filtruje zgodność. `distanceService.sort` działa dopiero na przefiltrowanych punktach. Adapter modelu można usunąć bez zmiany silnika reguł.

## Obsługa błędów

400 niepoprawna odpowiedź/tekst; 413 plik za duży; 415 nieobsługiwany obraz; 409 nieaktualny snapshot; 429 limit modelu; 503 brak danych. Błąd rozpoznawania zdjęcia prowadzi do wpisania nazwy. Brak punktów to stan domenowy, nie crash. Nie zwracaj stacktrace ani kluczy.

## Zdjęcia P1

Przed wysłaniem do modelu pokaż, że obraz opuszcza urządzenie i jaki dostawca jest używany. Preferuj rzeczy bez twarzy i dokumentów. Sprawdź MIME i rzeczywisty format, rozmiar oraz liczbę pikseli; nie ufaj rozszerzeniu. Limit propozycji: 5 MiB, 20 megapikseli wejścia, zmniejszenie do potrzeb modelu. Usuwaj metadane obrazu. Wczytuj tylko plik użytkownika, nie dowolny URL. Nie zapisuj do publicznego katalogu i nie loguj base64.

Przetwarzanie w pamięci; jeśli biblioteka wymaga pliku tymczasowego, usuń go w `finally` także po błędzie. Nie deklaruj polityki retencji dostawcy, dopóki nie sprawdzono jego warunków. Brak tej konfiguracji oznacza wyłączenie obrazu, nie ukryte wysyłanie.

## Czas i tryb bez sieci

Wariant tekstowy na snapshocie działa bez zewnętrznego modelu. Model ma timeout i nie blokuje reszty aplikacji. Przy awarii sieci mapę zastępuje lista adresów. Aplikacja nie jest pełnym offline PWA w P0. Nie dodawaj service workera tylko dla efektu prezentacyjnego.

## Publiczne demo

Przy hostingu limituj liczbę żądań oraz wielkość uploadów i wyłącz kosztowne funkcje bez kontroli. Brak logowania nie oznacza otwartego endpointu do nieograniczonych wywołań AI. Wersja lokalna jest wystarczającym planem P0; szczegóły uruchomienia w dokumencie wspólnym.
