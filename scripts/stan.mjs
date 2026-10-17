#!/usr/bin/env node
// Stan zadań PLAN-v3 z GitHuba: co zrobione, w toku, gotowe do startu, na co czeka.
// Użycie: node scripts/stan.mjs <O1|O2|O3|O4|wszyscy> [--json]
// Zrobione = scalony PR z gałęzi zadania albo z tytułem „<ID>: …” / „[kontrakt] <ID>: …”.
// W toku = otwarty PR albo sama gałąź na origin (pętla zajmuje zadanie, pushując pustą gałąź).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function pasujePR(z, pr) {
  if (pr.headRefName === z.galaz) return true;
  // Po tytule tylko z gałęzi właściciela albo O1 (przejęcia), bo stare pasy miały podobne ID (np. o4/p3-prezentacja).
  const zPasa = [`${z.osoba.toLowerCase()}/`, 'o1/'].some((p) => pr.headRefName.startsWith(p));
  return zPasa && new RegExp(`^(\\[kontrakt\\]\\s*)?${z.id}(?![0-9A-Za-z])`).test(pr.title.trim());
}

export function stanZadan(zadania, prs, galezie) {
  // id zadania → czas scalenia jego PR (pierwszy pasujący scalony PR).
  const scalone = new Map();
  for (const z of zadania) {
    const p = prs.find((p) => p.state === 'MERGED' && pasujePR(z, p));
    if (p) scalone.set(z.id, p.mergedAt ?? null);
  }
  return zadania.map((z) => {
    const brakuje = z.po.filter((id) => !scalone.has(id));
    // Od kiedy zadanie mogło ruszyć: scalenie ostatniej zależności (null = bez zależności).
    const czasy = z.po.map((id) => scalone.get(id)).filter(Boolean).sort();
    const gotoweOd = brakuje.length ? null : (czasy.at(-1) ?? null);
    const otwarty = prs.find((p) => p.state === 'OPEN' && pasujePR(z, p)) ?? null;
    let stan;
    if (scalone.has(z.id)) stan = 'zrobione';
    else if (otwarty || galezie.includes(z.galaz)) stan = 'w_toku';
    else stan = brakuje.length ? 'czeka' : 'gotowe';
    return { ...z, stan, brakuje, gotoweOd, pr: otwarty && { number: otwarty.number, url: otwarty.url, title: otwarty.title } };
  });
}

function pobierz() {
  const prs = JSON.parse(
    execFileSync('gh', ['pr', 'list', '--state', 'all', '--limit', '300', '--json', 'number,title,headRefName,state,url,mergedAt'], {
      encoding: 'utf8',
    }),
  );
  const galezie = execFileSync('git', ['ls-remote', '--heads', 'origin'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('refs/heads/')[1]);
  return { prs, galezie };
}

const NAZWY = { gotowe: 'GOTOWE DO STARTU', w_toku: 'W TOKU', czeka: 'CZEKA', zrobione: 'ZROBIONE' };

function main() {
  const [kto = 'wszyscy', ...flagi] = process.argv.slice(2);
  const zadania = JSON.parse(readFileSync(new URL('../docs/zadania-v3.json', import.meta.url), 'utf8'));
  const { prs, galezie } = pobierz();
  const wszystkie = stanZadan(zadania, prs, galezie);
  const moje = kto === 'wszyscy' ? wszystkie : wszystkie.filter((z) => z.osoba === kto);
  // PR-y [kontrakt] z innych pasów przegląda i scala pętla O1.
  const kontrakty = prs
    .filter((p) => p.state === 'OPEN' && /^\[kontrakt\]/.test(p.title) && !p.headRefName.startsWith('o1/'))
    .map((p) => ({ number: p.number, url: p.url, title: p.title, galaz: p.headRefName }));
  const wynik = { kto, stanNa: new Date().toISOString(), zadania: moje, ...(kto === 'O1' ? { kontrakty } : {}) };

  if (flagi.includes('--json')) {
    console.log(JSON.stringify(wynik, null, 2));
    return;
  }
  console.log(`Pas ${kto}, stan z GitHuba na ${new Date().toLocaleTimeString('pl-PL')}`);
  for (const stan of ['gotowe', 'w_toku', 'czeka', 'zrobione']) {
    const lista = moje.filter((z) => z.stan === stan);
    if (!lista.length) continue;
    console.log(`\n${NAZWY[stan]}:`);
    for (const z of lista) {
      const extra = stan === 'czeka' ? ` (czeka na: ${z.brakuje.join(', ')})` : z.pr ? ` (PR #${z.pr.number})` : stan === 'w_toku' ? ' (gałąź zajęta, bez PR)' : '';
      console.log(`  ${z.id} ${z.tytul ?? ''} [${z.galaz}]${extra}${z.czlowiek && stan !== 'zrobione' ? `\n     człowiek: ${z.czlowiek}` : ''}`);
    }
  }
  if (kto === 'O1' && kontrakty.length) {
    console.log('\nPR [kontrakt] DO PRZEGLĄDU:');
    for (const k of kontrakty) console.log(`  #${k.number} ${k.title} [${k.galaz}]`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
