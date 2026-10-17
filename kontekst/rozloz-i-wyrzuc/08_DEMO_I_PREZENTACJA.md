# Demo i prezentacja — Rozłóż i wyrzuć

## Główna historia

„Mieszkaniec nie musi znać nazwy katalogowej. Aplikacja rozpoznaje, czego dotyczy pytanie, ustala potrzebną cechę i prowadzi do warszawskiej reguły”.

Nie zaczynaj od „zrobiliśmy AI do zdjęć”. Zacznij od konkretnej niepewności i decyzji. Zdjęcie jest dodatkiem do historii, jeśli rzeczywiście działa.

## Wybór przykładów

A: prosty przedmiot opisany potocznie. B: przypadek, w którym pytanie o potwierdzoną w źródle cechę zmienia zalecenie. C: specjalny odbiór z potwierdzonym punktem albo uczciwy stan braku danych. Wybierz rzeczywiste reguły po imporcie. Nie wymyślaj obowiązującej zasady tylko dlatego, że daje efektowne demo.

## Pitch 5 minut

| Czas | Treść |
|---|---|
| 0:00–0:35 | Problem: wygląd i potoczna nazwa nie wystarczają do decyzji |
| 0:35–1:25 | Opis lub zdjęcie, potwierdzenie przedmiotu |
| 1:25–2:30 | Pytanie, odpowiedź, zmiana warunku i wskazanie reguły |
| 2:30–3:15 | Źródło oraz zgodny punkt albo obsługa unknown |
| 3:15–4:05 | Dane, deterministyczna decyzja, faktyczny wynik małej próby |
| 4:05–5:00 | Pilotaż i przewaga nad wyszukiwaniem po nazwie |

Slajdy: problem; działanie; miejskie źródła i granice AI; walidacja; pilotaż. Przygotuj nagranie działającego przepływu jako plan awaryjny, jawnie nazwane nagraniem. Nie odtwarzaj na sztywno spreparowanego „wyniku na żywo”.

## Pytania jury

**Czym różnicie się od Segreguj na 5?** Wykorzystujemy miejską wiedzę, dodając potoczny opis, potwierdzanie rozpoznania i pytanie rozstrzygające. Wskaż konkretny, działający scenariusz. Nie twierdź, że istniejąca usługa nie ma danej funkcji, jeśli tego nie sprawdzono.

**Co robi model?** Proponuje nazwę przedmiotu. Jeśli wdrożono inne funkcje, wymień je. Końcowe zalecenie pochodzi z przejrzanych reguł i źródeł.

**Czy zawsze odpowiadacie?** Nie. W prototypie jawnie ograniczamy zakres i mamy unknown/conflict.

**Czy każdy punkt przyjmie przedmiot?** Pokazujemy tylko kategorie potwierdzone danymi; szczegółowe warunki mogą wymagać potwierdzenia u operatora. Nie udajemy pełnego katalogu odbioru wszystkich odpadów.

**Ile odpadów uratujecie?** Prototyp mierzy poprawność i wygodę decyzji. Wpływ środowiskowy wymaga późniejszego badania.

**Co ze zdjęciami?** Opisz faktyczne przetwarzanie, dostawcę i retencję. Jeśli obraz jest wyłączony, powiedz to wprost.

## Oddanie

Kod z lockfile, README, manifesty, źródła i licencje, lista obsługiwanych scenariuszy, wersja przejrzanych reguł, raport testów, opis AI, ograniczenia oraz prezentacja. Przygotowane reguły publikuj ze wskazaniem, że są redakcją zespołu opartą na źródłach. Nie publikuj zdjęć użytkowników ani sekretów.

Przed terminem sprawdź dostęp jury do materiałów. Zanotuj finalną wersję i nie zmieniaj jej po zakończeniu pracy poza zasadami organizatora.
