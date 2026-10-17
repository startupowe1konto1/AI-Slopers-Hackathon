# Ryzyka i pilotaż — Rozłóż i wyrzuć

| Ryzyko | Objaw | Reakcja |
|---|---|---|
| Nieznany JSON WASTE | Nie da się połączyć reguły i typu | Odkrycie na próbce, konsultacja; bez zgadywanego parsera |
| Zbyt ogólna instrukcja | Brak dowodu warunku | Wyłącz scenariusz lub zwróć unknown |
| Model myli materiał | Nazwa przedmiotu poprawna, skład nieznany | Potwierdzenie cechy przez użytkownika |
| Ignorowanie wyjątku | Test negatywny daje READY | Blokada reguły, poprawa i ponowny przegląd |
| Błędne przyjmowanie | Kategoria ECO nie potwierdza przedmiotu | Brak rekomendacji lub możliwość do potwierdzenia |
| Niejasne godziny | Opis nie daje się sparsować | Pokaż tekst i datę, bez „otwarte teraz” |
| Obraz opóźnia P0 | Brak tekstowego przepływu o 16 | Usuń wizję z zakresu konkursowego |
| Mała przewaga | Produkt tylko wyszukuje nazwę | Skup demo na rzeczywistym pytaniu i zmianie decyzji |
| Brak danych | Nie ma miejskiego snapshotu | Jawny prototyp techniczny, konsultacja dostępu; brak deklaracji spełnienia integracji |

## Go/no-go o 13:00

GO: są wiarygodne miejskie instrukcje i przynajmniej jeden scenariusz, w którym potwierdzona cecha zmienia odpowiedź. Da się zbudować szerszy, jawny zakres prostych i trudnych przypadków.

GO węższe: mniej kategorii, tekst zamiast zdjęć, brak eko punktów. Nadal musi istnieć wyraźna wartość pytania i źródła.

NO-GO dla obietnicy asystenta decyzji: brak jednoznacznych instrukcji albo przeważające sprzeczności. Można kontynuować technicznie, ale nie wydawać porad wymyślonych przez model. Poinformuj uczestnika i skonsultuj dane z mentorem.

## Pytania do mentorów

Eksperci danych: relacja TYPES/WASTE, identyfikatory kategorii, źródło wyjątków, aktualizacja, kategorie ECO. Technologia: czy granica między rozpoznaniem a regułą jest właściwa. Komunikacja: czy użytkownik rozumie pytanie i ograniczenie. Dostępność: czy nazwy i warunki są wystarczająco jasne bez kolorów i zdjęcia.

## Pilotaż po konkursie

Propozycja: 8–12 mieszkańców, zestaw kilkunastu rzeczy/ opisów i potwierdzony wzorzec odpowiedzi. Każdy wykonuje porównywalne zadania w prototypie i dostępnej wyszukiwarce; zmieniaj kolejność narzędzi, żeby ograniczyć uczenie. Nie używaj niebezpiecznych odpadów do fizycznych eksperymentów. Osobno badaj jakość automatycznej decyzji i wygodę interfejsu.

Miary: poprawność instrukcji, błędne kategoryczne odpowiedzi, czas, liczba pytań, zrozumienie warunku, znalezienie źródła. Wniosek może dotyczyć wygody lub poprawności zadań, nie masy recyklingu ani statystyk mieszkańców miasta.

## Dalszy rozwój

Najpierw rozszerzanie przejrzanych reguł i kontrola zmian danych, potem zdjęcia oraz kategorie punktów. Dopiero po walidacji rozważ produkcyjne utrzymanie, odpowiedzialność za aktualizacje i monitoring zgłoszonych błędów. Publiczny produkt wymaga kontroli prywatności i dostępności adekwatnej do wdrożenia; hackathonowy prototyp nie jest takim audytem.
