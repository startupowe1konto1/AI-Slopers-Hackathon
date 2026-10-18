/* Slajd demo (sekcja s-kasia) „Dzień Kasi”: zaprogramowane, deterministyczne demo aplikacji na makiecie telefonu.
   Bez sieci i bez żywej aplikacji: zrzuty z produkcji w ekrany/ (42 Warsaw, al. Solidarności 171, 18.10.2026).
   Umowa z silnikiem prezentacji: window.telefonDemo = { kroki: N, krok(k) } dla k = 0..N.
   krok(k) jest idempotentny. Krok o jeden do przodu gra animację (tapnięcie, przejście, lupa wylatuje z ekranu),
   każdy inny skok (wstecz, deep link #N.k, powrót na slajd) ustawia stan od razu.
   Lupa: powiększony wycinek ekranu obok telefonu (tekst z zrzutu ≥ 24 px na scenie), połączony stożkiem
   z ramką na telefonie, żeby z sali było widać i dało się przeczytać, o czym mówimy. */
(function () {
  'use strict';

  var SKALA = 0.4; // px zrzutu (960×1920) → px sceny (384×768)
  var OS = ['Start', 'Karta Syreny', 'Miejsce schronienia', 'Pozostałe karty', 'Brak sieci'];
  // Strefa lupy na scenie 1600×900 (pod podpisem, w lewej kolumnie). maxM: najwyżej 3× tyle co na telefonie.
  var LUPA = { x: 112, gora: 560, dol: 860, szer: 790, maxM: 1.2 };

  var POL = {
    sprawdzam: 'Sprawdzam połączenie…',
    jest: 'Jest połączenie. Dane na żywo włączone. Trasy na offline zapisuję w tle.',
    offline: 'Brak sieci. Działam na danych z paczki z 17.10, 23:33.'
  };

  var WIDOKI = ['polaczenie', 'dom', 'glowny', 'syreny', 'trasa', 'powietrze', 'bliscy', 'komunikacja', 'offline-dom', 'offline-glowny', 'offline-trasa'];

  // Punkty tapnięć na zrzutach (px zrzutu 960×1920), z pozycji elementów w aplikacji.
  var M = {
    lokalizacja: [576, 56],
    lokalizacjaOffline: [700, 56],
    kartaSyreny: [480, 1114],
    kartaSchronienia: [480, 1342],
    komunikacja: [692, 1242],
    przewin: [[560, 1700], [560, 1240]]
  };
  // Wycinki pod lupę [x1, y1, x2, y2] w px zrzutu.
  var L = {
    pasek: [12, 6, 676, 106],              // „Lokalizacja: al. „Solidarności”” i przycisk „Lokalizacja”
    pasekOffline: [12, 6, 800, 170],       // to samo bez sieci, z „Offline · paczka z 17.10, 23:33”
    syreny: [24, 1004, 936, 1226],         // karta Syreny
    schronienie: [24, 1230, 936, 1500],    // karta schronienia z „60 m po ulicach…”
    powietrze: [24, 1322, 936, 1504],      // „Powietrze dobre. Możesz wietrzyć.”
    bliscy: [24, 934, 936, 1198],          // dom pieszo/rowerem i „4,9 km po ulicach…”
    komunikacja: [24, 1144, 936, 1492]     // tramwaj 26, odjazd z rozkładu ZTM, przełącznik, blackout
  };

  // os: indeks na osi; ekran: widok końcowy; przed: fazy przed widokiem końcowym (tylko przy kroku do przodu);
  // tap/przewin: gest przed zmianą ekranu; lupa: wycinek powiększony obok telefonu (i ramka na telefonie).
  var KROKI = [
    { os: 0, ekran: 'polaczenie', pol: 'sprawdzam',
      h: 'Kasia otwiera aplikację w 42 Warsaw.',
      p: 'Najpierw aplikacja sprawdza, czy jest sieć.' },
    { os: 0, ekran: 'polaczenie', pol: 'jest',
      h: 'Jest sieć, więc dane na żywo są włączone.',
      p: 'W tle zapisuje trasy na wypadek, gdyby sieci zabrakło.' },
    { os: 0, ekran: 'glowny', przed: [{ ekran: 'dom', czekaj: 1000 }], tap: M.lokalizacja, lupa: L.pasek,
      h: 'Jedno dotknięcie: „Lokalizacja”.',
      p: 'Zamiast adresu domu miejsce, w którym Kasia stoi: al. Solidarności 171. Pięć kart dla tego miejsca.' },
    { os: 1, ekran: 'syreny', tap: M.kartaSyreny, lupa: L.syreny,
      h: 'Karta Syreny: Kasia jest w zasięgu syreny.',
      p: '75 dB i więcej na zewnątrz, także jeśli zabraknie prądu. Okręgi na mapie to najbliższe syreny.' },
    { os: 2, ekran: 'trasa', przed: [{ ekran: 'glowny', czekaj: 650 }], tap: M.kartaSchronienia, lupa: L.schronienie,
      h: 'Miejsce schronienia według PSP: 60 m.',
      p: 'Trasa piesza po ulicach, ok. 1 minuty. Kasia nie szuka w panice.' },
    { os: 3, ekran: 'powietrze', przewin: true, lupa: L.powietrze,
      h: 'Powietrze i wiatr: „Możesz wietrzyć”.',
      p: 'Rekomendacja z czujnika miasta 770 m dalej, a nie tabela liczb.' },
    { os: 3, ekran: 'bliscy', przewin: true, lupa: L.bliscy,
      h: 'Do domu pieszo 66 min, rowerem 26.',
      p: '4,9 km po ulicach, trasa zapisana w telefonie. Jeśli zabraknie prądu, tramwaje i metro stoją.' },
    { os: 3, ekran: 'komunikacja', tap: M.komunikacja, lupa: L.komunikacja,
      h: 'Komunikacja: odjazdy ZTM z API miasta, na żywo.',
      p: 'Tramwaj 26, na który Kasia zdąży: za 11 min (dane.um.warszawa.pl). Przy blackoucie zostają same autobusy.' },
    { os: 4, ekran: 'komunikacja', bezSieci: true, dymek: true, cien: true,
      h: 'Pada sieć.',
      p: 'Bez prądu znika zasięg. Tak było w Kijowie.' },
    { os: 4, ekran: 'offline-glowny', bezSieci: true,
      przed: [{ ekran: 'polaczenie', pol: 'sprawdzam', czekaj: 700 }, { ekran: 'polaczenie', pol: 'offline', czekaj: 1700 }, { ekran: 'offline-dom', czekaj: 900 }],
      tap: M.lokalizacjaOffline, lupa: L.pasekOffline,
      h: 'Odświeżamy: aplikacja działa dalej z paczki.',
      p: '„Lokalizacja” działa też bez sieci. Pasek mówi wprost: offline, paczka z 17.10, 23:33.' },
    { os: 4, ekran: 'offline-trasa', bezSieci: true, tap: M.kartaSchronienia, lupa: L.schronienie,
      h: 'Ta sama trasa, zapisana w telefonie.',
      p: 'Działa, gdy wszystko pada.' }
  ];

  var N = KROKI.length - 1;
  var ruchOgr = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var E_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

  var el = {};          // referencje do elementów
  var aktualny = -1;    // ostatni ustawiony krok (-1: jeszcze nic)
  var zeton = 0;        // unieważnia trwającą animację
  var timery = [];
  var animacje = [];
  var zWarstwa = 1;
  var gotowe = false;

  /* ---------- pomocnicze ---------- */
  function px(v) { return Math.round(v * SKALA) + 'px'; }
  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    return e;
  }
  function czekaj(ms, z) {
    return new Promise(function (ok) {
      timery.push(setTimeout(function () { ok(z === zeton); }, ruchOgr ? Math.min(ms, 250) : ms));
    });
  }
  function zatrzymaj() {
    zeton++;
    timery.forEach(clearTimeout); timery = [];
    animacje.forEach(function (a) { try { a.cancel(); } catch (e) { /* już zakończona */ } }); animacje = [];
  }
  function anim(e, klatki, opcje) {
    if (!e.animate) return null;
    var a = e.animate(klatki, opcje);
    animacje.push(a);
    return a;
  }
  function bezRuchu(e, fn) {
    e.classList.add('dk-bez-ruchu');
    fn();
    void e.offsetWidth;
    e.classList.remove('dk-bez-ruchu');
  }

  var IKONY =
    '<svg class="dk-zasieg-on" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>' +
    '<svg class="dk-zasieg-off" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><g fill="#c9c4bf"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></g></svg>' +
    '<svg class="dk-wifi-on" width="17" height="12" viewBox="0 0 17 12" aria-hidden="true"><path d="M8.5 2.2c2.5 0 4.8.9 6.6 2.5l1.3-1.4C14.2 1.3 11.4.2 8.5.2S2.8 1.3.6 3.3l1.3 1.4C3.7 3.1 6 2.2 8.5 2.2zm0 3.6c1.5 0 2.9.5 4 1.5l1.3-1.4C12.4 4.6 10.5 3.8 8.5 3.8s-3.9.8-5.3 2.1l1.3 1.4c1.1-1 2.5-1.5 4-1.5zm0 3.6c-.6 0-1.1.2-1.6.6L8.5 11.9l1.6-1.9c-.5-.4-1-.6-1.6-.6z" fill="currentColor"/></svg>' +
    '<svg class="dk-wifi-off" width="17" height="12" viewBox="0 0 17 12" aria-hidden="true"><path d="M8.5 2.2c2.5 0 4.8.9 6.6 2.5l1.3-1.4C14.2 1.3 11.4.2 8.5.2S2.8 1.3.6 3.3l1.3 1.4C3.7 3.1 6 2.2 8.5 2.2zm0 3.6c1.5 0 2.9.5 4 1.5l1.3-1.4C12.4 4.6 10.5 3.8 8.5 3.8s-3.9.8-5.3 2.1l1.3 1.4c1.1-1 2.5-1.5 4-1.5zm0 3.6c-.6 0-1.1.2-1.6.6L8.5 11.9l1.6-1.9c-.5-.4-1-.6-1.6-.6z" fill="currentColor" opacity=".35"/><path d="M2 .5l13 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    '<svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="15" height="8" rx="1.6" fill="currentColor"/><rect x="24" y="4" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".45"/></svg>';

  var WIFI_OFF_DUZE = '<svg width="22" height="16" viewBox="0 0 17 12" aria-hidden="true"><path d="M8.5 2.2c2.5 0 4.8.9 6.6 2.5l1.3-1.4C14.2 1.3 11.4.2 8.5.2S2.8 1.3.6 3.3l1.3 1.4C3.7 3.1 6 2.2 8.5 2.2zm0 3.6c1.5 0 2.9.5 4 1.5l1.3-1.4C12.4 4.6 10.5 3.8 8.5 3.8s-3.9.8-5.3 2.1l1.3 1.4c1.1-1 2.5-1.5 4-1.5zm0 3.6c-.6 0-1.1.2-1.6.6L8.5 11.9l1.6-1.9c-.5-.4-1-.6-1.6-.6z" fill="currentColor" opacity=".4"/><path d="M2 .5l13 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  /* ---------- budowa slajdu ---------- */
  function zbuduj() {
    if (gotowe) return true;
    var host = document.getElementById('demo-kasi');
    if (!host) return false;
    host.innerHTML = '';

    var lewa = h('div', 'dk-lewa');
    lewa.appendChild(h('p', 'dk-nad', 'Kasia jest w 42 Warsaw, al.&nbsp;Solidarności 171B, Wola'));
    lewa.appendChild(h('h2', 'dk-tytul', 'Dzień Kasi'));
    var os = h('ol', 'dk-os');
    os.setAttribute('aria-label', 'Kroki demo');
    os.appendChild(h('span', 'dk-os-linia'));
    el.postep = h('span', 'dk-os-postep');
    os.appendChild(el.postep);
    el.os = OS.map(function (t) { var li = h('li', null, t); os.appendChild(li); return li; });
    lewa.appendChild(os);
    var podpis = h('div', 'dk-podpis');
    podpis.setAttribute('aria-live', 'polite');
    el.podpisW = h('div', 'dk-podpis-w');
    el.podpisH = h('h3');
    el.podpisP = h('p');
    el.podpisW.appendChild(el.podpisH);
    el.podpisW.appendChild(el.podpisP);
    podpis.appendChild(el.podpisW);
    lewa.appendChild(podpis);
    host.appendChild(lewa);

    el.telefon = h('div', 'dk-telefon');
    el.telefon.setAttribute('role', 'img');
    el.telefon.setAttribute('aria-label', 'Telefon z aplikacją Warszawa w trybie kryzysowym');
    el.ekran = h('div', 'dk-ekran');
    var stan = h('div', 'dk-stan', '<span>15:40</span><span class="dk-wyspa"></span><span class="dk-ikony">' + IKONY + '</span>');
    el.ekran.appendChild(stan);

    el.app = h('div', 'dk-app');
    var warstwy = h('div', 'dk-widoki'); // własny kontekst nakładania: z-index widoków nie przykrywa ramki
    el.app.appendChild(warstwy);
    el.widoki = {};
    WIDOKI.forEach(function (w) {
      var v = h('div', 'dk-widok');
      if (w === 'polaczenie') {
        v.className += ' dk-pol';
        v.appendChild(h('div', 'dk-kolko'));
        el.polTekst = h('p', null, POL.sprawdzam);
        v.appendChild(el.polTekst);
        el.pol = v;
      } else {
        var img = new Image();
        img.src = 'ekrany/' + w + '.jpg';
        img.alt = '';
        img.decoding = 'async';
        img.draggable = false;
        v.appendChild(img);
      }
      warstwy.appendChild(v);
      el.widoki[w] = v;
    });
    el.cien = h('div', 'dk-cien');
    el.app.appendChild(el.cien);
    el.ring = h('div', 'dk-ring');
    el.app.appendChild(el.ring);
    el.fala = h('div', 'dk-fala');
    el.palec = h('div', 'dk-palec');
    el.app.appendChild(el.fala);
    el.app.appendChild(el.palec);
    el.ekran.appendChild(el.app);

    el.dymek = h('div', 'dk-dymek', WIFI_OFF_DUZE + '<span>Brak sieci</span>');
    el.ekran.appendChild(el.dymek);
    el.telefon.appendChild(el.ekran);
    host.appendChild(el.telefon);

    // Stożek od lupy do ramki na telefonie (nad telefonem, pod lupą).
    el.stozek = svg('svg', { 'class': 'dk-stozek', viewBox: '0 0 1600 900', 'aria-hidden': 'true' });
    el.stozekPole = svg('polygon', { 'class': 'dk-stozek-pole', points: '0,0 0,0 0,0' });
    el.stozekG = svg('line', { 'class': 'dk-stozek-linia' });
    el.stozekD = svg('line', { 'class': 'dk-stozek-linia' });
    el.stozek.appendChild(el.stozekPole);
    el.stozek.appendChild(el.stozekG);
    el.stozek.appendChild(el.stozekD);
    host.appendChild(el.stozek);

    el.lupa = h('div', 'dk-lupa');
    el.lupa.setAttribute('aria-hidden', 'true');
    el.lupaImg = new Image();
    el.lupaImg.alt = '';
    el.lupaImg.draggable = false;
    el.lupa.appendChild(el.lupaImg);
    host.appendChild(el.lupa);

    gotowe = true;
    return true;
  }

  /* ---------- elementy stanu ---------- */
  function ustawPol(stan, odRazu) {
    if (!stan || el.polTekst.textContent === POL[stan]) return;
    el.polTekst.textContent = POL[stan];
    el.pol.classList.toggle('dk-wynik', stan !== 'sprawdzam');
    if (!odRazu && !ruchOgr) anim(el.polTekst, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: E_OUT });
  }

  function pokazWidok(nazwa, opcje) {
    opcje = opcje || {};
    var v = el.widoki[nazwa];
    if (nazwa === 'polaczenie') ustawPol(opcje.pol, opcje.odRazu || !v.classList.contains('dk-on'));
    var juz = v.classList.contains('dk-on') && Number(v.style.zIndex) === zWarstwa;
    if (juz) return;
    if (opcje.odRazu) {
      bezRuchu(el.app, function () {
        WIDOKI.forEach(function (w) { el.widoki[w].classList.remove('dk-on', 'dk-z-dolu'); });
        v.style.zIndex = ++zWarstwa;
        v.classList.add('dk-on');
      });
      return;
    }
    // Nowy widok wchodzi nad stary; stary znika pod spodem po zakończeniu przejścia (bez prześwitu tła).
    v.classList.add('dk-bez-ruchu');
    v.classList.remove('dk-on');
    v.classList.toggle('dk-z-dolu', !!opcje.zDolu && !ruchOgr);
    v.style.zIndex = ++zWarstwa;
    void v.offsetWidth;
    v.classList.remove('dk-bez-ruchu');
    v.classList.add('dk-on');
    var z = zeton;
    timery.push(setTimeout(function () {
      // Nowszy widok wszedł w międzyczasie (krótka faza, np. przy ograniczonym ruchu): sprząta jego własny timer.
      if (z !== zeton || Number(v.style.zIndex) !== zWarstwa) return;
      WIDOKI.forEach(function (w) { if (w !== nazwa) el.widoki[w].classList.remove('dk-on', 'dk-z-dolu'); });
    }, 460));
  }

  /* ---------- lupa ---------- */
  // Lewy górny róg obszaru aplikacji w px sceny (offsetLeft nie zależy od skalowania sceny).
  function poczatekEkranu() {
    return {
      x: el.telefon.offsetLeft + el.ekran.offsetLeft + el.app.offsetLeft,
      y: el.telefon.offsetTop + el.ekran.offsetTop + el.app.offsetTop
    };
  }

  function geometria(r) {
    var w = r[2] - r[0], wys = r[3] - r[1];
    var m = Math.min(LUPA.szer / w, (LUPA.dol - LUPA.gora) / wys, LUPA.maxM);
    var W = Math.round(w * m), H = Math.round(wys * m);
    var o = poczatekEkranu();
    var ring = { x: o.x + r[0] * SKALA, y: o.y + r[1] * SKALA, w: w * SKALA, h: wys * SKALA };
    // Lupa zawsze w tym samym miejscu pod podpisem (stały rytm między krokami); stożek pokazuje, skąd jest wycinek.
    return { m: m, x: LUPA.x, y: LUPA.gora, W: W, H: H, ring: ring };
  }

  function ustawRing(r, widoczny, odRazu) {
    var f = function () {
      if (r) {
        el.ring.style.left = px(r[0]); el.ring.style.top = px(r[1]);
        el.ring.style.width = px(r[2] - r[0]); el.ring.style.height = px(r[3] - r[1]);
      }
      el.ring.classList.toggle('dk-on', !!(r && widoczny));
    };
    if (odRazu) bezRuchu(el.ring, f); else f();
  }

  function ustawStozek(g, widoczny, opoznienie, odRazu) {
    var f = function () {
      if (g) {
        var lx = g.x + g.W, rx = g.ring.x;
        el.stozekPole.setAttribute('points', lx + ',' + g.y + ' ' + rx + ',' + g.ring.y + ' ' + rx + ',' + (g.ring.y + g.ring.h) + ' ' + lx + ',' + (g.y + g.H));
        el.stozekG.setAttribute('x1', lx); el.stozekG.setAttribute('y1', g.y + 1); el.stozekG.setAttribute('x2', rx); el.stozekG.setAttribute('y2', g.ring.y);
        el.stozekD.setAttribute('x1', lx); el.stozekD.setAttribute('y1', g.y + g.H - 1); el.stozekD.setAttribute('x2', rx); el.stozekD.setAttribute('y2', g.ring.y + g.ring.h);
      }
      el.stozek.style.transitionDelay = widoczny && opoznienie ? opoznienie + 'ms' : '0ms';
      el.stozek.classList.toggle('dk-on', !!(g && widoczny));
    };
    if (odRazu) bezRuchu(el.stozek, f); else f();
  }

  // tryb: 'lot' (wylatuje z ramki na telefonie), 'fade' (skok), 'od-razu' (pierwsze ustawienie).
  function pokazLupe(s, tryb) {
    var r = s.lupa;
    var g = geometria(r);
    var src = 'ekrany/' + s.ekran + '.jpg';
    var klucz = src + '|' + r.join(',');
    // Ten sam stan jeszcze raz (np. powtórne krok(k)): nic nie mrugnie.
    if (tryb === 'fade' && el.lupa.classList.contains('dk-on') && el.lupa.dataset.klucz === klucz) {
      ustawRing(r, true, false);
      ustawStozek(g, true, 0, false);
      return;
    }
    el.lupa.dataset.klucz = klucz;
    if (el.lupaImg.getAttribute('src') !== src) el.lupaImg.setAttribute('src', src);
    var st = el.lupa.style;
    st.left = g.x + 'px'; st.top = g.y + 'px'; st.width = g.W + 'px'; st.height = g.H + 'px';
    var is = el.lupaImg.style;
    is.width = Math.round(960 * g.m) + 'px'; is.height = Math.round(1920 * g.m) + 'px';
    is.left = -Math.round(r[0] * g.m) + 'px'; is.top = -Math.round(r[1] * g.m) + 'px';
    el.lupa.classList.add('dk-on');
    ustawRing(r, true, tryb === 'od-razu');
    if (tryb === 'od-razu') { ustawStozek(g, true, 0, true); return; }
    if (tryb === 'lot' && !ruchOgr) {
      // FLIP: lupa startuje dokładnie na ramce (ten sam wycinek w skali telefonu) i rośnie na swoje miejsce.
      var od = 'translate(' + (g.ring.x - g.x) + 'px, ' + (g.ring.y - g.y) + 'px) scale(' + (g.ring.w / g.W) + ')';
      anim(el.lupa, [
        { transform: od, opacity: 0 },
        { opacity: 1, offset: 0.12 },
        { transform: 'none', opacity: 1 }
      ], { duration: 520, easing: E_OUT });
      ustawStozek(g, true, 260, false);
      return;
    }
    anim(el.lupa, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: E_OUT });
    ustawStozek(g, true, 0, false);
  }

  function schowajLupe(odRazu) {
    var bylo = el.lupa.classList.contains('dk-on');
    el.lupa.classList.remove('dk-on');
    ustawRing(null, false, odRazu);
    ustawStozek(null, false, 0, odRazu);
    if (!bylo || odRazu) return;
    anim(el.lupa, [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: ruchOgr ? 'none' : 'translateX(12px) scale(0.98)' }
    ], { duration: 180, easing: E_OUT });
  }

  function ustawUrzadzenie(k, odRazu) {
    var s = KROKI[k];
    var f = function () {
      el.telefon.classList.toggle('dk-bez-sieci', !!s.bezSieci);
      el.telefon.classList.toggle('dk-przyciemnij', !!s.cien);
      el.dymek.classList.toggle('dk-on', !!s.dymek);
    };
    if (odRazu) bezRuchu(el.telefon, f); else f();
  }

  function ustawOs(k) {
    var i = KROKI[k].os;
    el.os.forEach(function (li, j) {
      li.classList.toggle('dk-bylo', j < i);
      li.classList.toggle('dk-teraz', j === i);
      if (j === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    el.postep.style.transform = 'scaleX(' + (i / (OS.length - 1)) + ')';
  }

  function ustawPodpis(k, odRazu) {
    var s = KROKI[k];
    if (odRazu || el.podpisH.textContent === '') {
      el.podpisH.textContent = s.h; el.podpisP.textContent = s.p;
      el.podpisW.classList.remove('dk-ukryty');
      return;
    }
    if (el.podpisH.textContent === s.h) return;
    el.podpisW.classList.add('dk-ukryty');
    var z = zeton;
    timery.push(setTimeout(function () {
      if (z !== zeton) { return; }
      el.podpisH.textContent = s.h; el.podpisP.textContent = s.p;
      el.podpisW.classList.remove('dk-ukryty');
    }, 150));
  }

  /* ---------- gesty ---------- */
  function tapnij(p, z) {
    if (ruchOgr) return czekaj(120, z);
    var x = px(p[0]), y = px(p[1]);
    el.palec.style.left = x; el.palec.style.top = y;
    el.fala.style.left = x; el.fala.style.top = y;
    anim(el.palec, [
      { opacity: 0, transform: 'scale(1.25)' },
      { opacity: 1, transform: 'scale(1)', offset: 0.3 },
      { opacity: 1, transform: 'scale(0.86)', offset: 0.45 },
      { opacity: 1, transform: 'scale(1)', offset: 0.6 },
      { opacity: 0, transform: 'scale(1)' }
    ], { duration: 900, easing: 'linear', fill: 'both' });
    anim(el.fala, [
      { opacity: 0.7, transform: 'scale(0.7)' },
      { opacity: 0, transform: 'scale(2)' }
    ], { duration: 520, delay: 400, easing: E_OUT, fill: 'both' });
    return czekaj(480, z);
  }

  function przewin(z) {
    if (ruchOgr) return czekaj(120, z);
    var a = M.przewin[0], b = M.przewin[1];
    el.palec.style.left = px(a[0]); el.palec.style.top = px(a[1]);
    var dy = (b[1] - a[1]) * SKALA;
    anim(el.palec, [
      { opacity: 0, transform: 'translateY(0) scale(1.15)' },
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.2 },
      { opacity: 1, transform: 'translateY(' + dy + 'px) scale(1)', offset: 0.8 },
      { opacity: 0, transform: 'translateY(' + dy + 'px) scale(1)' }
    ], { duration: 1000, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'both' });
    return czekaj(560, z);
  }

  /* ---------- stany ---------- */
  function ustawOdRazu(k, bezPrzejscia) {
    var s = KROKI[k];
    pokazWidok(s.ekran, { pol: s.pol, odRazu: bezPrzejscia });
    if (s.lupa) pokazLupe(s, bezPrzejscia ? 'od-razu' : 'fade');
    else schowajLupe(bezPrzejscia);
    ustawUrzadzenie(k, bezPrzejscia);
    ustawOs(k);
    ustawPodpis(k, bezPrzejscia);
  }

  async function graj(k) {
    var s = KROKI[k];
    var z = zeton;
    ustawOs(k);
    ustawPodpis(k, false);
    schowajLupe(false);
    ustawUrzadzenie(k, false);

    var fazy = s.przed || [];
    for (var i = 0; i < fazy.length; i++) {
      pokazWidok(fazy[i].ekran, { pol: fazy[i].pol });
      if (!(await czekaj(fazy[i].czekaj, z))) return;
    }
    if (s.tap) { if (!(await tapnij(s.tap, z))) return; }
    if (s.przewin) { if (!(await przewin(z))) return; }
    pokazWidok(s.ekran, { pol: s.pol, zDolu: s.przewin });
    if (!s.lupa) return;
    if (!(await czekaj(380, z))) return;
    pokazLupe(s, 'lot');
  }

  function krok(k) {
    k = Math.max(0, Math.min(N, Math.round(Number(k) || 0)));
    if (!zbuduj()) { aktualny = -1; return; }
    var poprzedni = aktualny;
    zatrzymaj();
    aktualny = k;
    if (poprzedni === -1) { ustawOdRazu(k, true); return; }
    if (k === poprzedni + 1) { graj(k); return; }
    ustawOdRazu(k, false);
  }

  window.telefonDemo = { kroki: N, krok: krok };

  function start() { if (zbuduj() && aktualny === -1) krok(0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
