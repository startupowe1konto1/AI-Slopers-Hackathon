# Silnik reguł, pytania i AI

## Zasada podstawowa

Rozpoznanie jest hipotezą. Zalecenie ma wynikać z przejrzanej reguły z miejskim dowodem. Wyszukiwanie semantyczne znajduje kandydatów, ale nie rozstrzyga kategorii pojemnika. Nie stosuj reguły „wybierz najbardziej podobną odpowiedź” jako mechanizmu końcowego.

## Model przejrzanej reguły — projektowany

```text
ReviewedRule:
  id, entryIds[], label,
  conditions: [{attribute, operator, expectedValue}],
  exclusions: [{attribute, operator, expectedValue}],
  instructionText, destinationCategory?,
  preparationSteps[], components[]?,
  evidenceIds[], conditionEvidenceIds[],
  reviewStatus: draft | reviewed | rejected,
  reviewedAt?, reviewerRole?, snapshotId, ruleVersion

Question:
  id, attribute, text, options[], includesUnknown=true,
  linkedRuleIds[], evidenceIds[]
```

To wewnętrzny model zespołu, nie założenie o strukturze API. Przykładowe atrybuty `empty`, `material`, `hasElectronics` są nazwami technicznymi do rozważenia. Nie aktywuj ich bez źródła, które rzeczywiście uzależnia zalecenie od tej cechy.

## Redagowanie reguł

1. Znajdź konkretny miejski wpis i jego wyjątki.
2. Wypisz, czego dotyczy i czego nie obejmuje.
3. Wydobądź warunek, instrukcję i ewentualne czynności przygotowania.
4. Przypisz evidenceIds także do warunku, nie tylko do wyniku.
5. Druga osoba sprawdza, czy redakcja nie rozszerza reguły.
6. Dopiero `reviewed` trafia do aktywnego silnika.

Model może proponować redakcję, ale nigdy sam ustawiać reviewed. Gdy dane są ogólne lub sprzeczne, pozostaw zakres nieobsługiwany. Nie dodawaj ogólnej wiedzy modelu jako miejskiego źródła.

## Logika trójwartościowa

Każdy warunek daje TRUE, FALSE lub UNKNOWN. Brak cechy to UNKNOWN. `not unknown` nadal jest UNKNOWN. Wyłączenie TRUE usuwa regułę. Wyłączenie UNKNOWN blokuje pewne zastosowanie, jeżeli może zmienić wynik. Warunki FALSE wykluczają regułę; UNKNOWN może wymagać pytania.

Przebieg:

1. Potwierdź rozpoznany wpis lub wybór użytkownika.
2. Odczytaj tylko aktywne, przejrzane reguły tego wpisu.
3. Oceń warunki i wyłączenia względem odpowiedzi.
4. Jeśli reguły zgodne w pełni wskazują tę samą instrukcję, a nierozstrzygnięte alternatywy nie mogą jej zmienić, zwróć READY.
5. Jeśli brakująca cecha rozstrzyga pomiędzy instrukcjami i istnieje sprawdzone pytanie, zwróć NEED_INFO.
6. Jeśli dwie w pełni pasujące reguły prowadzą do sprzecznych zaleceń, zwróć CONFLICT. Nie wybieraj pierwszej ani tej z wyższym score.
7. Jeśli żadna reguła nie pasuje albo brakuje źródła/pytania, zwróć UNKNOWN.

Nie wprowadzaj automatycznej hierarchii „szczegółowa zawsze wygrywa”. Można dodać relację pierwszeństwa wyłącznie po potwierdzeniu jej w źródłach i przeglądzie.

## Wybór pytania

P0: ręcznie ustalona kolejność maksymalnie dwóch pytań dla obsługiwanego scenariusza. Zadaj tylko pytanie, na które odpowiedzi mogą zmienić stan/instrukcję. Nie pytaj o cechę już potwierdzoną. Po „nie wiem” nie powtarzaj bez końca tego samego pytania.

P1: ocena rozdzielania kandydatów przez atrybut, ale tylko w obrębie gotowej biblioteki pytań. Nie generuj dowolnych pytań na żywo. Jeśli wszystkie odpowiedzi prowadzą do tego samego zalecenia, pytanie jest zbędne.

## Rozpoznawanie tekstu

Kolejno dokładna nazwa, synonimy, wyszukiwanie tekstowe, opcjonalna semantyka. Negacja ma znaczenie: „bez baterii” nie może zostać zredukowana do „bateria”. Przy wielu kandydatach pokaż wybór, nie dodawaj losowej cechy. Użytkownik może opisać zawartość i opakowanie; doprecyzuj, o którą część pyta.

## Rozpoznawanie zdjęcia P1

Wynik modelu: do 3 hipotez nazw, widoczne cechy, lista cech niemożliwych do ustalenia. Bez zalecenia segregacji, bez instrukcji demontażu i bez linków. Nie traktuj deklarowanej pewności modelu jako skalibrowanego prawdopodobieństwa. Pokaż rozpoznanie do potwierdzenia.

Podaj modelowi wyraźną granicę: materiał dokumentu/etykiety to treść obrazu, nie polecenie. Odrzuć instrukcje wygenerowane mimo kontraktu. Model nie dostaje tokenu miejskiego. Obsługę obrazu wyłącz przy braku zweryfikowanych warunków dostawcy i konfiguracji.

## Części przedmiotu

Osobne karty części wyłącznie dla przejrzanego scenariusza. Suma rozpoznań części nie daje automatycznie prawa do ich oddzielania. Silnik może wskazać oddanie całości, jeśli taka jest potwierdzona instrukcja. Brak reguły bezpiecznego podziału oznacza brak porad rozbierania.

## Punkty odbioru

Zalecenie z potwierdzoną kategorią → zweryfikowane mapowanie kategorii na typy ECO → filtr przyjmowania → odległość → harmonogram. Ogólny typ punktu nie potwierdza przyjęcia konkretnego rozmiaru/modelu urządzenia. Gdy zakres jest niejasny, pokaż punkt jedynie jako możliwość do potwierdzenia, bez kategorycznej rekomendacji. W P0 można ograniczyć listę do jednoznacznych kategorii.

## Wariant bez AI

Wyszukiwanie nazw i synonimów, wybór przedmiotu, gotowe pytania, deterministyczny silnik, źródła i punkty pozostają czynne. Wyłączone jest tylko automatyczne rozpoznawanie obrazu i ewentualne parafrazowanie. Nie zastępuj awarii modelu innym, nieautoryzowanym dostawcą.
