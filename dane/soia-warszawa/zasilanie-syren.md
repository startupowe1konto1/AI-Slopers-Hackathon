# Zasilanie syren w Warszawie: co wiemy, a czego nie

Notatka do założenia z analizy blackoutu (`analiza/syreny_blackout.py`): przy braku prądu działają tylko syreny cyfrowe. Stan na 17.10.2026.

## Wniosek

Założenie ma oparcie w dokumentach, ale nie jest potwierdzone dla każdej syreny. Syreny analogowe w Warszawie to prawie wyłącznie syreny wirnikowe wojewody, napędzane silnikami trójfazowymi. W dokumentach przetargowych nie ma dla nich zasilania rezerwowego. Syreny cyfrowe i elektroniczne muszą według przetargów mieć akumulatory. Nie wiemy, czy któraś syrena wirnikowa stoi na budynku z agregatem. Dlatego w aplikacji i na pitchu mówimy „jeśli”.

## Kto jest właścicielem której syreny

Z `tabele/syreny_inwentaryzacja_warszawa.csv` (pola `wlasciciel`, `rodzaj_syreny`):

| Właściciel | Analogowe | Cyfrowe |
|---|---|---|
| Wojewoda | 233 | 1 |
| Prezydent Miasta | 0 | 197 |
| KW PSP | 0 | 18 |
| OSP | 2 | 0 |
| **Razem** | **235** | **216** |

Pytanie o zasilanie syren analogowych trzeba więc kierować do wojewody mazowieckiego (Mazowiecki Urząd Wojewódzki), a nie do miasta.

Pole `moc_w` w inwentaryzacji (900 i 1200 W dla analogowych) nie zgadza się z mocą silników z przetargu (4–7,5 kW). Prawdopodobnie oznacza co innego niż moc silnika. Nie wyjaśnialiśmy tego.

## Źródła

1. **Syreny wojewody w Warszawie.** Opis przedmiotu zamówienia „Przegląd techniczny 235 oraz modernizacja 40 syren alarmowych wchodzących w skład Systemu Alarmowania i Ostrzegania Ludności na terenie m. st. Warszawy”, BIP Mazowieckiego Urzędu Wojewódzkiego, czerwiec 2024: https://bip.mazowieckie.pl/attachments/download/44393
   - Punkt alarmowy składa się z „syreny wirnikowej napędzanej silnikiem elektrycznym 3-fazowym o mocy 4-7,5 kW”, skrzynki zasilającej ze stycznikiem, sterowania radiowego i anteny.
   - W całym dokumencie nie ma słowa o akumulatorach, zasilaniu rezerwowym ani agregatach.
2. **Nowa syrena elektroniczna dla Warszawy.** Opis zamówienia wojewody na „fabrycznie nowy punkt alarmowy (PA) tj. syrenę elektroniczną” w Warszawie, lipiec 2022: https://bip.mazowieckie.pl/attachments/download/33459
   - Zasilanie 230 V AC, a „zasilanie rezerwowe PA ma być zrealizowane na bazie akumulatorów bezobsługowych” AGM.
   - Wymóg: co najmniej 10 trzyminutowych alarmów w ciągu 48 godzin po wyłączeniu zasilania głównego. Syrena zgłasza do centrali zanik zasilania sieciowego.
3. **Program KG PSP w KPO** („Rozbudowa Systemu Ostrzegania i Alarmowania Ludności”): wymiana syren analogowych na cyfrowe w całej Polsce. Specyfikacja wymaga dwóch akumulatorów 12 V AGM po co najmniej 30 Ah i co najmniej 10 dni czuwania. Dokumenty przetargowe na gov.pl i platformazakupowa.pl, np. https://www.gov.pl/attachment/9c13ea6f-5e72-416c-a007-e7bb54237ca8. Wersje dokumentów różnią się szczegółami, więc liczby trzeba sprawdzić w aktualnej wersji.
4. **Repozytorium SOIA** (KGPSP/soia-analiza-zasiegu):
   - Inwentaryzacja nie ma pola o zasilaniu awaryjnym. Ma tylko status GSM i sygnalizacji.
   - `docs/explanation/ograniczenia-i-interpretacja.md`: przed zakupem syren trzeba potwierdzić m.in. zasilanie.
   - `publication/analiza-kierunkowa.md`: wyłączenie energii wymienione jako awaria oznaczająca utratę kanału ostrzegania.

## Co z tego wynika dla analizy

- **Wariant blackout jest rozsądnym przybliżeniem dla pierwszych godzin i dni.**
- **Przy długim blackoucie może być zbyt optymistyczny.** Akumulatory syren cyfrowych też się kończą: wymóg z 2022 r. to 48 godzin alarmów, a KPO wymaga 10 dni czuwania.
- **Jeśli wojewoda wskaże syreny wirnikowe z agregatem,** dopisujemy je do wariantu blackout jako działające i przeliczamy skrypt.

## Jak to potwierdzić

- **Najszybciej:** zapytać mentorów z urzędu w czasie hackathonu, czy wiedzą, które syreny wirnikowe w Warszawie mają zasilanie rezerwowe.
- **Formalnie:** wniosek o informację publiczną do Mazowieckiego Urzędu Wojewódzkiego (Wydział Bezpieczeństwa i Zarządzania Kryzysowego). Ustawowy termin odpowiedzi to 14 dni, więc to już po hackathonie.
