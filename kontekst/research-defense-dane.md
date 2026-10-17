# Obronność: poradnik, pola API i trzy kierunki

## Pola API potwierdzone w dokumentacji portalu

Dokumentacja jest dostępna bez klucza, ale wartości trzeba jeszcze sprawdzić na prawdziwych odpowiedziach z kluczem.

- **Pogoda (`zom_pogoda`, stacje ZOM, co 10 min):** `lokalizacja`, `lat`, `lon`, `czas`, `temp_pow`, `temp_naw`, `wilg_pow`, `pred_wiatru`, **`kier_wiatru`**, `int_opadu`. Kierunek i prędkość wiatru są w danych.
- **Jakość powietrza (`bopipk_monitoring_jakosci_powietrza`, co 10 min):** stacje z `lat`/`lon`, `data_source`, `owner`, adresem, indeksem `ijp`. W `data[]` są parametry, w przykładzie PM10, PM2.5, NO2 i CO, z czasem pomiaru. Liczba stacji jest do ustalenia.
- **Pozycje pojazdów ZTM (co 10 s):** `Lat`, `Lon`, **`Time`** (czas wysłania sygnału GPS), `Lines`, `Brigade`, `VehicleNumber`. Parametr `typ`: 1 to autobus, 2 to tramwaj. Metra nie ma.
- **Pojazdy transportu publicznego:** tabor autobusowy, tramwajowy, metra i kolei oraz marki pojazdów. Czy jest tam pojemność, trzeba sprawdzić.
- **Utrudnienia (co 1 min):** `start_date`, `end_date`, `content`, `id` (wpis w infoulice), `geo` (linia albo punkt).
- **Parkingi (co 1 min):** położenie, poziomy, wolne miejsca (`free_places_total`).
- **Toalety:** GeoJSON (`geometry`, `properties`).

## „Poradnik bezpieczeństwa” (MON, MSWiA, RCB, nr publikacji 1/2025, 54 strony)

Spis treści:
- **Przygotowanie:** przygotuj siebie i najbliższych; osoby potrzebujące szczególnej pomocy; zwierzęta; przygotuj otoczenie (transport, dom, szkoła, praca); zapasy na minimum 3 dni.
- **Reagowanie:** sygnały alarmowe i komunikaty; ewakuacja i plecak ewakuacyjny; bezpieczeństwo w tłumie; schronienia; pożar; powódź; długotrwały brak prądu (blackout); atak z powietrza; zagrożenia CBRN; niepokojące zachowania; zagrożenia terrorystyczne; zagrożenia cyfrowe (dezinformacja, cyberprzestępczość); pierwsza pomoc; higiena w kryzysie.
- **Plan na kryzys:** kontakty, miejsca spotkań (w okolicy i poza miastem), choroby i leki, ważne telefony.

Najważniejsze cytaty i wskazówki:
- Transport: „Miej przy sobie papierową mapę lub atlas samochodowy. Możesz wcześniej pobrać mapy offline. System GPS może nie działać”. Poradnik zaleca też ograniczyć jazdę samochodem, bo drogi mają być wolne dla służb.
- Blackout: brak prądu może trwać kilka dni. Oznacza brak wody, ogrzewania, internetu, telefonu i płatności kartą.
- CBRN: zamknąć i uszczelnić okna, drzwi i wentylację, wyłączyć klimatyzację, opuścić strefę zagrożenia.
- Pożar: nie otwierać okien ani drzwi, chronić drogi oddechowe.
- Dezinformacja: nie publikować lokalizacji wojska ani zdjęć ważnych obiektów (mostów, stacji, magazynów); korzystać z oficjalnych źródeł.
- Pierwsza pomoc: poradnik wprost zaleca aplikację pokazującą AED w okolicy.
- Schronienia: lokalizacje są w urzędzie gminy, w PSP i na gov.pl/kgpsp, czyli poza danymi miasta.
- Alarmy: syreny, RSO, Alert RCB, czyli też poza danymi miasta.

## Kijów: dane o transporcie

- Nie znalazłem otwartego zbioru czasów przejazdu ani danych GPS komunikacji kijowskiej z okresu wojny.
- Jest artykuł naukowy oparty na danych TomTom o zmianach zatłoczenia w Kijowie i Lwowie w pierwszych tygodniach inwazji: [LPNU](https://science.lpnu.ua/node/36664), [DOAJ](https://doaj.org/article/73b0cb4483404500b3f9a6430202afec).
- Podczas alarmów metro zatrzymuje się na odcinkach naziemnych, a autobusy i tramwaje stają przy schronach. Bywa kilkanaście alarmów dziennie. Źródła są w `research-kijow.md`.
- Wniosek: nie wytrenujemy modelu na danych z Kijowa. Doświadczenia z Kijowa mogą posłużyć za reguły scenariuszy, a model kalibrujemy na danych Warszawy na żywo.

## Precedens wykrywania awarii po zaniku sygnału

- IODA (Georgia Tech) interpretuje spadek liczby sieci odpowiadających na pingi w Ukrainie jako fizyczne zniszczenie sieci albo infrastruktury energetycznej. Działa w skali kraju i regionów: [raport IODA](https://ioda.inetintel.cc.gatech.edu/reports/how-russias-recent-attacks-on-ukraines-energy-grid-impacted-its-internet-connectivity-2/).
- Wykrywania na poziomie dzielnicy z miejskich czujników (GPS pojazdów, parkingi, stacje pomiarowe) nie znalazłem. To potencjalna nowość, ale do potwierdzenia.

## Dym po pożarze

- Kijów: AQI 140–174 po atakach, przy normie około 50. Zanieczyszczenia pochodzą z palących się obiektów. Bezwietrzna pogoda (inwersja) trzyma je przy ziemi. Po ataku na elektrownię w Trypilii mer pobliskiego miasta zalecił zamknięcie okien.
- Źródła: [Ukraińska Prawda](https://www.pravda.com.ua/eng/news/2026/08/05/8047301/), [hromadske](https://hromadske.ua/en/posts/missile-strike-completely-destroys-trypillia-thermal-power-plant-in-kyiv-oblast), [Euronews (CHP-4)](https://www.euronews.com/video/2026/10/14/ukraine-russian-missiles-hit-kyiv-homes-and-power-plant-killing-3-and-injuring-22).
