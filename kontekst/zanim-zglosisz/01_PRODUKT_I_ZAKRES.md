# Produkt i zakres — Zanim zgłosisz

## Teza

Mieszkaniec zna potrzebę, ale nie zna historii podobnych realizacji. Aplikacja skraca drogę od pomysłu do świadomego opisu przez porównanie z istniejącymi projektami. To hipoteza wartości do sprawdzenia w pilotażu, nie stwierdzona oszczędność.

## Użytkownicy i zadania

Główny: mieszkaniec przygotowujący propozycję. Chce znaleźć realizacje, zrozumieć różnice, zadać właściwe pytania. Drugi: osoba wspierająca uczestników BO, korzystająca z tego samego widoku podczas konsultacji. Nie buduj osobnego panelu pracowniczego w P0.

Przykładowy opis roboczy: infrastruktura rowerowa przy szkole. To syntetyczne zapytanie, nie dowód istnienia konkretnego projektu. Rzeczywiste przykłady demonstracyjne wybierz po imporcie.

## Główna ścieżka

1. Opis potrzeby i działania, 30–1500 znaków.
2. Opcjonalna lokalizacja: dzielnica/obszar lub współrzędne wskazane na mapie. Bez lokalizacji wyszukiwanie nadal działa, bez odległości.
3. Maksymalnie pięć wyników, z rozdzieleniem „w okolicy” i „inspiracje z innych miejsc”.
4. Porównanie do trzech wyników: potrzeba, działanie, odbiorcy, miejsce, zakres, dostępność, koszt i źródło.
5. Do trzech pytań o luki w opisie.
6. Karta robocza do skopiowania, bez automatycznego złożenia wniosku.

## Wartość, którą pokazujemy

- Parafraza i oryginalny tytuł mogą prowadzić do tego samego istotnego wyniku.
- Zmiana miejsca zmienia ocenę bliskości, a nie prawdziwość opisu realizacji.
- Podobny cel może mieć odmienny zakres; aplikacja pomaga to zauważyć.
- Każde porównanie daje drogę do źródła.

## P0

Import rzeczywistych rekordów; jawny zakres; wyszukiwanie nazw i opisów; karty z fragmentami źródeł; wybór maksymalnie trzech; porównanie pól; pytania szablonowe zależne od braków; karta tekstowa; stany błędów; działanie bez AI. Wyszukiwanie i porównanie to jedno spójne MVP, nie osobne prototypy.

## P1

Wyszukiwanie semantyczne, fuzja rankingu, dodatkowe wyjaśnienie z walidowanymi dowodami, mapa, wygodny eksport. Jeśli brakuje czasu, priorytet ma rzeczywista poprawa trafności, a nie mapa.

## P2 i wyłączenia

Konta, historia w chmurze, integracja z formularzem zgłoszeń, ocena formalna, prognoza głosów, rekomendacja odrzucenia, automatyczny kosztorys, scraping wszystkich załączników, generowanie pełnej dokumentacji inwestycyjnej. Nie dodawaj funkcji przewidywania zwycięstwa.

## Kryteria produktu

- Użytkownik znajduje i otwiera źródło bez wyjaśnień prowadzącego.
- Brak współrzędnych nie ukrywa potencjalnie istotnego projektu.
- Brak dobrego wyniku nie daje kategorycznego „pomysł jest nowy”.
- Stare koszty są zawsze połączone z edycją i zastrzeżeniem porównywalności.
- Karta oddziela tekst użytkownika, fakty miejskie i sugestie aplikacji.

## Zakres danych a zakres prezentacji

Nie filtruj importu wyłącznie pod jeden udany przykład. Importuj rozsądny, opisany zakres. Do prezentacji wybierz trzy przypadki: parafraza, podobne działanie w innym miejscu, brak pewnego dopasowania. Jeśli zakres jest mały, nazwij go wprost. Nie reklamuj pełnego pokrycia Warszawy.

## Mierzalne hipotezy

H1: wyszukiwanie hybrydowe odnajduje istotne realizacje częściej niż bazowe tekstowe na małej, jawnej próbie. H2: wyjaśnienie pomaga użytkownikowi wskazać różnicę. H3: karta pytań pomaga znaleźć brak w opisie. Wyniki zapisujemy dopiero po testach, z mianownikiem i opisem próby.
