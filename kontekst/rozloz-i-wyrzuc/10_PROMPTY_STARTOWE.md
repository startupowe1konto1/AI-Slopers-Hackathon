# Polecenia do Claude Code — Rozłóż i wyrzuć

To polecenia sterujące budową aplikacji, nie gotowe prompty modelu produktu. Najpierw sprawdź granice przygotowania konkursowego z dokumentu wspólnego.

## Start

> Budujemy „Rozłóż i wyrzuć”. Przeczytaj CLAUDE.md, wspólne zasady oraz projektowe 01, 02 i 06. Sprawdź istniejące repozytorium i środowisko. Ustal, czy można rozpocząć implementację konkursową. Kod twórz w app/. Zacznij od R00–R04: rzeczywiste odpowiedzi WASTE i TYPES, ustalenie relacji, raport DATA_DISCOVERY i mały, jawny zakres. Nie wymyślaj pól API, instrukcji segregacji ani zgód organizatora. Brak tokenu nie blokuje niezależnych części UI, ale nie oznacza ukończonej integracji.

## Przepływ bez AI

> Zbuduj tekstowe wyszukiwanie, potwierdzenie przedmiotu, silnik reguł TRUE/FALSE/UNKNOWN, wyłączenia i maksymalnie dwa przejrzane pytania. Każda reguła ma dowód i przegląd człowieka. Doprowadź do prawdziwego wyniku ze źródłem, zanim dodasz zdjęcia. Testuj brak cechy, negację, konflikt i zmianę odpowiedzi. Zapisz stan i dowody wykonania w PROGRESS.md.

## Eko punkty

> Sprawdź dokumentację i rzeczywisty endpoint ECO, bez zgadywania URL. Zaimportuj dane, zweryfikuj mapowanie kategorii i dopiero po zgodności sortuj punkty po odległości. Nie zakładaj przyjmowania wszystkich odpadów specjalnych. Nieparsowalne godziny pokaż jako opis. Jeśli nie ma dowodu przyjmowania, wyłącz rekomendację i jawnie opisz ograniczenie.

## Zdjęcia P1

> Sprawdź, czy tekstowe P0 jest gotowe i zostało wystarczająco czasu. Jeśli tak, dodaj pojedynczy obraz jako źródło hipotezy nazwy, bez porad segregacji modelu. Wymagaj potwierdzenia rozpoznania, limitów obrazu i wyraźnej informacji o wysłaniu do wybranego dostawcy. Użyj tylko skonfigurowanego, autoryzowanego dostępu. Brak klucza lub nieznane warunki przetwarzania oznaczają pozostawienie tekstu. Nie zapisuj zdjęć ani base64 w logach.

## Po przerwaniu

> Przeczytaj CLAUDE.md oraz app/work/PROGRESS.md, DECISIONS.md i DATA_DISCOVERY.md. Sprawdź aktywny snapshot, wersję reguł i ostatni działający przepływ. Nie zaczynaj od nowa. Wybierz następne zadanie ścieżki krytycznej i ukończ je z celową weryfikacją.

## Odbiór

> Zamroź rozszerzenia i wykonaj 07_TESTY_I_ODBIOR.md. Napraw błędne kategoryczne zalecenia, niezgodne punkty, wycieki i crash. Zapisz prawdziwe wyniki, zakres i ograniczenia. Przygotuj README, DATA_SOURCES, AI_USAGE i VALIDATION oraz pitch pokazujący rzeczywiste pytanie zmieniające decyzję. Nie deklaruj wpływu środowiskowego, którego nie zmierzono. Nie publikuj i nie wysyłaj materiałów bez autoryzacji. Podsumuj działanie, uruchomienie, testy i pozostałe braki.
