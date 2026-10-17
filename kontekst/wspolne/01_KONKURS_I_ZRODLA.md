# Konkurs, pochodzenie ustaleń i źródła

## Ustalenia konkursowe

Według strony wydarzenia praca trwa 24 godziny, od soboty 11:00 do niedzieli 11:00 (Europe/Warsaw). Zespół liczy 3–5 osób. Wyzwanie 3 jest kategorią otwartą poza dwoma pozostałymi tematami. Potwierdź kwalifikację wybranego projektu na otwarciu.

Regulamin wymaga co najmniej jednego zbioru miejskiego, stworzenia rozwiązania podczas wydarzenia, dokumentacji, prezentacji i repozytorium, jeśli powstał kod. Wcześniej przygotowane elementy rozwiązania są ograniczone; przewidziano wyjątek dla odpowiednio licencjonowanych darmowych bibliotek i frameworków open source. AI jest dopuszczone z ujawnieniem zakresu użycia. Po zakończeniu pracy nie można zmieniać rozwiązania. Prezentacja trwa do 5 minut, pytania dodatkowe 2 minuty. Nagrodzone projekty obejmuje licencja określona w §7.

Ocena: innowacyjność 25%, dane 20%, wdrożenie 20%, prezentacja 20%, realia Warszawy 15%.

Źródła: [strona wydarzenia](https://42warsaw.pl/pl/hackathon-otwarte-dane-warszawa/), [regulamin PDF](https://42warsaw.pl/wp-content/uploads/2026/09/Regulamin-Warsaw-Open-Data-Hackathon_2026.pdf). Harmonogram mentorów pochodzi z maili przekazanych przez uczestnika.

## Granica przygotowania

Pakiet powstał przed wydarzeniem. Nie zakładaj, że kod, prompty aplikacyjne, makiety, reguły lub materiały konkursowe przygotowane wcześniej można wykorzystać. Przed implementacją konkursową uczestnik powinien ustalić dopuszczalny zakres przygotowania koncepcji, korzystania z tego planu oraz modeli/usług AI. Nie interpretuj milczenia organizatora jako zgody. Jeżeli trwa okres przygotowawczy, pozostaw pracę na poziomie rozeznania. Dla realizacji poza konkursem ograniczenie czasowe nie obowiązuje.

Nie wysyłaj pytań w imieniu użytkownika bez jego zgody. Zapisz odpowiedź organizatora i jej datę w dzienniku decyzji; nie twórz takiej odpowiedzi samodzielnie.

## Rejestr źródeł danych

| ID | Oficjalne źródło | Stan wiedzy |
|---|---|---|
| BO | [Budżet obywatelski](https://dane.um.warszawa.pl/pl/catalogue/fb4a355f-cc99-4a86-af27-e271b9c77d38) | Sprawdzono opis, pola i przykład wywołania; nie pobrano pełnego zbioru |
| WASTE | [Segregacja odpadów](https://dane.um.warszawa.pl/pl/catalogue/152838ce-0f39-4814-a6db-93aa3caf2e0c) | Sprawdzono opis i adres usługi; struktura odpowiedzi do ustalenia |
| TYPES | [Typy odpadów](https://dane.um.warszawa.pl/pl/catalogue/92942779-493f-4737-9c97-6de471f66f0a) | Sprawdzono pola i adres usługi |
| ECO | [Eko punkty](https://dane.um.warszawa.pl/pl/catalogue/8129064a-9e5a-4e73-936e-53fa874045ed) | Sprawdzono pola, adres usługi i przykładowy format harmonogramu; nie pobrano pełnej odpowiedzi |
| KEY | [Klucz API](https://dane.um.warszawa.pl/key-api) | Sposób uzyskania i uprawnienia sprawdzić podczas realizacji |

W katalogu oznaczono te zbiory jako Creative Commons Attribution. Przed publikacją sprawdź pełne warunki, wersję licencji i wymagane oznaczenia. Nie utożsamiaj publicznego dostępu z brakiem obowiązków licencyjnych. Zachowaj identyfikator źródła, datę pobrania i informację o przetworzeniu.

## Źródła techniczne

- [Next.js — instalacja](https://nextjs.org/docs/app/getting-started/installation): punkt odniesienia przy tworzeniu projektu.
- [SQLite FTS5](https://www.sqlite.org/fts5.html): wyszukiwanie pełnotekstowe, składnia zapytań i ranking.
- [Playwright — instalacja](https://playwright.dev/docs/intro): testowanie przepływów przeglądarkowych.

Wersje pakietów dobierz podczas implementacji, zapisz w lockfile i nie aktualizuj przed samym oddaniem. Nie kopiuj numerów wersji z pamięci modelu.

## Wymagane rejestry tworzone podczas implementacji

- `work/DATA_DISCOVERY.md`: fakty o odpowiedziach API, liczebność i braki.
- `work/DECISIONS.md`: wybory, dowody, czas i powód zmiany zakresu.
- `work/PROGRESS.md`: stan zadań i kolejne kroki.
- `docs/DATA_SOURCES.md`: pochodzenie danych użytych w aplikacji.
- `docs/AI_USAGE.md`: użycie AI przy budowie i w działającym produkcie, osobno.
- `docs/VALIDATION.md`: polecenia, wyniki i ograniczenia faktycznej weryfikacji.

To planowane pliki przyszłego repozytorium. Nie istnieją jeszcze i nie wolno przedstawiać ich jako gotowych dowodów.
