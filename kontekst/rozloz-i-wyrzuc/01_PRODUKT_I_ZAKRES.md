# Produkt i zakres — Rozłóż i wyrzuć

## Problem i obietnica

Mieszkaniec nie zawsze zna nazwę odpadu i istotne cechy przedmiotu. Sama wyszukiwarka nazw może nie wystarczyć. Produkt zamienia potoczny opis w rozpoznanie, zadaje potrzebne pytanie i pokazuje zalecenie wynikające z miejskiego źródła.

Obietnica: „Opisz przedmiot. Ustalimy, czego brakuje do odpowiedzi, i pokażemy, co zrobić według warszawskich zasad”. To produkt do decyzji, nie chatbot do swobodnej rozmowy.

## Odbiorca

Mieszkaniec przy domowych pojemnikach, jedna rzecz i krótka interakcja. P0 to przeglądarka mobilna, bez instalacji i konta. Drugi odbiorca, edukator lub wspólnota mieszkaniowa, może wykorzystać ten sam przepływ po konkursie.

## Wyróżnik

Istnieje miejska usługa Segreguj na 5, z której pochodzą dane. Przewagą ma być obsługa niepewności: system potrafi odróżnić rozpoznanie przedmiotu od rozstrzygnięcia jego właściwości. Pytanie pojawia się, gdy odpowiedź wpływa na zweryfikowane zalecenie. Źródło pozostaje dostępne przy wyniku.

## Główna ścieżka

Opis lub zdjęcie → potwierdzenie nazwy → wyszukanie kandydatów reguł → pytanie o brakującą cechę → instrukcja → ewentualnie zgodny punkt odbioru.

Maksymalnie dwa pytania w P0. Jeśli po nich nie można odpowiedzieć, jawnie pokaż brak pewnego rozstrzygnięcia. Użytkownik może poprawić rozpoznanie, wrócić do odpowiedzi lub wybrać „nie wiem”.

## Scenariusze

Wybierz 12–15 scenariuszy dopiero po imporcie. Zestaw obejmuje: proste dopasowanie nazwy, synonim, dwie podobne nazwy, przypadek wymagający cechy zmieniającej decyzję, negację, przedmiot z częściami jeśli źródła to uzasadniają, kategorię specjalnego odbioru, brak informacji, konflikt i nieznany przedmiot. Konkretne zalecenia muszą wynikać z danych, nie z tej listy.

Nie obiecuj rozpoznania dowolnej rzeczy. Widoczna etykieta „Prototyp: obsługiwany zakres” linkuje do jawnej listy. Poza zakresem nie wybieraj „najbliższej” reguły tylko po to, żeby zawsze podać odpowiedź.

## P0

Tekstowe wejście; pobrane miejskie dane; wyszukiwanie nazw/synonimów; potwierdzenie rozpoznania; zweryfikowane warunki i wyłączenia; do dwóch pytań; wynik i źródło; stany unknown/conflict; lista zgodnych punktów dla potwierdzonych kategorii; data i zakres; obsługa bez modelu.

## P1

Zdjęcie pojedynczego przedmiotu; mapa eko punktów; wiele elementów w jednym wyniku wyłącznie w zweryfikowanych przypadkach; dodatkowe synonimy i obsługiwane scenariusze. Zdjęcie ma sens tylko wtedy, gdy nie pogarsza jakości i nie blokuje czasu odpowiedzi.

## P2 i wyłączenia

Wiele przedmiotów w jednym zdjęciu, wykrywanie materiału ze stuprocentową pewnością, AR, konta, historia, grywalizacja, ślad węglowy, prognoza odzysku, harmonogram odbioru śmieci, rezerwacja wizyty, automatyczne zgłoszenia. Nie dodawaj generatywnych porad demontażu ani postępowania z niebezpieczną substancją.

## Sukces produktu

Użytkownik rozumie rozpoznanie i może je poprawić. Pytanie ma powód w źródle. Wynik rozróżnia instrukcję, warunek i niepewność. Punkt odbioru jest zgodny z kategorią. Brak informacji nie jest zastępowany uniwersalnym pojemnikiem. Źródło można otworzyć jednym działaniem.

## Hipotezy do sprawdzenia

H1: potoczny opis i pytanie pomagają rozwiązać zadanie, gdy użytkownik nie zna nazwy katalogowej. H2: pytania ograniczają błędne zalecenia względem wersji odpowiadającej od razu. H3: użytkownik rozumie różnicę między nieznanym materiałem a rozpoznanym przedmiotem. Nie wpisuj procentów poprawy przed testem.
