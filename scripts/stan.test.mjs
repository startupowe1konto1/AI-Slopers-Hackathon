// Uruchom: node --test scripts/stan.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { galazPrzejeta, parsujGalezie, pasujePR, stanZadan } from './stan.mjs';

const ZADANIA = [
  { id: 'V1', osoba: 'O1', galaz: 'o1/v1-kontrakt', po: [] },
  { id: 'V2a', osoba: 'O1', galaz: 'o1/v2a-najblizszy-adres', po: ['V1'] },
  { id: 'V2b', osoba: 'O1', galaz: 'o1/v2b-lokalizacja', po: ['V1', 'V2a'] },
  { id: 'S1', osoba: 'O2', galaz: 'o2/s1-karta-syreny', po: ['V1'] },
  { id: 'S3', osoba: 'O2', galaz: 'o2/s3-karta-bliskich', po: ['V1'] },
  { id: 'L3', osoba: 'O4', galaz: 'o4/l3-rowery', po: ['V1'] },
];

const TERAZ = Date.parse('2026-10-17T20:00:00Z');
const temu = (minuty) => new Date(TERAZ - minuty * 60_000).toISOString();
const pr = (number, title, headRefName, state, extra = {}) => ({
  number, title, headRefName, state, baseRefName: 'main', isDraft: false, url: `https://x/${number}`, ...extra,
});
const stan = (zadania, prs, galezie = {}) => Object.fromEntries(stanZadan(zadania, prs, galezie, TERAZ).map((z) => [z.id, z]));
const V1_ZROBIONE = pr(23, '[kontrakt] V1: karty', 'o1/v1-kontrakt', 'MERGED', { mergedAt: temu(300) });

test('PR pasuje po gałęzi albo po tytule z ID (także z [kontrakt]), ale V2 nie pasuje do V2a', () => {
  assert.equal(pasujePR(ZADANIA[0], pr(23, '[kontrakt] V1: karty', 'o1/inna', 'MERGED')), true);
  assert.equal(pasujePR(ZADANIA[3], pr(30, 'cokolwiek', 'o2/s1-karta-syreny', 'OPEN')), true);
  assert.equal(pasujePR(ZADANIA[3], pr(31, 'S1: karta Syreny', 'o2/inna', 'OPEN')), true);
  assert.equal(pasujePR({ id: 'V2', osoba: 'O1', galaz: 'o1/v2' }, pr(32, 'V2a: adres', 'o1/v2a-x', 'OPEN')), false);
  assert.equal(pasujePR(ZADANIA[3], pr(33, 'S10: inne', 'o2/s10', 'OPEN')), false);
});

test('tytuł liczy się tylko z gałęzi właściciela albo O1: stary PR O4 „P3: prezentacja” nie zamyka zadania P3 z O3', () => {
  const p3 = { id: 'P3', osoba: 'O3', galaz: 'o3/p3-karta-medyczna', po: [] };
  assert.equal(pasujePR(p3, pr(9, 'P3: prezentacja', 'o4/p3-prezentacja', 'MERGED')), false);
  assert.equal(pasujePR(p3, pr(50, 'P3: karta medyczna', 'o3/p3-inna-nazwa', 'OPEN')), true);
  assert.equal(pasujePR(p3, pr(51, 'P3: przejęte', 'o1/p3-przejete', 'OPEN')), true);
});

test('scalone = zrobione, otwarty PR albo świeża gałąź = w toku, reszta gotowe albo czeka z listą braków', () => {
  const prs = [V1_ZROBIONE, pr(40, 'S1: karta', 'o2/s1-karta-syreny', 'OPEN')];
  const galezie = { main: temu(500), 'o1/v1-kontrakt': temu(300), 'o2/s1-karta-syreny': temu(5), 'o4/l3-rowery': temu(5) };
  const s = stan(ZADANIA, prs, galezie);
  assert.equal(s.V1.stan, 'zrobione');
  assert.equal(s.V2a.stan, 'gotowe');
  assert.equal(s.V2b.stan, 'czeka');
  assert.deepEqual(s.V2b.brakuje, ['V2a']);
  assert.equal(s.S1.stan, 'w_toku');
  assert.equal(s.S1.pr.number, 40);
  assert.equal(s.L3.stan, 'w_toku'); // gałąź zajęta, PR jeszcze nie ma
  assert.equal(s.L3.pr, null);
  assert.equal(s.S3.stan, 'gotowe');
});

