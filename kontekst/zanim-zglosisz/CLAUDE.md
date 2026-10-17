# Claude Code — Zanim zgłosisz

## Misja

Zbuduj polskojęzyczny prototyp pomagający mieszkańcowi porównać pomysł do budżetu obywatelskiego z miejskimi realizacjami. Produkt wyjaśnia wspólne cechy i różnice, odsyła do źródeł i pomaga doprecyzować opis. Nie orzeka o dopuszczalności ani zbędności pomysłu.

## Czytaj w tej kolejności

1. [Wspólne zasady i źródła](../wspolne/01_KONKURS_I_ZRODLA.md)
2. [Produkt](01_PRODUKT_I_ZAKRES.md)
3. [Dane](02_DANE_I_IMPORT.md)
4. [Zadania](06_BACKLOG_I_24H.md)
5. [Architektura](03_ARCHITEKTURA_I_API.md), [algorytmy](05_WYSZUKIWANIE_I_AI.md)
6. [UX](04_UX_I_TRESCI.md), [testy](07_TESTY_I_ODBIOR.md)
7. [Praca z Claude](../wspolne/03_PRACA_Z_CLAUDE.md), [stos](../wspolne/02_STACK_I_OPERACJE.md)

Pozostałe materiały: [pitch](08_DEMO_I_PREZENTACJA.md), [ryzyka](09_RYZYKA_I_PILOTAZ.md), [prompty startowe](10_PROMPTY_STARTOWE.md).

## Reguły domenowe

- Wynik jest podobną realizacją, nie potwierdzonym duplikatem.
- Baza obejmuje tylko faktycznie zaimportowany zakres. Brak wyniku nie dowodzi braku projektu w całym mieście.
- Rok, kwota, odległość, status i URL pochodzą z danych lub programu, nigdy z generacji modelu.
- Kwota historyczna jest kontekstem, nie aktualną wyceną. Brak kwoty nie jest zerem.
- Nie mapuj liczbowych statusów bez potwierdzenia; nie zgaduj dzielnicy z nazwy pola.
- Projekty wielopunktowe i ogólnomiejskie traktuj osobno.
- Widok podobieństwa wskazuje dowody i niepewność.
- Głosy nie są miarą potrzeby mieszkańców, jakości projektu ani szans nowego pomysłu.
- Nie potrzebujesz danych osobowych autorów ani automatycznego pobierania załączników.

## Wykonanie

Kod w `app/`. Najpierw importer i manifest, później wyszukiwanie tekstowe i pełny przepływ, następnie opcjonalne znaczenie semantyczne i AI. Lista i porównanie mają działać bez mapy, modelu i miejskiego API w czasie demo. Przeczytaj istniejące pliki przed zmianą; nie inicjuj repozytorium wewnątrz innego bez potrzeby.

Nie uruchamiaj całego backlogu jednym wielkim krokiem. Prowadź `app/work/PROGRESS.md`. Każde zamknięte zadanie ma kryterium odbioru i dowód. O 19:00 powinien działać cały P0, o 09:00 następnego dnia zamroź nowe funkcje. Przed oddaniem użyj checklisty testowej i przećwicz pięciominutowe demo.

Publiczne wdrożenie i integracja z urzędowym systemem są opcjonalne i nie należą do warunków P0.
