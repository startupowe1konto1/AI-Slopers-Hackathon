# Backlog i harmonogram — Zanim zgłosisz

Wszystkie pozycje początkowo TODO. Estymacje służą planowaniu pracy czteroosobowego zespołu; nie sumują się do czasu ściennego. Kod powstaje w `app/`.

## Zadania

| ID | Priorytet / właściciel | Zależność | Zakres i odbiór |
|---|---|---|---|
| Z00 | P0 / produkt | Brak | Ustalenie etapu wydarzenia, kategorii i dozwolonego przygotowania; zapis decyzji bez wymyślania zgody |
| Z01 | P0 / dane | Z00 | Jedno działające wywołanie BO, opis obwiedni i zakresu; brak sekretów w logu |
| Z02 | P0 / dane | Z01 | Normalizator, manifest, raport braków, test null/koszt/pins; surowe dane zachowane lokalnie |
| Z03 | P0 / frontend | Z00 | Szkielet projektu, formularz i widoki błędów; uruchamia się lokalnie |
| Z04 | P0 / wyszukiwanie | Z02 | Ranking tekstowy; co najmniej jeden rzeczywisty sensowny wynik oraz obsługa braku dopasowania |
| Z05 | P0 / backend | Z02, Z04 | API search/detail/coverage; walidacja wejścia, bez surowych danych osobowych |
| Z06 | P0 / frontend | Z03, Z05 | Formularz → wyniki → źródło; działa na realnym snapshocie |
| Z07 | P0 / wyszukiwanie | Z02 | Lokalizacja i multi-pin; brak geometrii pozostaje unknown; test odległości |
| Z08 | P0 / frontend+backend | Z06 | Porównanie 3 projektów, pola i braki; brak wyroku „duplikat” |
| Z09 | P0 / produkt+backend | Z08 | Pytania szablonowe i karta do skopiowania; rozdzielenie faktów i sugestii |
| Z10 | P1 / wyszukiwanie | Z04, Z06 | Embeddingi i RRF, wersjonowanie cache; bazowy wariant nadal działa |
| Z11 | P1 / AI | Z08 | Wyjaśnienie JSON z walidacją dowodów i timeoutem; błąd przechodzi do szablonu |
| Z12 | P1 / frontend | Z07, Z08 | Mapa tylko jeśli gotowa lista; utrzymana funkcja przy awarii podkładu |
| Z13 | P0 / produkt | Z04 | Zestaw roboczy i odłożona próba; oczekiwane wyniki ustalone ręcznie |
| Z14 | P0 / cały zespół | Z06–Z09 | Testy, mobile, brak AI/API, build i restart; zapis wyniku |
| Z15 | P0 / produkt | Z14 | Pitch 5 min, nagranie awaryjne i dokumentacja rzeczywistego zakresu |
| Z16 | P0 / lider | Z15 | Zamrożenie, sprawdzenie repo/linków, przekazanie organizatorowi i potwierdzenie dostępności |

## Kolejność krytyczna

Z00 → Z01 → Z02 → Z04 → Z05 → Z06 → Z08 → Z09 → Z14 → Z15 → Z16.

Z03 równolegle z importem w pracy ludzi. Z13 startuje wcześnie. Z10–Z12 nie mogą opóźniać ścieżki krytycznej. Nie deklaruj integracji, jeśli działa tylko fixture.

## Czas Europe/Warsaw

| Okres | Wynik do osiągnięcia |
|---|---|
| Sobota 11–12 | API, próbka, zakres, weryfikacja formalna |
| 12–13 | Konsultacja danych, decyzja go/no-go, model normalizowany |
| 13–16 | Pierwszy pełny przepływ tekstowy z realnym rekordem |
| 16–19 | Porównanie, lokalizacja i karta; cały P0 widoczny |
| 19–21 | Integracja, pierwsza próba użytkownika i ewentualnie hybryda |
| 21–23 | Naprawy trafności, wybór demo, decyzja o wyłączeniu niedojrzałych funkcji |
| Sobota 23 – niedziela 03 | Zmiana A: wyjaśnienia/testy; zmiana B odpoczywa |
| Niedziela 03–06 | Zmiana B: dokumentacja i odporność; A odpoczywa |
| 06–08 | Odłożona próba oceny i sprawdzenie produkcyjnego uruchomienia |
| 08–09 | Ostatnia konsultacja i poprawki błędów |
| 09–10 | Zamrożenie funkcji, próby pitchu, nagranie |
| 10–10:30 | Ostateczna dokumentacja i przekazanie |
| 10:30–11 | Bufor i sprawdzenie dostępu; koniec zmian zgodnie z terminem |

## Reguły cięcia zakresu

- Do 13 brak dobrego opisu/lokalizacji: ogranicz obszar albo porzuć komponent geograficzny; nie dopisuj danych.
- Do 16 brak end-to-end: usuń mapę i AI; użyj repozytorium JSON.
- Do 19 brak porównania: zrezygnuj z hybrydy i eksportu plikowego.
- Po 21 nie zmieniaj frameworka.
- O 09 kończ nowe funkcje. Naprawy mają dotyczyć krytycznego działania i rzetelności.

## Obsada

4 osoby: dane/backend; wyszukiwanie/AI; frontend; produkt/testy/pitch. 3 osoby: połącz dane i wyszukiwanie, zostaw mapę oraz generację na później. 5 osób: dodaj integratora/testera, nie dodatkowy produkt. Synchronizacja co 2–3 godziny: co działa, co blokuje, co wycinamy. Jedna osoba odpowiada za termin oddania.
