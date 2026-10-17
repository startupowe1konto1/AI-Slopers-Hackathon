# Przegląd aplikacji (sobota, 18:15)

Stan: `main` + PR #19 (integracja O2). Przegląd na prawdziwych adresach Kasi: dom Powstańców Śląskich 10, praca rondo Daszyńskiego 1, bliska osoba Grochowska 200. Właściciel w nawiasie.

## Działa (po scaleniu #19)
- Onboarding z wyszukiwaniem w 126 923 adresach, paczka offline, mapa offline, `?offline=1`.
- **Syreny:** wynik dla każdego miejsca (normalnie i przy blackoucie), kroki, zastrzeżenia o modelu.
- **Pomoc:** 8006 miejsc schronienia PSP + metro, AED, apteki, SOR, toalety; filtr „tylko całodobowe”, kierunek i odległość, „Otwórz w aplikacji PSP”.
- **Dojazd:** pieszo i rowerem między miejscami, bezpośrednie autobusy.
- **Na żywo:** pojazdy, wiatr, dym, powietrze, Veturilo, utrudnienia, „stan na”.
- Stopka z atrybucjami, test ścieżki Kasi 6/6, produkcja na Cloudflare.

## Do poprawy: krytyczne (przed 21:00)
1. **Scalić PR #19 (O2).** Bez niego Syreny i Dojazd to atrapy. (lider)
2. **Liczba z pitchu jest nieaktualna.** Stara analiza (69,1% przy blackoucie) zaniżała wynik: SOIA dzieli miasto na obszary syreny dominującej, więc usunięcie analogowych kasowało całe obszary. Nowe oszacowanie O2: **≥65 dB: 92,5% → 91,5%**, **≥75 dB (głośny alarm): 48,3% → 36,6%**. Do zmiany (O4, liczby z `pipeline/syreny/WYNIKI.md`):
   - `docs/pitch/prezentacja/index.html` slajd 4 i `dane.js` (`build_dane.py`), `docs/pitch/prezentacja/README.md`
   - `docs/pitch/scenariusz.md` (wiersze o 69,1%), `docs/pitch/pytania.md` (pytanie 2), `docs/DOKUMENTACJA.md`
   - `HANDOFF.md` §5 i §9 (lider)
   - Nowa narracja: przy blackoucie syrenę nadal słychać prawie wszędzie na zewnątrz, ale **głośny alarm, który budzi w mieszkaniu, traci ok. 15 tys. adresów**; stąd karta „czy usłyszę alarm” i kroki (RCB, RSO, sąsiad).
3. **Demo syren nic nie pokazuje.** Dla adresów Kasi wynik to „75 dB i więcej” prawie wszędzie. Wybrać adres z wyraźnym spadkiem przy blackoucie, np. **ul. Walecznych 24 (Saska Kępa): 75+ → 65–70**, i ewentualnie zmienić personę (np. mama na Saskiej Kępie zamiast Grochowa). (O4 + O2)
4. **Demo dojazdu:** dla par Kasi wynik to „Brak bezpośredniego autobusu, pieszo ~73 min”. Sprawdzić poprawność (czy naprawdę nie ma autobusu Bemowo → rondo Daszyńskiego) i dodać przedszkole blisko domu, żeby pokazać przypadek z autobusem. Brakuje też zdania ze specyfikacji: „Przy blackoucie tramwaje, metro i SKM stoją”. (O2)

## Do poprawy: ważne (do 24:00)
5. **Karta do wydruku:** krok „Wydrukuj kartę z adresami” jest tylko tekstem, nie ma funkcji druku (O2-C2).
6. **Warstwa utraconego zasięgu przy blackoucie** na mapie (O2-C2), przyda się na pitch.
7. **README:** brak instrukcji uruchomienia (`npm ci`, `npm run dev`, `npm run test:e2e`, pipeline). (O1)
8. **`docs/AI_USAGE.md`:** brak wpisu O2. (O2)
9. **Format prezentacji do oddania:** HTML; sprawdzić, czy formularz przyjmie link, czy potrzebny PDF. (lider + O4)
10. **Podglądy Cloudflare dla PR-ów** są czerwone (produkcja działa); potrzebny log z panelu. (lider)

## Opcjonalne (jeśli zostanie czas)
11. Przełącznik PL/EN (persona: osoby nieznające polskiego). (O1)
12. Przegląd UI (kontrast, rozmiary dotyku, układ onboardingu: linia „Wybrano:” przesuwa pola). (O1)
13. Parkingi wielopoziomowe jako dodatkowe miejsca ukrycia. (O3)

## Rano (plan, sekcja F)
- 7:00 nagranie wideo demo jako zapas, 9:00 zamrożenie, czysta instalacja i testy, skan sekretów, oddanie do 10:30.
