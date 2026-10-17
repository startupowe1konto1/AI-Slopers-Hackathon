# Claude Code — Rozłóż i wyrzuć

## Misja

Zbuduj polskojęzyczną aplikację mobilną w przeglądarce: opis przedmiotu, potwierdzenie rozpoznania, ewentualne pytanie i zalecenie oparte na warszawskich danych. Zdjęcie jest opcjonalnym wejściem. Decyzje segregacji nie mogą być wymyślane przez model.

## Czytaj w kolejności

1. [Zasady wspólne](../wspolne/01_KONKURS_I_ZRODLA.md)
2. [Produkt](01_PRODUKT_I_ZAKRES.md), [dane](02_DANE_I_IMPORT.md)
3. [Backlog](06_BACKLOG_I_24H.md)
4. [Architektura](03_ARCHITEKTURA_I_API.md), [reguły i AI](05_REGULY_I_AI.md)
5. [UX](04_UX_I_TRESCI.md), [testy](07_TESTY_I_ODBIOR.md)
6. [Praca z Claude](../wspolne/03_PRACA_Z_CLAUDE.md), [stos](../wspolne/02_STACK_I_OPERACJE.md)

Pozostałe: [demo](08_DEMO_I_PREZENTACJA.md), [ryzyka](09_RYZYKA_I_PILOTAZ.md), [polecenia startowe](10_PROMPTY_STARTOWE.md).

## Nienegocjowalne reguły domenowe

- AI proponuje rozpoznanie. Miejska reguła uzasadnia zalecenie.
- Zdjęcie nie potwierdza niewidocznego składu, zawartości, zanieczyszczenia ani sprawności.
- Brak informacji, konflikt i unknown są pełnoprawnymi wynikami.
- Nie pytaj o cechę, jeśli żadna potwierdzona reguła od niej nie zależy.
- Nie mapuj materiału automatycznie na pojemnik; uwzględniaj wyłączenia i rodzaj przedmiotu.
- Rozdzielanie części proponuj wyłącznie w zweryfikowanych przypadkach; bez automatycznego demontażu elektroniki i baterii.
- Do punktu kieruj po potwierdzeniu kategorii przyjmowania, potem oblicz odległość.
- Nie twierdź, że baza eko punktów obsługuje każdy odpad specjalny.
- Otwarcie według harmonogramu nie jest potwierdzeniem przyjęcia rzeczy w danej chwili.
- Nie przechowuj zdjęć, precyzyjnej lokalizacji ani historii mieszkańca w P0.

## Wykonanie

Kod w `app/`. Najpierw rzeczywiste dane i reguły 12–15 scenariuszy, później pełny tekstowy przepływ z pytaniem. Wizja dopiero po działającym P0. Reguły, pytania i wyniki mają identyfikatory i dowody. Prowadź PROGRESS.md; nie zaznaczaj zadania DONE bez działania i weryfikacji.

Model bez klucza nie blokuje P0. Brak danych miejskich blokuje uczciwą deklarację integracji, ale pozwala rozwijać oznaczony prototyp techniczny. Nie wymyślaj reguł z ogólnej wiedzy modelu, żeby zasłonić ten brak.
