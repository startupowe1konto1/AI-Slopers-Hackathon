// Uruchom: node --test scripts/
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stanZadan, pasujePR } from './stan.mjs';

const ZADANIA = [
  { id: 'V1', osoba: 'O1', galaz: 'o1/v1-kontrakt', po: [] },
  { id: 'V2a', osoba: 'O1', galaz: 'o1/v2a-najblizszy-adres', po: ['V1'] },
  { id: 'V2b', osoba: 'O1', galaz: 'o1/v2b-lokalizacja', po: ['V1', 'V2a'] },
  { id: 'S1', osoba: 'O2', galaz: 'o2/s1-karta-syreny', po: ['V1'] },
  { id: 'S3', osoba: 'O2', galaz: 'o2/s3-karta-bliskich', po: ['V1', 'L3'] },
  { id: 'L3', osoba: 'O4', galaz: 'o4/l3-rowery', po: ['V1'] },
];

const pr = (number, title, headRefName, state) => ({ number, title, headRefName, state, url: `https://x/${number}` });

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

test('scalone = zrobione, otwarty PR albo sama gałąź = w toku, reszta gotowe albo czeka z listą braków', () => {
  const prs = [pr(23, '[kontrakt] V1: karty', 'o1/v1-kontrakt', 'MERGED'), pr(40, 'S1: karta', 'o2/s1-karta-syreny', 'OPEN')];
  const galezie = ['main', 'o1/v1-kontrakt', 'o2/s1-karta-syreny', 'o4/l3-rowery'];
  const s = Object.fromEntries(stanZadan(ZADANIA, prs, galezie).map((z) => [z.id, z]));
  assert.equal(s.V1.stan, 'zrobione');
  assert.equal(s.V2a.stan, 'gotowe');
  assert.equal(s.V2b.stan, 'czeka');
  assert.deepEqual(s.V2b.brakuje, ['V2a']);
  assert.equal(s.S1.stan, 'w_toku');
  assert.equal(s.S1.pr.number, 40);
  assert.equal(s.L3.stan, 'w_toku'); // gałąź zajęta, PR jeszcze nie ma
  assert.equal(s.L3.pr, null);
  assert.equal(s.S3.stan, 'czeka');
  assert.deepEqual(s.S3.brakuje, ['L3']);
});

test('zamknięty bez scalenia PR nie blokuje: zadanie wraca do gotowych, gdy gałęzi już nie ma', () => {
  const prs = [pr(23, '[kontrakt] V1', 'o1/v1-kontrakt', 'MERGED'), pr(41, 'L3: rowery', 'o4/l3-rowery', 'CLOSED')];
  const s = stanZadan(ZADANIA, prs, ['main']).find((z) => z.id === 'L3');
  assert.equal(s.stan, 'gotowe');
});

test('gotoweOd = czas scalenia ostatniej zależności (do zasady przejmowania cudzych pasów)', () => {
  const prs = [
    { ...pr(23, '[kontrakt] V1', 'o1/v1-kontrakt', 'MERGED'), mergedAt: '2026-10-17T17:55:00Z' },
    { ...pr(24, 'V2a: adres', 'o1/v2a-najblizszy-adres', 'MERGED'), mergedAt: '2026-10-17T18:30:00Z' },
  ];
  const s = Object.fromEntries(stanZadan(ZADANIA, prs, []).map((z) => [z.id, z]));
  assert.equal(s.V2b.gotoweOd, '2026-10-17T18:30:00Z');
  assert.equal(s.S1.gotoweOd, '2026-10-17T17:55:00Z');
  assert.equal(stanZadan([{ id: 'P1', osoba: 'O3', galaz: 'o3/p1', po: [] }], [], [])[0].gotoweOd, null);
});

test('nieznana zależność jest zgłaszana jako brak, a nie po cichu pomijana', () => {
  const s = stanZadan([{ id: 'X1', osoba: 'O3', galaz: 'o3/x1', po: ['NIEMA'] }], [], []);
  assert.equal(s[0].stan, 'czeka');
  assert.deepEqual(s[0].brakuje, ['NIEMA']);
});
