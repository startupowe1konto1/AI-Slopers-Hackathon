# Syreny przy blackoucie: liczby do pitchu

Wygenerowane przez `pipeline/syreny/podsumowanie.py` z paczki `public/pack/syreny`. Dane: KG PSP, SOIA 2026.05; punkty adresowe m.st. Warszawy.

## Miasto

| | Adresy ≥ 65 dB | Adresy tracące zasięg | Adresy ≥ 75 dB |
|---|---|---|---|
| Wszystkie syreny (SOIA) | 92,5% | — | 48,3% |
| Blackout, przybliżenie (syreny cyfrowe, szacunek z odległości i mocy) | 91,5% | 1 230 | 36,6% |
| Blackout, dolne oszacowanie (tylko strefy, gdzie SOIA pokazuje syrenę cyfrową) | 69,1% | 29 676 | — |

Adresów: 126 923. Blackout zakłada, że syreny analogowe nie mają zasilania awaryjnego, a cyfrowe działają.

## Jak liczymy przybliżenie

SOIA dzieli miasto według syreny dominującej, czyli najgłośniejszej w danym miejscu. Tam, gdzie dominuje syrena analogowa, SOIA nie podaje poziomu syreny cyfrowej. Dlatego „dolne oszacowanie” traktuje te miejsca tak, jakby przy blackoucie nie było tam żadnej syreny. To wariant skrajny.

Przybliżenie szacuje poziom najgłośniejszej syreny cyfrowej z odległości i mocy: L = A[moc] − 18,6·log10(d) − 3,85 dB. Spadek głośności dopasowaliśmy do rastra poziomu dźwięku SOIA w promieniu 50–600 m od syren. Poprawkę dobraliśmy tak, żeby ta sama metoda liczona dla wszystkich syren dawała tyle adresów ≥ 65 dB, co SOIA (92,5% wobec 92,5%). Metoda zgadza się z SOIA co do progu 65 dB na 95,6% adresów, a co do klasy głośności na 76,3%.

Ograniczenia:

- Metoda nie widzi budynków w konkretnym kierunku, uśrednia je.
- Pomija syreny cyfrowe z gmin sąsiednich, bo inwentaryzacja nie ma ich współrzędnych (ostrożnie: zaniża zasięg przy granicach miasta).
- Błąd metody na progu 65 dB (około 4% adresów) jest większy niż różnica między wszystkimi syrenami a samymi cyfrowymi. Liczbę adresów tracących zasięg traktujemy więc jako rząd wielkości.

Wrażliwość (poprawka ±1 dB):

| Poprawka | Adresy ≥ 65 dB przy blackoucie | Adresy tracące zasięg |
|---|---|---|
| 2,85 dB | 92,0% | 697 |
| 3,85 dB | 91,5% | 1 230 |
| 4,85 dB | 91,0% | 1 928 |

## Dzielnice

Kolejność: największy spadek udziału adresów ≥ 65 dB przy blackoucie (przybliżenie).

| Dzielnica | Adresy | ≥ 65 dB normalnie | ≥ 65 dB blackout | ≥ 65 dB blackout, dolne oszacowanie | ≥ 75 dB normalnie | ≥ 75 dB blackout |
|---|---|---|---|---|---|---|
| Wawer | 26 334 | 85,5% | 82,0% | 72,0% | 22,0% | 17,2% |
| Bemowo | 5 265 | 93,0% | 89,6% | 55,1% | 65,7% | 47,7% |
| Bielany | 5 560 | 79,7% | 78,4% | 38,5% | 56,9% | 34,0% |
| Targówek | 6 780 | 98,3% | 97,8% | 62,7% | 59,3% | 47,8% |
| Ursynów | 8 637 | 96,2% | 96,1% | 84,6% | 45,7% | 40,4% |
| Włochy | 6 502 | 96,0% | 95,9% | 82,3% | 43,7% | 37,1% |
| Białołęka | 15 724 | 89,9% | 89,9% | 78,7% | 32,4% | 27,3% |
| Praga-Południe | 6 872 | 99,7% | 99,7% | 49,4% | 81,7% | 45,2% |
| Ochota | 2 332 | 99,7% | 99,7% | 66,0% | 68,6% | 44,2% |
| Mokotów | 9 527 | 98,4% | 98,4% | 57,6% | 72,6% | 46,1% |
| Ursus | 4 050 | 99,6% | 99,6% | 80,6% | 50,7% | 45,3% |
| Rembertów | 5 365 | 95,2% | 95,2% | 93,3% | 56,9% | 56,5% |
| Praga-Północ | 1 444 | 99,9% | 99,9% | 46,0% | 85,5% | 52,6% |
| Wesoła | 6 741 | 88,8% | 88,8% | 83,4% | 28,9% | 27,6% |
| Wilanów | 6 596 | 89,7% | 89,7% | 67,6% | 33,3% | 24,8% |
| Wola | 3 728 | 99,9% | 99,9% | 48,1% | 88,2% | 60,4% |
| Śródmieście | 3 418 | 100,0% | 100,0% | 68,8% | 94,9% | 83,8% |
| Żoliborz | 2 048 | 100,0% | 100,0% | 42,8% | 93,0% | 64,0% |
