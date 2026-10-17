# Prezentacja pitchu (HTML)

Dziesięć slajdów według [scenariusza](../scenariusz.md). Jeden plik `index.html` z danymi w `dane.js`.

## Jak otworzyć

Najprościej przez lokalny serwer (wtedy działa też aplikacja w telefonie na slajdzie 8):

```bash
python -m http.server 8765 --directory docs/pitch/prezentacja
```

Potem w przeglądarce: http://127.0.0.1:8765/

Sam plik `index.html` otwarty z dysku też działa. Font Archivo pobiera się z Google Fonts. Bez internetu prezentacja przechodzi na font systemowy.

## Sterowanie

| Klawisz | Działanie |
|---|---|
| → spacja PageDown | następny krok lub slajd (działa z pilotem) |
| ← PageUp | wstecz |
| F | pełny ekran |
| N | notatki prezentera (tekst ze scenariusza) |
| O | telefon na slajdzie 8: przełącz online/offline |

Kroki na slajdach:
- **3:** jedno naciśnięcie przewraca domino.
- **4:** jedno naciśnięcie wyłącza prąd (mapa gaśnie, głośna syrena 75 dB i więcej: 48,3% → 36,6% adresów; kształt mapy to najgorszy wariant).
- **8:** pięć kroków demo (lokalizacja, karta Syreny, karta miejsca schronienia, pozostałe karty, brak sieci), a szóste naciśnięcie wyłącza sieć w telefonie.

Adres slajdu jest w pasku adresu (`#4.1` to slajd 4, krok 1), więc po odświeżeniu wracamy w to samo miejsce.

## Telefon na slajdzie 8

W ramce działa prawdziwa aplikacja: `https://warszawa-kryzys.startupaplikujmy.workers.dev/`. Inny adres podaje się w parametrze, np. `?app=http://localhost:5173/`.

Adresów Kasi nie da się wpisać do telefonu z prezentacji automatycznie. Aplikacja jest w ramce z innej domeny, a przeglądarka nie pozwala stronie zapisywać danych (IndexedDB) w ramce z innej domeny. Dlatego adresy wpisujemy raz, ręcznie, przed pitchem:

1. Otwórz prezentację z `?edycja=1`, np. http://127.0.0.1:8765/?edycja=1#8.0. Na slajdzie 8 pojawi się czarna ramka z instrukcją i adresami. Prezentacja nie zabiera wtedy fokusu z telefonu, więc da się wpisywać.
2. W telefonie wpisz adresy Kasi (wyszukiwanie po ulicy) i zapisz:

   | Rola | Adres |
   |---|---|
   | dom | ul. Powstańców Śląskich 10, Bemowo |
   | praca | rondo Ignacego Daszyńskiego 1, Wola |
   | bliska osoba | ul. Grochowska 200, Praga-Południe |

   Najpierw dom: bez niego przycisk „Zapisz” jest nieaktywny. Bez domu i pracy karta Dotarcie do bliskich jest szara.
3. Pobierz paczkę offline w telefonie, a potem przeładuj ramkę raz z siecią (np. odśwież prezentację z `?edycja=1`). To obejście znanego błędu: przy pierwszym wejściu plik adresów nie zapisuje się w paczce i bez sieci karta Syreny jest szara. Sprawdź z wyłączonym Wi-Fi, że karta Syreny jest zielona.
4. Otwórz prezentację jeszcze raz pod tym samym adresem, ale bez `?edycja=1`. Po kliknięciu w telefon fokus wraca do prezentacji po 3 s, więc pilot dalej działa.

Przeglądarka zapamiętuje dane ramki osobno dla każdego adresu prezentacji. Na pitchu otwieraj ją zawsze tak samo (ten sam laptop, ta sama przeglądarka, ten sam adres, np. http://127.0.0.1:8765/). Adresy wpisane w zwykłej karcie aplikacji nie pojawią się w telefonie na slajdzie, i odwrotnie.

Jeśli telefon nie zadziała na sali: zrzuty ekranu aplikacji są w `docs/pitch/zrzuty/`, a druga karta z `?offline=1` to zapas.

## Dane wykresów

`dane.js` generuje skrypt z plików w repozytorium (SOIA, punkty adresowe, JTBD):

```bash
python -I docs/pitch/prezentacja/build_dane.py
```

Połączenia zadań z danymi na slajdzie 6 są ułożone ręcznie w `build_dane.py` (słownik `ZADANIA`) na podstawie kolumny „Dane” w `kontekst/jtbd-kryzys-warszawa.md`. Zadanie 1 przestawiono na SOIA, a zadanie 2 na dane PSP, bo analiza JTBD powstała przed pozyskaniem obu źródeł.
