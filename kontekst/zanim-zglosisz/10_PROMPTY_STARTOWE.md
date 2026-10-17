# Polecenia do Claude Code — Zanim zgłosisz

Poniższe polecenia prowadzą realizację. Nie są gotowymi promptami modelu wewnątrz aplikacji. Użycie pakietu w konkursie podlega ustaleniom z organizatorem.

## Start

> Pracujemy nad aplikacją „Zanim zgłosisz”. Przeczytaj CLAUDE.md, dokumenty wspólne oraz 01, 02 i 06. Najpierw sprawdź istniejące pliki i środowisko. Ustal, czy można rozpocząć implementację konkursową. Nie twórz całego produktu na fikcyjnych danych. Zrób rozpoznanie miejskiego API bez ujawniania sekretów i zapisz fakty w app/work/DATA_DISCOVERY.md. Kod twórz w app/. Przyjmij proponowany prosty stos, chyba że repozytorium lub kompetencje zespołu uzasadniają inną decyzję. Rozpocznij od Z00–Z03 i pokaż, co potwierdzono, co pozostaje niewiadome i jaki jest następny krok.

## Pierwszy przepływ

> Kontynuuj według backlogu. Zbuduj importer, normalizator, manifest i wyszukiwanie tekstowe, a następnie formularz, wyniki i źródło na rzeczywistym snapshocie. Wstrzymaj mapę i generację. Wykonaj testy null, kosztów, statusów i wielu punktów. Zaktualizuj PROGRESS.md dopiero po uruchomieniu przepływu. Nie wykonuj commitów bez polecenia.

## Wartość porównania

> Zaimplementuj wybór do trzech projektów, porównanie pól i pytania zależne od luk. Pokaż braki danych jako unknown. Karta robocza oddziela tekst użytkownika, fakty źródłowe i sugestie. Żaden wynik nie może orzekać, że pomysł jest zbędnym duplikatem. Zweryfikuj cały przepływ w przeglądarce.

## Opcjonalne AI

> Sprawdź, czy P0 jest gotowe i pozostał czas. Jeśli tak, dodaj wyszukiwanie hybrydowe lub ograniczone wyjaśnienie, wybierając jedno najkorzystniejsze rozszerzenie. Użyj istniejącej, autoryzowanej konfiguracji dostawcy. Nie zakładaj, że Claude Code dostarcza klucz aplikacji. Wymagaj identyfikatorów dowodów, waliduj wyjście i zachowaj działanie bez AI. Oceń zmianę względem baseline na odłożonej próbie.

## Kontynuacja po przerwaniu

> Przeczytaj CLAUDE.md i app/work/PROGRESS.md oraz DECISIONS.md. Sprawdź stan kodu i ostatni działający przepływ. Nie zaczynaj od nowa i nie powtarzaj potwierdzonych eksperymentów bez powodu. Zrealizuj następne zadanie ścieżki krytycznej, zapisz wynik i pozostałe blokery.

## Końcowy odbiór

> Zamroź nowe funkcje. Wykonaj 07_TESTY_I_ODBIOR.md i zapisz faktyczne wyniki. Napraw blokery głównego przepływu, sekretów i pochodzenia danych. Przygotuj README, DATA_SOURCES, AI_USAGE, VALIDATION oraz materiały prezentacji zgodne z rzeczywistym produktem. Nie wpisuj zmyślonych metryk ani partnerstw. Nie publikuj i nie oddawaj materiałów zewnętrznie bez autoryzacji użytkownika. Zakończ krótkim raportem: co działa, jak uruchomić, co sprawdzono, co nie działa.