test('PR scalony do innej gałęzi niż main nie zamyka zadania ani zależności', () => {
  const prs = [pr(23, '[kontrakt] V1: karty', 'o1/v1-kontrakt', 'MERGED', { baseRefName: 'o1/inna-baza', mergedAt: temu(300) })];
  const s = stan(ZADANIA, prs);
  assert.equal(s.V1.stan, 'gotowe');
  assert.equal(s.V2a.stan, 'czeka');
  assert.deepEqual(s.V2a.brakuje, ['V1']);
});

test('zamknięty bez scalenia PR = porzucone (porzuconeOd = zamknięcie), a świeża gałąź nadal oznacza pracę', () => {
  const zamkniety = pr(41, 'L3: rowery', 'o4/l3-rowery', 'CLOSED', { closedAt: temu(10) });
  const bezGalezi = stan(ZADANIA, [V1_ZROBIONE, zamkniety], { main: temu(500) });
  assert.equal(bezGalezi.L3.stan, 'porzucone');
  assert.equal(bezGalezi.L3.porzuconeOd, zamkniety.closedAt);
  assert.deepEqual(bezGalezi.L3.zamkniety, { number: 41, url: 'https://x/41' });
  const zeSwiezaGalezia = stan(ZADANIA, [V1_ZROBIONE, zamkniety], { 'o4/l3-rowery': temu(3) });
  assert.equal(zeSwiezaGalezia.L3.stan, 'w_toku');
  const nowyPR = pr(42, 'L3: rowery', 'o4/l3-rowery', 'OPEN');
  assert.equal(stan(ZADANIA, [V1_ZROBIONE, nowyPR, zamkniety]).L3.stan, 'w_toku');
});

test('gałąź bez PR: młodsza niż 90 minut = w toku, starsza = porzucone, nieznany czas = w toku', () => {
  const prs = [V1_ZROBIONE];
  assert.equal(stan(ZADANIA, prs, { 'o4/l3-rowery': temu(89) }).L3.stan, 'w_toku');
  const stara = stan(ZADANIA, prs, { 'o4/l3-rowery': temu(91) }).L3;
  assert.equal(stara.stan, 'porzucone');
  assert.equal(stara.porzuconeOd, temu(91));
  assert.equal(stara.zamkniety, null);
  assert.equal(stan(ZADANIA, prs, { 'o4/l3-rowery': null }).L3.stan, 'w_toku');
});

test('otwarty PR (także wersja robocza) nigdy nie jest porzucony, nawet ze starą gałęzią', () => {
  const szkic = pr(43, 'L3: rowery', 'o4/l3-rowery', 'OPEN', { isDraft: true });
  const l3 = stan(ZADANIA, [V1_ZROBIONE, szkic], { 'o4/l3-rowery': temu(600) }).L3;
  assert.equal(l3.stan, 'w_toku');
  assert.equal(l3.pr.isDraft, true);
  assert.equal(l3.pr.baseRefName, 'main');
  assert.equal(l3.pr.headRefName, 'o4/l3-rowery');
});

test('stara gałąź zadania, które wciąż czeka na zależność, to czeka (nie porzucone)', () => {
  const s = stan(ZADANIA, [], { 'o1/v2b-lokalizacja': temu(600) });
  assert.equal(s.V2b.stan, 'czeka');
});

test('przejęcie: o1/<id>-przejete liczy się jako gałąź zadania, a PR z niej zamyka zadanie', () => {
  assert.equal(galazPrzejeta({ id: 'L3' }), 'o1/l3-przejete');
  const galezie = { 'o4/l3-rowery': temu(120), 'o1/l3-przejete': temu(2) };
  assert.equal(stan(ZADANIA, [V1_ZROBIONE], { 'o4/l3-rowery': temu(120) }).L3.stan, 'porzucone');
  assert.equal(stan(ZADANIA, [V1_ZROBIONE], galezie).L3.stan, 'w_toku');
  const scalony = pr(60, 'L3: rowery', 'o1/l3-przejete', 'MERGED', { mergedAt: temu(1) });
  assert.equal(stan(ZADANIA, [V1_ZROBIONE, scalony], galezie).L3.stan, 'zrobione');
});

