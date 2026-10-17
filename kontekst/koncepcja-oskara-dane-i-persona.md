# Koncepcja aplikacji obronnej (online i offline): dane, persona, JTBD

Źródło koncepcji: transkrypcja rozmowy zespołu (Oskar). Fakty o danych sprawdzone na żywo 17.10 około 12:25.

## Koncepcja w skrócie

Mapa działająca w dwóch trybach.

- **Offline** (paczka danych odświeżana raz albo kilka razy dziennie):
  - AED, schrony, punkty medyczne, apteki;
  - trasa piesza do najbliższego bezpiecznego miejsca;
  - scenariusze transportu: przy braku prądu stają tramwaje i metro, jeżdżą autobusy;
  - rower jako sposób na ucieczkę z korków.
- **Online** (warstwa dodatkowa, gdy działa sieć):
  - dym i strefy pożaru;
  - opóźnienia: co jeździ, a co nie;
  - omijanie zdarzeń na trasie do schronu;
  - wykrywanie obszarów, które ucichły (zanik danych na żywo);
  - powiadomienia lokalne.
- **Narracja:** problemy Kijowa nałożone na infrastrukturę Warszawy. Warszawa ma mniejsze i płytsze metro niż Kijów, więc byłaby w gorszej sytuacji.

## Weryfikacja trzech punktów z poprzedniej rundy

1. **Ile pojazdów ZTM nadaje jednocześnie.** Sprawdzone przez kopię feedu ZTM udostępnianą przez mkuran.pl (nie wymaga klucza): 1028 pojazdów w sobotę o 12:24. Z numerów linii wynika podział na około 799 autobusów i 229 tramwajów. Mediana wieku sygnału wynosi 7 s, 90. percentyl 17 s.
   - W siatce 1 km zajętych jest 363 kwadratów, ale tylko 130 ma co najmniej 3 pojazdy, a 69 co najmniej 5.
   - Wniosek: wykrywanie ciszy działa w skali 1–2 km w gęstej części miasta, z opóźnieniem około 1–2 minut. Na peryferiach i w nocy jest słabe. W dzień powszedni pojazdów jest pewnie więcej, co trzeba sprawdzić.
2. **Pojemność taboru: TAK.** Zbiór „Pojazdy” zawiera `markiTramwaje` (i analogicznie marki autobusów, metra i kolei) z polami `liczMiejscTab`, `liczMiejscSiedzacychTab`, `liczMiejscStojacychTab`. Przykład: Konstal 105N ma 125 miejsc. Pojazdy łączą się z markami przez `idMarki`.
   - Każdy pojazd ma też `nazwaZajezdni` i `trakcja` (Bus, Tram, Metro, Kolej), co przyda się do odfiltrowania zjazdów do zajezdni.
3. **Stacje pomiarowe.**
   - Powietrze: GIOŚ ma 10 stacji w Warszawie (API bez klucza). API miasta zwraca też stacje własne miasta (np. „Warszawa-Grochowska”, właściciel Urząd m.st. Warszawy). Łączna liczba stacji w API miasta jest do sprawdzenia kluczem.
   - Pogoda ZOM: liczba stacji też do sprawdzenia kluczem.

## Rowery i hulajnogi

- **Veturilo (GBFS, bez klucza):** `gbfs.nextbike.net/maps/gbfs/v2/nextbike_vw`. W chwili sprawdzenia 349 stacji i 3198 dostępnych rowerów, odświeżanie co 60 s. To nie jest portal miasta, więc warstwa jest dodatkowa.
- **Dane miejskie w WFS:** `STACJE_ROWEROWE` i `TRASY_ROWEROWE`. Mogą działać offline.
- **Hulajnogi:** nie znalazłem publicznego feedu dla Warszawy. Dott i Lime zwracają 404. Bolt ma publiczne GBFS dla innych miast (np. Bruksela, id 336), dla Warszawy niepotwierdzone.
- **Liczniki rowerowe ZDM:** istnieją, ale znalazłem tylko raporty PDF, bez API.

## Funkcje koncepcji a dostępne dane

