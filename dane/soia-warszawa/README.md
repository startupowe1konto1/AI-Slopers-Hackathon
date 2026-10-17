# SOIA: zasięg syren alarmowych, wycinek dla Warszawy

## Źródło i licencja

- **Źródło:** Komenda Główna Państwowej Straży Pożarnej (KG PSP), Biuro Informatyki i Łączności. „SOIA — analiza zasięgu syren alarmowych, snapshot 2026.05”. Zenodo, rekord [21921103](https://zenodo.org/records/21921103), DOI [10.5281/zenodo.21921103](https://doi.org/10.5281/zenodo.21921103). Repozytorium: [KGPSP/soia-analiza-zasiegu](https://github.com/KGPSP/soia-analiza-zasiegu).
- **Pobrany plik:** `soia-quickstart-2026.05.zip` (323 646 977 B). Suma SHA-256 `852ad5c1…d796a1` zgadza się z manifestem.
- **Licencja:** rekord Zenodo jest na CC BY 4.0. Warunki dla poszczególnych plików są w `data-manifest.json` repozytorium. Część składowych jest „mieszana”: OSM (ODbL), GUS NSP 2021, PRG GUGiK (CC BY 4.0), ISOK.
- **Wymagane oznaczenie przy użyciu:** „Dane: KG PSP, SOIA, wersja danych 2026.05 (Zenodo 10.5281/zenodo.21921103); przycięte do granic m.st. Warszawy (TERYT 1465011) przez zespół hackathonowy”. Do tego oznaczenia źródeł składowych: OpenStreetMap contributors (ODbL), GUS, GUGiK.
- **Przetworzenie:** przycięcie do granicy gminy Warszawa skryptem `clip_soia_warszawa.py` (geopandas, rasterio). Tabele są filtrowane po polu `powiat == "Warszawa"`.

## Zawartość

| Plik lub warstwa | Rekordy | Opis |
|---|---|---|
| `soia-warszawa.gpkg` / `granica_warszawy` | 1 | granica m.st. Warszawy (EPSG:2180) |
| `coverage_ranges` (gpkg i GeoJSON WGS84) | 961 | modelowane zasięgi syren 65, 70 i 75 dB(A) |
| `priority_gaps` | 96 | luki w zasięgu z ludnością poza zasięgiem i klasą priorytetu |
| `candidates` | 21 | kandydackie lokalizacje nowych syren |
| `sensitive_objects` | 6134 | budynki „wrażliwe” z OSM (administracja i budynki publiczne 3911, edukacja 1692, zdrowie i opieka 287, transport 186, bezpieczeństwo 25) z liczbą kondygnacji, powierzchnią i szacunkiem pojemności |
| `tabele/syreny_inwentaryzacja_warszawa.csv` | 451 | inwentaryzacja syren: typ, moc, właściciel, współrzędne, status GSM |
| `tabele/critical_sirens_V13_warszawa.csv`, `A09_redundancja_warszawa.csv` | 425 | ranking krytyczności syren (ludność zależna od danej syreny) |
| `tabele/A07_luki_priorytetowe_warszawa.csv` | 94 | luki w tabeli |
| `tabele/A08_kandydaci_syreny_warszawa.csv` | 469 | rekomendacje (integracja, nowe syreny) |
| `tabele/A11_integracja_GSM_warszawa.csv` | 18 | syreny bez GSM według dzielnic |
| `tabele/gmi_general_coverage_warszawa.csv`, `A04_gminy_warszawa.csv` | 1, 2 | podsumowania dla całego miasta |
| `rastry/*-warszawa.tif` | 288×300 px, 100 m | klasa pokrycia, modelowany poziom dźwięku, syrena dominująca w komórce (EPSG:2180) |

## Najważniejsze liczby dla Warszawy (wg SOIA)

- **451 syren:** 235 analogowych i 216 cyfrowych. Właściciele: wojewoda 234, Prezydent Miasta 197, KW PSP 18. Moc od 300 do 1200 W (mediana 900 W). Dla 433 syren status GSM to „NIE”.
- **Model obejmuje 1 860 720 mieszkańców (GUS NSP 2021):**
  - poziom co najmniej 65 dB(A): 96,8% (około 1,80 mln);
  - co najmniej 70 dB(A): około 1,71 mln;
  - co najmniej 75 dB(A): około 1,42 mln;
  - poza zasięgiem 65 dB(A): około 59,7 tys. osób (3,2%).

## Zastrzeżenia

- Założenie, że przy blackoucie działają tylko syreny cyfrowe, i jego źródła: [zasilanie-syren.md](zasilanie-syren.md).
- To model poziomu dźwięku **na zewnątrz** budynków. Nie mówi, czy syrenę słychać w mieszkaniu przy zamkniętych oknach.
- Luki priorytetowe i klasy ryzyka (`risk_class`) wynikają z map ryzyka **powodziowego** ISOK. To analiza pod kątem ostrzegania powodziowego, nie ataków.
- Obiekty wrażliwe to budynki z OSM sklasyfikowane heurystycznie (pewność „medium” albo „low”). To nie jest rejestr szpitali ani szkół. W tym wycinku pole `pop_night` sumuje się do 0, `pop_day` do około 230 tys.
- Pełna ludność rozdzielona na budynki (`building_population_V11`, 4 GB) jest tylko w pakiecie `soia-derived-v9-v13-2026.05.zip` (5,5 GB). Nie pobierałem go.
