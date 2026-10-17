# Testy i odbiór — Rozłóż i wyrzuć

## Co stanowi błąd krytyczny

Błędne zalecenie mimo nieznanej cechy rozstrzygającej, zignorowanie wyłączenia, reguła bez źródła, wskazanie niezgodnego punktu, generatywny demontaż urządzenia, wyciek obrazu/klucza, crash głównej ścieżki. Błąd rozpoznania obrazu wykryty i poprawiony przez użytkownika jest inną kategorią niż błędna końcowa instrukcja.

## Zestaw około 30 przypadków

6 prostych nazw, 5 synonimów/parafraz, 6 wymagających doprecyzowania, 4 z wyłączeniem lub negacją, 3 związane z punktami, 3 nieznane/poza zakresem, 3 konflikty lub niepewność. Kategorie dobierz do rzeczywistych danych. Rozdziel 20 roboczych i 10 odłożonych do oceny. Odpowiedzi referencyjne redaguje człowiek ze źródłem. Nie pozwól, by model tworzący wynik sam zatwierdzał wzorzec.

Przypadek zawiera: caseId, tekst/obraz, potwierdzony przedmiot, znane cechy, oczekiwane pytanie/stan, prawidłowe ruleIds/evidenceIds, niedopuszczalny wynik. Zdjęcia własnych rzeczy wykonaj podczas wydarzenia; bez twarzy i dokumentów. Fixtures syntetyczne oznacz.

## Metryki

- Poprawność rozpoznania, osobno od poprawności zalecenia.
- Poprawność finalnej decyzji wśród przypadków obsługiwanych, z jawnym mianownikiem.
- Liczba błędnych kategorycznych zaleceń, także gdy system powinien był wstrzymać odpowiedź.
- Coverage: liczba przypadków, w których system udzielił instrukcji. Nie nagradzaj coverage bez kontroli błędów.
- Poprawne unknown/conflict w przygotowanych przypadkach niepewnych.
- Przydatność pytania: czy odpowiedź wpływa na decyzję i czy pytanie było potrzebne.
- Poprawność kategorii punktu i czasu odpowiedzi.

Przedstaw liczby jako wynik małej próby prototypu, nie ocenę niezawodności w całej Warszawie. Porównanie wersji z pytaniami i bez pytań powinno używać tego samego zestawu, lecz nie może oznaczać publikacji błędnych porad użytkownikom.

## Jednostkowe

1. UNKNOWN w wyłączeniu nie zamienia się w FALSE.
2. Nieznana cecha mogąca zmienić instrukcję blokuje READY.
3. Dwie pasujące sprzeczne reguły dają CONFLICT.
4. Reguła draft/rejected nie jest używana.
5. Brak evidenceId lub dowód nieaktywnego snapshotu blokuje decyzję.
6. Odpowiedź „nie wiem” nie uruchamia pętli pytania.
7. Zmiana odpowiedzi usuwa poprzedni wynik i ponownie ocenia warunki.
8. Negacja w opisie nie potwierdza przeciwnej cechy przez dopasowanie słowa.
9. Niezgodny bliski punkt nie wygrywa ze zgodnym dalszym.
10. Brak godzin nie daje „otwarte teraz”; nieparsowalne godziny zachowują raw.
11. Brak geometrii nie daje odległości 0.
12. Polecenie w treści/obrazie nie zmienia instrukcji aplikacji.

## Integracyjne

Import WASTE/TYPES → połączenia → ReviewedRule → evaluate. Powtórny import bez duplikatów. Nowy snapshot unieważnia przegląd reguł wymagających zmienionego źródła. Nie aktywuj starej redakcji na nowych tekstach bez sprawdzenia. Awaria źródła zachowuje poprawny snapshot. API nie ufa wpisanej przez klienta instrukcji i kategorii.

## E2E

- Tekst → potwierdzenie → READY → źródło.
- Tekst → pytanie → odpowiedź A; powrót → odpowiedź B → prawidłowe ponowne obliczenie.
- „Nie wiem” → jawny brak rozstrzygnięcia.
- Nieznany przedmiot → brak sfabrykowanej instrukcji.
- Specjalny odbiór → zgodna lista albo poprawny brak punktów.
- AI wyłączone, miejskie API niedostępne → działający tekst na snapshocie.
- P1: błędny format/duży plik/model timeout → bezpieczny powrót do tekstu, bez utraty stanu.

## Kontrola ręczna

Telefon 360 px, laptop, klawiatura, 200% powiększenia, polskie znaki, widoczny warunek i źródło. Użytkownik spoza zespołu ma potwierdzić przedmiot, wybrać „nie wiem” i zmienić odpowiedź. Bez podpowiadania podczas próby. Dla zdjęć sprawdź, że nie ma publicznego pliku, logu base64 i niepotrzebnej retencji.

## Odbiór

Po utworzeniu skryptów wykonaj typecheck, lint, testy, E2E, build i start produkcyjny. Zapisz wersję danych/reguł i wynik. Pokazuj tylko reviewed scenariusze; nie maskuj błędów selektywnym wyłączeniem przypadków bez ujawnienia zakresu. Jeśli nie ma pewnych kategorii ECO, lepiej wyłączyć rekomendacje punktów i opisać powód niż pokazać błędną listę.