| Funkcja | Dane | Status |
|---|---|---|
| AED (offline) | portal: Lokalizacja defibrylatorów | ✅ dane miasta (klucz) |
| Schrony (offline) | brak w otwartych danych miasta. Ratusz podaje ponad 200 schronów, około 1300 ukryć i ponad 16 tys. miejsc doraźnego schronienia, ale nie ma ich jako zbioru danych. Baza gdziesieukryc.pl nie ma otwartego eksportu. | ❌, luka w danych |
| Namiastka schronów | WFS `METRO_WEJSCIA`; portal: parkingi z `levels` (czy podziemne, do sprawdzenia); OSM: przejścia podziemne | ⚠️ częściowo |
| Apteki (offline) | WFS `APTEKI` | ✅ |
| Szpitale, SOR, przychodnie | brak warstwy w WFS miasta. Źródła zewnętrzne: RPWDL (rejestr podmiotów leczniczych), OSM | ❌ w danych miasta |
| Wyszukiwanie adresu bez GPS | WFS `PUNKTY_ADRESOWE_WGS84`, `ULICE_WGS84` | ✅ |
| Trasa piesza i rowerowa offline | sieć dróg z OSM i WFS `TRASY_ROWEROWE` | ⚠️ graf z OSM |
| Scenariusz blackoutu (tramwaje i metro stają) | portal: przystanki, linie na przystanku, odjazdy; pozycje (`typ` 2 = tramwaj); Pojazdy (trakcja, pojemność). Metro: rozkład w GTFS (mkuran, nieoficjalny), wejścia z WFS | ✅ autobusy i tramwaje; metro tylko rozkładowo |
| Co jeździ, opóźnienia (online) | pozycje ZTM co 10 s porównane z rozkładem | ✅ |
| Zablokowane drogi (online) | portal: utrudnienia z geometrią, co 1 min | ✅ |
| Dym i strefa (online) | portal: pogoda ZOM (`kier_wiatru`, `pred_wiatru`), powietrze (PM2.5, PM10, NO2, CO); GIOŚ | ✅, ale stacji jest mało |
| Miejsce pożaru | brak takiego zbioru. Pośrednio: tekst utrudnień (czy wspominają pożar, do sprawdzenia), skok PM2.5 lub CO na stacji | ⚠️ |
| Wykrywanie ciszy (online) | pozycje ZTM (`Time`), parkingi (1 min), stacje powietrza i pogody (10 min); zajezdnie z Pojazdów | ✅, rozdzielczość 1–2 km w centrum |
| Alert „szybszy niż RCB” | brak danych o atakach. Alerty i syreny to RCB, RSO i wojewoda | ❌, nie udawać |
| Rowery na żywo | Veturilo GBFS | ✅ (zewnętrzne) |
| Osoby wymagające pomocy | WFS `DOMY_POMOCY_SPOLECZNEJ`, `KLUBY_SENIORA`, `INNE_POMOC_SPOLECZNA` | ✅ |
| Toalety i higiena (blackout) | portal: Toalety | ✅ |
| Miejsca spotkań (plan rodzinny z poradnika) | WFS `PLACE_SKWERY_WGS84` | ✅ |

## Klient i użytkownik

### Klient instytucjonalny (kto wdraża i płaci)

Miasto: Stołeczne Centrum Bezpieczeństwa i biuro zarządzania kryzysowego Urzędu m.st. Warszawy, razem z ZTM.

Ich zadania do wykonania (JTBD):
- w pierwszych minutach wiedzieć, gdzie coś się dzieje;
- szybko zaplanować komunikację zastępczą;
- przekazać mieszkańcom wskazówki dla konkretnego miejsca, a nie ogólnokrajowe.

Ten sam klient zyskuje mapę luk w danych: brak otwartej listy schronień i brak warstwy szpitali.

### Persona: Kasia, 34 lata (użytkownik końcowy)

- Mieszka na Bemowie, w 10-piętrowym bloku.
- Pracuje w biurze przy rondzie Daszyńskiego. Dojeżdża tramwajem i metrem M2.
- Syn (5 lat) chodzi do przedszkola na Bemowie.
- Mama (72 lata) mieszka sama na 4. piętrze na Grochowie.
- Ma smartfona. Poradnik dostała, ale leży w szufladzie.

**Scenariusz:** dzień powszedni, 14:10, alarm. Dron uderza w podstację na Woli, część miasta traci prąd, sieć komórkowa działa z przerwami.

| Moment | JTBD: „Kiedy…, chcę…, żeby…” | Dane | Tryb |
|---|---|---|---|
| Alarm, 0–10 min | Kiedy wyje syrena w biurze, chcę wiedzieć, gdzie najbliżej się schronić, nawet bez internetu, żeby zdążyć w kilka minut | wejścia do metra (WFS), parkingi podziemne (portal); brak listy schronów miasta | offline |
| Po uderzeniu | Kiedy słyszę wybuch i widzę dym, chcę wiedzieć, czy dym idzie w moją stronę, żeby zdecydować: zostać i zamknąć okna czy wyjść | wiatr ZOM, stacje powietrza | online |
| Po uderzeniu | Kiedy trasa do schronu prowadzi obok miejsca zdarzenia, chcę dostać inną trasę, żeby nie iść w zagrożenie | utrudnienia, wykrywanie ciszy | online |
| Pierwsza godzina | Kiedy tramwaje i metro stoją, chcę wiedzieć, jak dostać się do przedszkola syna, żeby go odebrać | pozycje ZTM (co jeździ), przystanki, Veturilo, trasy rowerowe | online i offline |
| Pierwsza godzina | Kiedy mama nie odbiera, chcę wiedzieć, czy na Grochowie coś się dzieje i gdzie jest najbliższa pomoc, żeby zdecydować, czy jechać | wykrywanie ciszy (dla miasta), AED, apteki, ośrodki pomocy społecznej | online i offline |
| Plotki | Kiedy na grupie piszą „mosty zamknięte”, chcę to sprawdzić w danych, żeby nie panikować | utrudnienia i pozycje ZTM na mostach | online |
| Blackout przez kilka dni | Kiedy nie ma prądu ani wody, chcę wiedzieć, gdzie jest toaleta, apteka i AED, żeby przetrwać | toalety, apteki, AED | offline |
| Przed kryzysem | Kiedy czytam poradnik, chcę ułożyć plan rodzinny z konkretnymi miejscami spotkań, żeby nie szukać ich w panice | place i skwery (WFS), plan z poradnika | offline |

## Ograniczenia, które trzeba powiedzieć wprost

- Nie mamy otwartych danych o schronach ani szpitalach. To luka i jednocześnie argument w pitchu.
- Nie możemy wysyłać alarmów o atakach. To rola RCB i RSO.
- Wykrywanie ciszy wskazuje, że w obszarze coś przestało działać, a nie „uderzenie drona”. Publikowanie miejsc uderzeń w czasie rzeczywistym jest ryzykowne (ocena skutków ataku przez przeciwnika). Lepiej, żeby szczegóły widziało miasto, a mieszkańcy dostawali tylko status usług w okolicy.
