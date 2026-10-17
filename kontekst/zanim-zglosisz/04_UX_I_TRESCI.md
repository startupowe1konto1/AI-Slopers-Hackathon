# UX i treści — Zanim zgłosisz

## Układ i priorytety

Interfejs spokojny, czytelny, z jednym wyraźnym działaniem na ekranie. Własna identyfikacja produktu; nie sugeruj, że to oficjalna usługa urzędu. Kolor akcentu granat/turkus, jasne tło, kontrastowe komunikaty. Lista wyników ważniejsza od dekoracyjnej mapy. Projektuj od szerokości 360 px, a na laptopie użyj dwóch kolumn: lista i szczegóły.

## Widoki

### `/` — pomysł

Nagłówek: „Sprawdź podobne realizacje, zanim opiszesz swój pomysł”. Opis objaśnia zakres bazy jednym zdaniem. Pole wielowierszowe z etykietą „Co chcesz zmienić i komu ma to pomóc?”. Podpowiedź: „Opisz potrzebę, miejsce i planowane działanie”. Dzielnica/obszar opcjonalne, punkt na mapie P1. Główne działanie „Znajdź podobne realizacje”. Nie zapisuj tekstu po stronie serwera. Zachowanie lokalne tylko za świadomym wyborem użytkownika, P1.

### `/wyniki` — wyniki w stanie sesji

Na górze opis zapytania i przycisk edycji. Informacja „Przeszukano [N] projektów, edycje [zakres], dane pobrane [data]”. Maksymalnie 5 kart. Karta: tytuł, edycja, status jeśli znany, lokalizacja, odległość jeśli obliczalna, 1–2 uzasadnienia, fragment, źródło, checkbox porównania. Limit 3 wyborów z komunikatem. URL nie zawiera pełnego pomysłu.

Grupy wyników nie powinny znikać po zmianie sortowania bez wyjaśnienia. „Podobne działania w innych miejscach” jest osobną sekcją. Brak lokalizacji mówi „Nie porównujemy odległości”. Nie używaj czerwonych etykiet „duplikat”.

### `/porownanie`

Desktop: tabela do trzech projektów obok pomysłu. Mobile: sekcje pól w pionie i przełączanie projektów, bez konieczności poziomego przewijania całej strony. Wiersze: cel/działanie, odbiorcy, zakres, miejsce, dostępność, edycja/status, historyczny koszt. Interpretacje oznacz jako sugestie. Tekst miejski i opis użytkownika są wizualnie rozdzielone.

### Karta robocza

Sekcje: „Twój pomysł”, „Realizacje do sprawdzenia”, „Podobieństwa i różnice”, „Pytania do doprecyzowania”, „Źródła i zakres”. Przycisk „Kopiuj kartę”. Informacja po skopiowaniu obsługiwana przez aria-live. Karta nie stwierdza formalnej gotowości do zgłoszenia.

### `/o-danych`

Pokrycie, data importu, ograniczenia, pochodzenie, licencja, sposób użycia AI i wariant uproszczony. Braki kosztów/statusów podane liczbowo, jeśli raport je policzył. Brak danych w raporcie nie jest zastępowany zerami.

## Komunikaty do wdrożenia

| Stan | Tekst |
|---|---|
| Brak wyników | „W zaimportowanym zakresie nie znaleźliśmy mocnego dopasowania. To nie potwierdza, że podobny projekt nie istnieje.” |
| Brak kosztu | „Brak kwoty w dostępnych danych.” |
| Koszt | „Kwota z edycji [rok]. Zakresy i ceny mogą się różnić.” |
| Brak statusu | „Status nie został jednoznacznie odczytany.” |
| Brak geometrii | „Brak współrzędnych — nie obliczamy odległości.” |
| Tryb bez AI | „Pokazujemy porównanie pól i fragmentów źródeł. Rozszerzone wyjaśnienie jest niedostępne.” |
| Brak zbioru | „Nie mamy aktywnego zbioru. Wyniki nie są obecnie dostępne.” |

## Dostępność

Prawdziwe etykiety formularzy, kolejność nagłówków, widoczny fokus, obsługa klawiaturą i błędów przy polach. Nie przekazuj stanu samym kolorem. Jasne nazwy linków źródłowych. Długie tytuły i polskie znaki nie rozsadzają kart. Ładowanie nie blokuje odczytu już odnalezionych wyników. Zachowaj pomysł po błędzie. Przetestuj powiększenie 200% i telefon.

## Co sprawdzić z użytkownikiem

Poproś osobę spoza implementacji o znalezienie realizacji i wskazanie różnicy bez pomocy prowadzącego. Zanotuj czas, punkty niezrozumienia i pytanie „Skąd wiesz, że tej odpowiedzi można zaufać?”. Popraw źródła, jeśli uczestnik nie potrafi ich znaleźć.
