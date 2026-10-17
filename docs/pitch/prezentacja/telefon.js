/* Slajd 8 „Dzień Kasi”: zaprogramowane, deterministyczne demo aplikacji na makiecie telefonu.
   Bez sieci i bez żywej aplikacji: zrzuty z produkcji w ekrany/ (Grochowska 200, 17.10.2026).
   Umowa z silnikiem prezentacji: window.telefonDemo = { kroki: N, krok(k) } dla k = 0..N.
   krok(k) jest idempotentny. Krok o jeden do przodu gra animację (tapnięcie, przejście),
   każdy inny skok (wstecz, deep link #8.3, powrót na slajd) ustawia stan od razu. */
(function () {
  'use strict';

  var SKALA = 0.4; // px zrzutu (960×1920) → px sceny (384×768)
  var OS = ['Start', 'Karta Syreny', 'Miejsce schronienia', 'Pozostałe karty', 'Brak sieci'];

  var POL = {
    sprawdzam: 'Sprawdzam połączenie…',
    jest: 'Jest połączenie. Dane na żywo włączone. Trasy na offline zapisuję w tle.',
    offline: 'Brak sieci. Działam na danych z paczki z 17.10, 20:52.'
  };

  var WIDOKI = ['polaczenie', 'dom', 'glowny', 'syreny', 'trasa', 'powietrze', 'bliscy', 'offline-glowny', 'offline-trasa'];

  // Miejsca na zrzutach w px zrzutu 960×1920: [x1, y1, x2, y2] albo punkt [x, y].
  var M = {
    tutaj: [626, 57],
    wybraneMiejsce: [24, 22, 564, 92],
    kartaSyreny: [480, 1130],
    okregiSyren: [196, 194, 766, 852],
    kartaSchronienia: [480, 1376],
    trasaMapa: [360, 380, 606, 652],
    trasaZapisana: [44, 1472, 838, 1532],
    powietrzeRada: [44, 1432, 568, 1500],
    bliscyDom: [42, 1070, 920, 1224],
    paczkaOffline: [584, 28, 936, 88],
    przewin: [[560, 1700], [560, 1240]]
  };

  // os: indeks na osi; ekran: widok końcowy; przed: fazy przed widokiem końcowym (tylko przy kroku do przodu);
  // tap/przewin: gest przed zmianą ekranu; ring: podświetlenia na widoku końcowym.
  var KROKI = [
    { os: 0, ekran: 'polaczenie', pol: 'sprawdzam',
      h: 'Kasia otwiera aplikację u mamy na Grochowie.',
      p: 'Najpierw aplikacja sprawdza, czy jest sieć.' },
    { os: 0, ekran: 'polaczenie', pol: 'jest',
      h: 'Jest sieć, więc dane na żywo są włączone.',
      p: 'W tle zapisuje trasy na wypadek, gdyby sieci zabrakło.' },
    { os: 0, ekran: 'glowny', przed: [{ ekran: 'dom', czekaj: 1000 }], tap: M.tutaj, ring: [M.wybraneMiejsce],
      h: 'Jedno dotknięcie: „Tutaj”.',
      p: 'Zamiast adresu domu miejsce, w którym Kasia stoi. Pięć kart dla tego miejsca.' },
    { os: 1, ekran: 'syreny', tap: M.kartaSyreny, ring: [{ r: M.okregiSyren, okrag: true }],
      h: 'Karta Syreny: okręgi najbliższych syren.',
      p: 'Kasia wie, czy usłyszy alarm, także jeśli zabraknie prądu.' },
    { os: 2, ekran: 'trasa', przed: [{ ekran: 'glowny', czekaj: 650 }], tap: M.kartaSchronienia, ring: [M.trasaMapa],
      h: 'Miejsce schronienia według PSP: 70 m.',
      p: 'Trasa piesza po ulicach. Kasia nie szuka w panice.' },
    { os: 3, ekran: 'powietrze', przewin: true, ring: [M.powietrzeRada],
      h: 'Powietrze i wiatr: „Możesz wietrzyć”.',
      p: 'Rekomendacja z pomiaru 230 m dalej, a nie suche dane.' },
    { os: 3, ekran: 'bliscy', przewin: true, ring: [M.bliscyDom],
      h: 'Do domu pieszo 172 min, rowerem 58.',
      p: 'Jeśli zabraknie prądu, tramwaje i metro stoją. Najbliższe Veturilo: 280 m.' },
    { os: 4, ekran: 'bliscy', bezSieci: true, dymek: true, cien: true,
      h: 'Pada sieć.',
      p: 'Bez prądu znika zasięg. Tak było w Kijowie.' },
    { os: 4, ekran: 'offline-glowny', bezSieci: true,
      przed: [{ ekran: 'polaczenie', pol: 'sprawdzam', czekaj: 700 }, { ekran: 'polaczenie', pol: 'offline', czekaj: 1700 }],
      ring: [M.paczkaOffline],
      h: 'Odświeżamy: aplikacja działa dalej z paczki w telefonie.',
      p: 'Pasek mówi wprost: offline, dane z 17.10, 20:52.' },
    { os: 4, ekran: 'offline-trasa', bezSieci: true, tap: M.kartaSchronienia, ring: [M.trasaMapa, M.trasaZapisana],
      h: 'Ta sama trasa, zapisana w telefonie.',
      p: 'Działa, gdy wszystko pada.' }
  ];

  var N = KROKI.length - 1;
  var ruchOgr = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    lewa.appendChild(h('p', 'dk-nad', 'Kasia jest u mamy na Grochowie, ul.&nbsp;Grochowska 200'));
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
    var ekran = h('div', 'dk-ekran');
    var stan = h('div', 'dk-stan', '<span>21:04</span><span class="dk-wyspa"></span><span class="dk-ikony">' + IKONY + '</span>');
    ekran.appendChild(stan);

    el.app = h('div', 'dk-app');
    var warstwy = h('div', 'dk-widoki'); // własny kontekst nakładania: z-index widoków nie przykrywa podświetleń
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
    el.ringi = [h('div', 'dk-ring'), h('div', 'dk-ring')];
    el.ringi.forEach(function (r) { el.app.appendChild(r); });
    el.fala = h('div', 'dk-fala');
    el.palec = h('div', 'dk-palec');
    el.app.appendChild(el.fala);
    el.app.appendChild(el.palec);
    ekran.appendChild(el.app);

    el.dymek = h('div', 'dk-dymek', WIFI_OFF_DUZE + '<span>Brak sieci</span>');
    ekran.appendChild(el.dymek);
    el.telefon.appendChild(ekran);
    host.appendChild(el.telefon);

    gotowe = true;
    return true;
  }

  /* ---------- elementy stanu ---------- */
  function ustawPol(stan, odRazu) {
    if (!stan || el.polTekst.textContent === POL[stan]) return;
    el.polTekst.textContent = POL[stan];
    el.pol.classList.toggle('dk-wynik', stan !== 'sprawdzam');
    if (!odRazu && !ruchOgr) anim(el.polTekst, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
  }

  function pokazWidok(nazwa, opcje) {
    opcje = opcje || {};
    var v = el.widoki[nazwa];
    if (nazwa === 'polaczenie') ustawPol(opcje.pol, opcje.odRazu || !v.classList.contains('dk-on'));
    var juz = v.classList.contains('dk-on') && Number(v.style.zIndex) === zWarstwa;
    if (juz) return;
    if (opcje.odRazu) {
      el.app.classList.add('dk-bez-ruchu');
      WIDOKI.forEach(function (w) { el.widoki[w].classList.remove('dk-on', 'dk-z-dolu'); });
      v.style.zIndex = ++zWarstwa;
      v.classList.add('dk-on');
      void el.app.offsetWidth;
      el.app.classList.remove('dk-bez-ruchu');
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
      if (z !== zeton) return;
      WIDOKI.forEach(function (w) { if (w !== nazwa) el.widoki[w].classList.remove('dk-on', 'dk-z-dolu'); });
    }, 460));
  }

  function ustawRingi(lista, widoczne, odRazu) {
    el.ringi.forEach(function (r, i) {
      var d = lista && lista[i];
      if (odRazu) r.classList.add('dk-bez-ruchu');
      if (!d) { r.classList.remove('dk-on'); }
      else {
        var b = d.r || d;
        r.classList.toggle('dk-okrag', !!d.okrag);
        r.style.left = px(b[0]); r.style.top = px(b[1]);
        r.style.width = px(b[2] - b[0]); r.style.height = px(b[3] - b[1]);
        r.classList.toggle('dk-on', !!widoczne);
      }
      if (odRazu) { void r.offsetWidth; r.classList.remove('dk-bez-ruchu'); }
    });
  }

  function ustawUrzadzenie(k, odRazu) {
    var s = KROKI[k];
    if (odRazu) { el.telefon.classList.add('dk-bez-ruchu'); }
    el.telefon.classList.toggle('dk-bez-sieci', !!s.bezSieci);
    el.telefon.classList.toggle('dk-przyciemnij', !!s.cien);
    el.dymek.classList.toggle('dk-on', !!s.dymek);
    if (odRazu) { void el.telefon.offsetWidth; el.telefon.classList.remove('dk-bez-ruchu'); }
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
    var E = 'cubic-bezier(0.23, 1, 0.32, 1)';
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
    ], { duration: 520, delay: 400, easing: E, fill: 'both' });
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
    ustawRingi(s.ring, true, bezPrzejscia);
    ustawUrzadzenie(k, bezPrzejscia);
    ustawOs(k);
    ustawPodpis(k, bezPrzejscia);
  }

  async function graj(k) {
    var s = KROKI[k];
    var z = zeton;
    ustawOs(k);
    ustawPodpis(k, false);
    ustawRingi(null, false);
    ustawUrzadzenie(k, false);

    var fazy = s.przed || [];
    for (var i = 0; i < fazy.length; i++) {
      pokazWidok(fazy[i].ekran, { pol: fazy[i].pol });
      if (!(await czekaj(fazy[i].czekaj, z))) return;
    }
    if (s.tap) { if (!(await tapnij(s.tap, z))) return; }
    if (s.przewin) { if (!(await przewin(z))) return; }
    pokazWidok(s.ekran, { pol: s.pol, zDolu: s.przewin });
    if (!s.ring) return;
    if (!(await czekaj(380, z))) return;
    ustawRingi(s.ring, true, false);
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
