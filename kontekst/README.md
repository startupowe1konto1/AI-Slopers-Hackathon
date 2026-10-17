# Dwa plany aplikacji dla Claude Code

Język aplikacji i dokumentacji: polski.

To kompletny pakiet planistyczny dla dwóch **niezależnych aplikacji** na Warsaw Open Data Hackathon 2026. Nie zawiera gotowej aplikacji ani raportu z wykonanych testów. Zadania pozostają do realizacji. Informacje o danych pochodzą z dokumentacji miejskiej; pobranie pełnych odpowiedzi z tokenem jest pierwszym etapem implementacji.

## Co wybrać

| Projekt | Najmocniejsza strona | Największe ryzyko | Priorytet |
|---|---|---|---|
| Zanim zgłosisz | Wyszukiwanie podobnych realizacji BO z wyjaśnieniem różnic | Jakość i kompletność opisów oraz lokalizacji | Rekomendowany dla zespołu od tekstu i wyszukiwania |
| Rozłóż i wyrzuć | Pytanie rozstrzygające zamiast zgadywania segregacji | Błędna reguła i brak przewagi nad istniejącą wyszukiwarką | Dla zespołu od interakcji i weryfikacji reguł |

Na konkurs wybierzcie jeden projekt. Budowanie obu w tej samej dobie rozmywa produkt i zmniejsza szansę na dobrą demonstrację. Pakiety pozwalają później zrealizować oba jako osobne repozytoria.

## Struktura

- [Zasady, granice przygotowania i źródła](wspolne/01_KONKURS_I_ZRODLA.md)
- [Stos technologiczny, środowisko i uruchomienie](wspolne/02_STACK_I_OPERACJE.md)
- [Sposób pracy z Claude Code i kontrola postępu](wspolne/03_PRACA_Z_CLAUDE.md)
- [Instrukcje Claude — Zanim zgłosisz](zanim-zglosisz/CLAUDE.md)
- [Instrukcje Claude — Rozłóż i wyrzuć](rozloz-i-wyrzuc/CLAUDE.md)

Każdy projekt zawiera dokumenty `01`–`09`: produkt, dane, architektura i API, UX, algorytmy i AI, zadania, testy, prezentacja oraz ryzyka i pilotaż. Plik `10_PROMPTY_STARTOWE.md` zawiera polecenia do prowadzenia implementacji.

## Jak przekazać pakiet Claude Code

1. Zachowaj cały katalog, żeby działały odwołania do dokumentów wspólnych.
2. Uruchom Claude Code w katalogu wybranego projektu, np. `zanim-zglosisz`.
3. Wklej prompt z `10_PROMPTY_STARTOWE.md`.
4. Kod twórz w podkatalogu `app/`; planów nie przenoś do kodu aplikacji. Nie nadpisuj istniejących plików bez ich przeczytania.
5. Claude najpierw sprawdza etap wydarzenia, repozytorium, narzędzia i dane. Potem realizuje kolejkę zadań, aktualizując dziennik.
6. Jeżeli przenosisz tylko jeden projekt, skopiuj również sąsiedni katalog `wspolne/` i zachowaj względne położenie.

## Znaczenie oznaczeń

- **POTWIERDZONE W DOKUMENTACJI** — widoczne na oficjalnej stronie, ale niekoniecznie potwierdzone odpowiedzią API.
- **DO WERYFIKACJI** — wymaga rzeczywistego rekordu, eksperymentu lub odpowiedzi organizatora.
- **DECYZJA PROJEKTOWA** — rekomendacja autora planu, którą można zmienić na podstawie faktów.
- **P0** — potrzebne do działającego, uczciwego demo.
- **P1** — wyróżnik dodawany po uruchomieniu przepływu P0.
- **P2** — rozwój po konkursie lub wyłącznie przy zapasie czasu.

## Najważniejsze zasady realizacji

Cały przepływ ma działać wcześnie. W obu projektach najpierw źródła i wariant deterministyczny, potem AI. Stan nieznany jest normalnym wynikiem. Liczby i daty pochodzą z danych lub obliczeń. Przykłady syntetyczne są oznaczone i nie udają danych Warszawy. Żaden wynik skuteczności nie jest wpisany z góry.

Zakres dozwolonego użycia materiałów przygotowanych przed wydarzeniem wymaga wyjaśnienia z organizatorem; ten pakiet nie stanowi takiej zgody. Szczegóły w dokumencie wspólnym `01`.