test('gotoweOd = czas scalenia ostatniej zależności, a przy kilku scalonych PR zadania liczy się najwcześniejszy', () => {
  const prs = [
    { ...pr(23, '[kontrakt] V1', 'o1/v1-kontrakt', 'MERGED'), mergedAt: '2026-10-17T17:55:00Z' },
    { ...pr(24, 'V2a: adres', 'o1/v2a-najblizszy-adres', 'MERGED'), mergedAt: '2026-10-17T18:30:00Z' },
  ];
  const s = stan(ZADANIA, prs);
  assert.equal(s.V2b.gotoweOd, '2026-10-17T18:30:00Z');
  assert.equal(s.S1.gotoweOd, '2026-10-17T17:55:00Z');
  assert.equal(stan([{ id: 'P1', osoba: 'O3', galaz: 'o3/p1', po: [] }], []).P1.gotoweOd, null);
  // Zadanie scalono dwa razy (np. poprawka po scaleniu): gh podaje nowsze PR-y pierwsze, liczy się pierwsze scalenie.
  const dwa = [
    { ...pr(30, 'V1: poprawka', 'o1/v1-poprawka', 'MERGED'), mergedAt: '2026-10-17T19:40:00Z' },
    { ...pr(23, '[kontrakt] V1', 'o1/v1-kontrakt', 'MERGED'), mergedAt: '2026-10-17T17:55:00Z' },
  ];
  assert.equal(stan(ZADANIA, dwa).S1.gotoweOd, '2026-10-17T17:55:00Z');
});

test('nieznana zależność jest zgłaszana jako brak, a nie po cichu pomijana', () => {
  const s = stanZadan([{ id: 'X1', osoba: 'O3', galaz: 'o3/x1', po: ['NIEMA'] }], [], {}, TERAZ);
  assert.equal(s[0].stan, 'czeka');
  assert.deepEqual(s[0].brakuje, ['NIEMA']);
});

test('miekkie nie blokują startu, ale stan podaje, których jeszcze nie ma', () => {
  const v6 = { id: 'V6', osoba: 'O1', galaz: 'o1/v6', po: ['V1'], miekkie: ['S1', 'L3'] };
  const prs = [V1_ZROBIONE, pr(40, 'S1: karta', 'o2/s1-karta-syreny', 'MERGED', { mergedAt: temu(30) })];
  const s = stan([...ZADANIA, v6], prs).V6;
  assert.equal(s.stan, 'gotowe');
  assert.deepEqual(s.miekkieBrakuje, ['L3']);
});

test('parsujGalezie czyta wyjście git for-each-ref i pomija origin/HEAD', () => {
  const tekst = [
    'refs/remotes/origin/HEAD 2026-10-17T20:13:29+02:00',
    'refs/remotes/origin/main 2026-10-17T20:13:29+02:00',
    'refs/remotes/origin/o2/s1-karta-syreny 2026-10-17T19:00:00+02:00',
    '',
  ].join('\n');
  assert.deepEqual(parsujGalezie(tekst), {
    main: '2026-10-17T20:13:29+02:00',
    'o2/s1-karta-syreny': '2026-10-17T19:00:00+02:00',
  });
});

test('zadania-v3.json: ID-y są unikalne, a zależności i miękkie zależności istnieją', () => {
  const zadania = JSON.parse(readFileSync(new URL('../docs/zadania-v3.json', import.meta.url), 'utf8'));
  const idy = zadania.map((z) => z.id);
  assert.equal(new Set(idy).size, idy.length);
  for (const z of zadania) {
    for (const id of [...z.po, ...(z.miekkie ?? [])]) assert.ok(idy.includes(id), `${z.id}: nieznane ID „${id}”`);
    assert.ok(z.galaz.startsWith(`${z.osoba.toLowerCase()}/`), `${z.id}: gałąź spoza pasa ${z.osoba}`);
  }
  const v6 = zadania.find((z) => z.id === 'V6');
  assert.deepEqual(v6.po, ['V4', 'V5b']);
  assert.deepEqual(v6.miekkie, ['S1', 'P2', 'P3', 'L2', 'S3']);
});

test('CLI: nieznany pas kończy się kodem 2 z opisem użycia, także gdy skrypt jest uruchomiony przez symlink', () => {
  const skrypt = fileURLToPath(new URL('./stan.mjs', import.meta.url));
  const bezposrednio = spawnSync(process.execPath, [skrypt, 'xx'], { encoding: 'utf8' });
  assert.equal(bezposrednio.status, 2);
  assert.match(bezposrednio.stderr, /Użycie: node scripts\/stan\.mjs/);
  const katalog = mkdtempSync(join(tmpdir(), 'stan-'));
  try {
    const link = join(katalog, 'stan-link.mjs');
    symlinkSync(skrypt, link);
    assert.equal(spawnSync(process.execPath, [link, 'xx'], { encoding: 'utf8' }).status, 2);
  } finally {
    rmSync(katalog, { recursive: true, force: true });
  }
});
