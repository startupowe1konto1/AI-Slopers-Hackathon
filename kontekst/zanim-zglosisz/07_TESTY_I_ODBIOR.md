# Testy i odbiór — Zanim zgłosisz

## Próba jakościowa

Podczas wydarzenia utwórz 20 zapytań: 6 parafraz realnych projektów, 4 podobne działania w innych miejscach, 4 podobne słowa o innym znaczeniu, 3 zapytania bez mocnego odpowiednika, 3 przypadki niepełnego opisu/lokalizacji. Przykłady mogą się zmienić po imporcie. Rozdziel 12 roboczych i 8 odłożonych do końca. Oznaczenia trafności sporządza człowiek, nie model oceniający własne wyniki.

Każdy przypadek: caseId, zapytanie, miejsce, właściwe/akceptowalne projectIds, wykluczone wyniki i powód, oczekiwany stan. Nie wybieraj wyłącznie łatwych zapytań z dokładnym tytułem.

## Metryki

- Hit@5: udział zapytań z co najmniej jednym oznaczonym istotnym wynikiem w top 5, tylko wśród zapytań mających taki wynik w zbiorze.
- Dla jawnie wskazanego zestawu istotnych wyników można osobno policzyć recall@5; nie nazywaj Hit@5 pełnym recall.
- Fałszywe mocne dopasowania w przypadkach negatywnych.
- Poprawność cytowanych dowodów i sensu przypisania, oceniana ręcznie.
- Opóźnienie na laptopie z liczbą pomiarów, trybem i rozmiarem indeksu.

Nie wpisuj docelowej skuteczności jako osiągniętej. Każdy procent ma mianownik. Osiem odłożonych przypadków to demonstracja jakości, nie reprezentatywny benchmark miasta.

## Testy jednostkowe o wysokiej wartości

1. Null i puste pola nie stają się zerową kwotą ani znanym statusem.
2. Edycja nie jest wyznaczana z daty zgłoszenia.
3. Multi-pin wybiera najbliższy poprawny punkt.
4. Błędne/odwrócone współrzędne nie są cicho naprawiane.
5. Brak geometrii nie daje odległości 0.
6. Nieznany kod statusu pozostaje unknown.
7. Wyszukiwanie nie wybucha na znakach składni FTS, polskich znakach i długim tekście.
8. Łączenie rankingów nie miesza surowych skal score i ma stabilne remisy.
9. EvidenceId innego projektu jest odrzucane.
10. Model zmyślający URL, kwotę lub pole nie przejmuje wyniku domenowego.

## Integracyjne

Import próbki → walidacja → manifest → wyszukanie → detail → porównanie. Powtórzenie importu nie dubluje rekordów. Błędny nowy snapshot nie niszczy aktywnego. Zmiana snapshotu unieważnia nieaktualne identyfikatory porównania. Test błędu HTTP, nie-JSON i timeoutu wykorzystuje stub transportu, nie obciąża API miejskiego.

## E2E — minimum

- Wpisanie pomysłu, wyniki na rzeczywistym snapshocie, otwarcie źródła.
- Wybór 3 projektów, próba wyboru czwartego, porównanie i skopiowanie karty.
- Zmiana lokalizacji, jawna zmiana bliskości bez zmiany faktów projektu.
- Brak mocnego dopasowania z prawidłowym komunikatem.
- AI wyłączone i timeout AI: przepływ kończy się kartą.
- Brak aktywnego zbioru: wyraźny błąd, nie „brak projektów”.

## Kontrola ręczna

Telefon 360 px, laptop, klawiatura, widoczny fokus, powiększenie 200%, długie tytuły, źródła i daty. Dwie osoby spoza implementacji wykonują zadanie bez prowadzenia. Zapisz obserwacje, nie twórz statystyk populacyjnych.

## Odbiór techniczny

W przyszłym repo uruchom po zaimplementowaniu skryptów: typecheck, lint, test, test:e2e, build, start produkcyjny. Raport zawiera wersję kodu/snapshotu, datę, polecenie, wynik i ograniczenie. Przegląd sekretów obejmuje repo i wygenerowany frontend. Nie publikuj pełnych logów środowiska.

Blokery oddania: błędne źródła, crash ścieżki głównej, ujawniony token, zmyślone dane, brak realnego zbioru. Drobne ograniczenie mapy lub brak eksportu nie blokuje P0, jeśli jest opisane.
