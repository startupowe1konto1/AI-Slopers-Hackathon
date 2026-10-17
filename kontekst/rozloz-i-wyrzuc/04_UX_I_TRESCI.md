# UX i treści — Rozłóż i wyrzuć

## Kierunek

Telefon 360 px, obsługa jedną ręką, krótki przebieg i duże przyciski. Jasne tło, ciemny tekst, jeden akcent. Kolory frakcji dopiero w potwierdzonym wyniku i zawsze z nazwą; sam kolor nie jest instrukcją. Nazwa „Rozłóż” nie może sugerować rozbierania każdego przedmiotu. Podtytuł: „Ustal, co zrobić z przedmiotem według warszawskich zasad”. Własna identyfikacja prototypu, bez pozoru oficjalności.

## Ekran 1 — wejście

Nagłówek „Co chcesz wyrzucić?”. Pole „Opisz przedmiot”, podpowiedź „Podaj nazwę i cechę, którą znasz”. Główne działanie „Sprawdź”. Zdjęcie jako drugie wejście P1. Informacja o obsługiwanym zakresie. Tekst nie znika po błędzie. Nie proś o lokalizację, zanim pojawi się potrzeba znalezienia punktu.

## Ekran 2 — rozpoznanie

„Czy chodzi o ten przedmiot?” oraz 1–3 nazwy. Wybór użytkownika ustala kandydat, nie potwierdza niewidocznych cech. Przy zdjęciu miniatura i możliwość usunięcia; bez automatycznego przesyłania kolejnych obrazów. Akcje: „Tak”, „Inny przedmiot”, „Wpisz dokładniej”. Nie pokazuj procentu pewności modelu jako gwarancji.

## Ekran 3 — pytanie

Jedno pytanie na ekranie, duże opcje i „Nie wiem”. Krótkie uzasadnienie „Ta cecha wpływa na sposób postępowania”. Odpowiedź można zmienić, a zalecenie jest przeliczane od nowa. Maksymalnie dwa pytania w P0. Pytania pochodzą z przejrzanego zestawu, a nie swobodnej rozmowy generowanej bez końca.

## Ekran 4 — wynik

Hierarchia:

1. Rozpoznany przedmiot i przyjęte warunki.
2. Jednoznaczne zalecenie, jeśli READY.
3. Kroki przygotowania potwierdzone źródłem.
4. Oddzielne części tylko w przejrzanym scenariuszu.
5. „Dlaczego?” z krótkim fragmentem reguły i źródłem.
6. „Zmień odpowiedź” oraz „Sprawdź inną rzecz”.

Jeśli instrukcja zależy od odpowiedzi, pokaż ją: „Dla odpowiedzi: [wartość]”. Nie chowaj warunku w stopce. Nie wyświetlaj symbolu sukcesu w stanie UNKNOWN lub CONFLICT.

## Ekran 5 — punkty

Pokaż dopiero dla zweryfikowanej kategorii. Użytkownik wybiera obszar, punkt mapy albo opcjonalnie świadomie udostępnia lokalizację. Lista zawiera nazwę, adres, kategorię, godziny według danych, odległość geometryczną jeśli jest obliczalna, źródło. Nie rankinguj niezgodnego punktu tylko dlatego, że jest najbliżej. Brak godzin nie oznacza całodobowego dostępu.

## Komunikaty

| Stan | Treść |
|---|---|
| Niepewne rozpoznanie | „Nie rozpoznaliśmy przedmiotu jednoznacznie. Wybierz nazwę lub doprecyzuj opis.” |
| Nieznana cecha | „Bez tej informacji nie mamy podstaw do pewnego zalecenia.” |
| Brak reguły | „Nie znaleźliśmy jednoznacznej instrukcji w obsługiwanym zakresie miejskich danych.” |
| Konflikt | „Dostępne informacje nie pozwalają wybrać jednej instrukcji. Pokazujemy źródła do sprawdzenia.” |
| Brak punktu | „Nie mamy potwierdzonego punktu dla tej kategorii w zaimportowanym zbiorze.” |
| Godziny | „Godziny według danych pobranych [data]; dostępność może się zmienić.” |
| Zdjęcie | „Rozpoznajemy wygląd przedmiotu. Materiał i zawartość mogą wymagać potwierdzenia.” |
| Brak AI | „Wpisz nazwę — wyszukiwanie zasad nadal działa.” |

## Dostępność i próby

Etykiety, fokus, klawiatura, aria-live dla zmiany wyniku, poprawny odczyt opcji, kontrast. Nie polegaj na ikonie pojemnika. Telefon, laptop, 200% powiększenia, długi tekst i wolna sieć. W teście użytkownik ma umieć znaleźć warunek, zmienić odpowiedź i otworzyć źródło.

## Strona danych

Pokaż zakres obsługiwanych scenariuszy i daty, pochodzenie zasad, informację o redakcji zespołu, użycie AI, ograniczenia zdjęć i punktów. Nie umieszczaj rozbudowanej architektury w ścieżce segregacji.
