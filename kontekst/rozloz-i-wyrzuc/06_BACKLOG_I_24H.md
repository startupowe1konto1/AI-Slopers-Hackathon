# Backlog i 24 godziny — Rozłóż i wyrzuć

Wszystkie zadania TODO. Priorytetem jest jakość reguł i działający tekstowy przepływ. Praca czteroosobowego zespołu: dane/backend; reguły i wyszukiwanie; frontend; produkt/testy/pitch.

| ID | Priorytet / właściciel | Zależność | Zakres i kryterium odbioru |
|---|---|---|---|
| R00 | P0 / produkt | Brak | Etap wydarzenia, kwalifikacja kategorii, granice przygotowania; zapis faktów |
| R01 | P0 / dane | R00 | Prawdziwe odpowiedzi WASTE/TYPES; ustalone relacje, brak sekretów w raporcie |
| R02 | P0 / dane | R01 | Import, normalizacja, manifest, raport braków i konfliktów |
| R03 | P0 / reguły+produkt | R02 | 12–15 scenariuszy lub mniejszy jawny zakres; dowód i przegląd dla każdej reguły |
| R04 | P0 / frontend | R00 | Szkielet mobile, wejście tekstowe, potwierdzenie, pytanie, wynik, unknown |
| R05 | P0 / reguły | R03 | Silnik TRUE/FALSE/UNKNOWN, wyłączenia i conflict; testy logiki |
| R06 | P0 / backend | R02, R05 | API recognize/evaluate/coverage; ponowne przeliczenie stanu na serwerze |
| R07 | P0 / frontend | R04, R06 | Pełny tekstowy przepływ z rzeczywistą instrukcją i źródłem |
| R08 | P0 / dane | R01 | Potwierdzenie endpointu ECO, import i mapowanie kategorii; brak zgadywania przyjmowania |
| R09 | P0 warunkowe / backend | R08 | Zgodne punkty, adresy, godziny; jeśli brak dowodów kategorii — jawnie CUT i brak rekomendacji |
| R10 | P0 / produkt | R03 | Robocze i odłożone przypadki testowe, ręczny wzorzec oczekiwań |
| R11 | P1 / AI | R07 | Zdjęcie, limity, minimalna retencja, potwierdzanie hipotez; bez porad modelu |
| R12 | P1 / frontend | R09 | Mapa z listą awaryjną; atrybucja i zachowanie bez podkładu |
| R13 | P0 / cały zespół | R07, R10 | Testy logiki i E2E, mobile, brak AI/API, build i restart |
| R14 | P0 / produkt | R13 | Pitch z pytaniem rozstrzygającym, dowodami i faktycznym wynikiem testu |
| R15 | P0 / lider | R14 | Dokumentacja, kontrola sekretów/linków, oddanie i potwierdzenie dostępności |

## Ścieżka krytyczna

R00 → R01 → R02 → R03 → R05 → R06 → R07 → R13 → R14 → R15. R04 niezależnie podczas pracy ludzi. R08–R09 mogą być wycięte, jeśli źródła nie potwierdzą kategorii; nie blokują podstawowej pomocy w segregacji. Zmianę zakresu ujawnij. R11/R12 nigdy nie wyprzedzają działającego R07.

## Harmonogram Europe/Warsaw

| Okres | Efekt |
|---|---|
| Sobota 11–12 | Próbki danych, relacja typów i instrukcji, ustalenia formalne |
| 12–13 | Konsultacja, wybór scenariuszy i go/no-go |
| 13–16 | Pierwsza przejrzana reguła i pełna ścieżka tekstowa |
| 16–19 | Pytania rozstrzygające, wyłączenia, source UI; cały P0 |
| 19–21 | Eko punkty, testy pierwszych użytkowników; tylko potwierdzone przyjmowanie |
| 21–23 | Poprawki reguł; decyzja, czy jest czas na zdjęcie |
| Sobota 23 – niedziela 03 | Zmiana A: opcjonalna wizja i testy; B odpoczywa |
| Niedziela 03–06 | Zmiana B: odporność i dokumentacja; A odpoczywa |
| 06–08 | Odłożona próba, ocena błędnych zaleceń i stanów unknown |
| 08–09 | Ostatnie konsultacje i krytyczne poprawki |
| 09–10 | Zamrożenie funkcji, próby i nagranie |
| 10–10:30 | Finalne pliki i przekazanie |
| 10:30–11 | Bufor, sprawdzenie dostępu i koniec zmian |

## Bramki i cięcia

13:00 — istnieją konkretne miejskie instrukcje i warunek pozwalający pokazać wartość pytania. Jeżeli nie, zmień zestaw scenariuszy lub ogranicz obietnicę; nie fabrykuj pytania dla efektu.

16:00 — tekst prowadzi do prawdziwego wyniku. Jeśli nie, odłóż obraz, mapę i punkty.

19:00 — nie może być błędnych reguł w demonstracyjnym zakresie. Zawęź z 15 do 8 poprawnych scenariuszy, jeśli to potrzebne, i ujawnij ograniczenie. Pokrycie nie jest ważniejsze od poprawności.

23:00 — jeśli obraz nie jest stabilny, wyłącz go. Nie przepisuj backendu z powodu wizji.

09:00 — żadnych nowych scenariuszy ani reguł poza naprawą ujawnionego krytycznego błędu i ponowną weryfikacją.

## Wariant zespołu

3 osoby: połącz dane/backend i reguły; tekst, pytanie i źródło wystarczą. 5 osób: dodatkowa osoba weryfikuje reguły i integrację. Jedna osoba poza autorem reguły powinna sprawdzić jej interpretację. Regularna synchronizacja dotyczy działania i błędów, nie tylko listy napisanych plików.
