# Ryzyka, decyzje i rozwój — Zanim zgłosisz

| Ryzyko | Sygnał | Działanie | Właściciel |
|---|---|---|---|
| Brak tokenu | 401/403 | Lokalna konfiguracja przez uczestnika; praca nad niezależnym UI, bez udawania integracji | Dane |
| Mało opisów | Raport jakości | Mniejszy, jawny zakres; porównanie pól zamiast AI | Dane/produkt |
| Brak geometrii | Dużo rekordów bez punktów | Tekst i obszary, mapa poza P0 | Produkt |
| Złe statusy | Kod bez słownika | Unknown i link do źródła | Dane |
| Fałszywe podobieństwo | Testy negatywne | Słabsze oznaczenie, próg roboczy, człowiek w decyzji | Wyszukiwanie |
| Przeciążone AI | Timeout/koszt | Wyjaśnienie szablonowe | Backend |
| Mylące koszty | Różny zakres i rok | Bez wyceny, brak agregacji nieporównywalnych kwot | Produkt |
| Nadmierny zakres | Brak end-to-end o 16 | Wycięcie mapy, eksportu, generacji | Lider |
| Hosting niegotowy | Trwały dysk niedostępny | Lokalne demo, nie migracja w ostatniej godzinie | Backend |

## Decyzja go/no-go po pierwszych dwóch godzinach

GO: istnieją dostępne, użyteczne realizacje z opisem i źródłem oraz co najmniej kilka sensownych porównań. Lokalizacja może pozostać ograniczona.

GO w wariancie węższym: dane pozwalają tylko na część edycji/obszarów. Zawęź produkt i komunikat, nie twórz pozornego pokrycia.

NO-GO dla obietnicy konkursowej: brak realnych danych z portalu i brak dopuszczonej kopii. Fixture pozwala rozwijać oprogramowanie, ale nie spełnia wymogu wykorzystania zbioru. Zgłoś problem uczestnikowi i poproś mentora o wskazanie dostępu; nie zastępuj BO innym produktem po cichu.

## Pytania do mentorów

Eksperci danych: zakres edycji, statusy, semantyka kosztu, stabilność ID, limity. Partycypacja: czy mieszkaniec rzeczywiście potrzebuje porównania, jaki wynik jest pomocny i czego nie wolno sugerować. Urbanistyka: lokalizacja a obszar oddziaływania. Technologia: czy hybryda daje mierzalną wartość. Komunikacja: czy odbiorca rozumie różnicę między inspiracją a potencjalnym pokryciem.

## Pilotaż po konkursie

Propozycja 2 tygodni w jednym obszarze, po uzgodnieniu partnera. 6–10 osób przygotowujących pomysły, jedna osoba wspierająca proces. Porównaj czas i jakość znajdowania istotnych realizacji przy podobnych zadaniach, zmieniając kolejność narzędzi między uczestnikami. Nie zapisuj danych osobowych bez potrzeby.

Miary: czas do pierwszego istotnego źródła, poprawność wskazanej różnicy, przydatność pytań, fałszywe mocne dopasowania. Kryteria sukcesu ustal przed pilotażem z partnerem. Nie deklaruj redukcji wydatków miasta na podstawie podobieństwa opisów.

## Rozwój po P0

Najpierw lepszy zakres i jakość danych, następnie testy wyszukiwania, dopiero integracje z procesem zgłoszeń. Osobno rozważyć aktualizację przyrostową, raport zmian, dostępność cyfrową i skalowanie. Formalna ocena wniosku pozostaje osobnym procesem i nie powinna być automatycznie wyprowadzana z tego prototypu.
