#!/usr/bin/env node
// Stan zadań PLAN-v3 z GitHuba: co zrobione, w toku, porzucone, gotowe do startu i na co czeka.
// Użycie: node scripts/stan.mjs <O1|O2|O3|O4|wszyscy> [--json]
// Zrobione = PR scalony do main, z gałęzi zadania albo z tytułem „<ID>: …” / „[kontrakt] <ID>: …”.
// W toku = otwarty PR (także wersja robocza) albo gałąź na origin z commitem młodszym niż 90 minut
//   (pętla zajmuje zadanie, pushując pustą gałąź).
// Porzucone = zamknięty PR bez scalenia albo gałąź bez PR, na której od 90 minut nic się nie zmieniło.
// Gałąź zadania to `galaz` z zadania albo `o1/<id>-przejete` (tak nazywa się przejęcie przez autopilota).
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PROG_PORZUCENIA_MIN = 90;
const PASY = ['O1', 'O2', 'O3', 'O4', 'wszyscy'];

export const galazPrzejeta = (z) => `o1/${z.id.toLowerCase()}-przejete`;
const galezieZadania = (z) => [z.galaz, galazPrzejeta(z)];

export function pasujePR(z, pr) {
  if (galezieZadania(z).includes(pr.headRefName)) return true;
  // Po tytule tylko z gałęzi właściciela albo O1 (przejęcia), bo stare pasy miały podobne ID (np. o4/p3-prezentacja).
  const zPasa = [`${z.osoba.toLowerCase()}/`, 'o1/'].some((p) => pr.headRefName.startsWith(p));
  return zPasa && new RegExp(`^(\\[kontrakt\\]\\s*)?${z.id}(?![0-9A-Za-z])`).test(pr.title.trim());
}

const ms = (iso) => Date.parse(iso);
const wybierz = (czasy, lepszy) => {
  const ok = czasy.filter(Boolean);
  return ok.length ? ok.reduce((a, b) => (lepszy(ms(a), ms(b)) ? a : b)) : null;
};
const najwczesniej = (czasy) => wybierz(czasy, (a, b) => a <= b);
const najpozniej = (czasy) => wybierz(czasy, (a, b) => a >= b);

// galezie: { nazwa gałęzi na origin: ISO czasu jej ostatniego commita (null = nieznany) }.
// teraz: milisekundy, do sprawdzenia, czy gałąź bez PR jest już porzucona.
export function stanZadan(zadania, prs, galezie, teraz = Date.now()) {
  // id zadania → czas scalenia jego PR do main (najwcześniejszy, gdy PR-ów było kilka).
  const scalone = new Map();
  for (const z of zadania) {
    const p = prs.filter((p) => p.state === 'MERGED' && p.baseRefName === 'main' && pasujePR(z, p));
    if (p.length) scalone.set(z.id, najwczesniej(p.map((x) => x.mergedAt)));
  }
  return zadania.map((z) => {
    const brakuje = z.po.filter((id) => !scalone.has(id));
    // Od kiedy zadanie mogło ruszyć: scalenie ostatniej zależności (null = bez zależności).
    const gotoweOd = brakuje.length ? null : najpozniej(z.po.map((id) => scalone.get(id)));
    const miekkieBrakuje = (z.miekkie ?? []).filter((id) => !scalone.has(id));

    const moje = prs.filter((p) => pasujePR(z, p));
    const otwarty = moje.find((p) => p.state === 'OPEN') ?? null;
    const zamkniete = moje.filter((p) => p.state === 'CLOSED');
    const tipy = galezieZadania(z)
      .filter((g) => Object.hasOwn(galezie, g))
      .map((g) => galezie[g]);
    // Nieznany czas commitu liczymy jak świeży: lepiej poczekać niż przejąć cudzą pracę.
    const swieza = tipy.some((t) => !t || teraz - ms(t) < PROG_PORZUCENIA_MIN * 60_000);

    let stan;
    let porzuconeOd = null;
    if (scalone.has(z.id)) stan = 'zrobione';
    else if (otwarty || swieza) stan = 'w_toku';
    else if (brakuje.length) stan = 'czeka';
    else if (tipy.length || zamkniete.length) {
      stan = 'porzucone';
      porzuconeOd = najpozniej([...tipy, ...zamkniete.map((p) => p.closedAt)]);
    } else stan = 'gotowe';

    const pr = otwarty && {
      number: otwarty.number,
      url: otwarty.url,
      title: otwarty.title,
      headRefName: otwarty.headRefName,
      baseRefName: otwarty.baseRefName,
      isDraft: otwarty.isDraft,
    };
    const zamkniety = zamkniete[0] && { number: zamkniete[0].number, url: zamkniete[0].url };
    return { ...z, stan, brakuje, miekkieBrakuje, gotoweOd, porzuconeOd, pr, zamkniety: zamkniety ?? null };
  });
}

// Wyjście `git for-each-ref --format='%(refname) %(committerdate:iso-strict)' refs/remotes/origin`.
export function parsujGalezie(tekst) {
  const prefiks = 'refs/remotes/origin/';
  const galezie = {};
  for (const linia of tekst.split('\n').filter(Boolean)) {
    const i = linia.lastIndexOf(' ');
    const ref = linia.slice(0, i);
    if (i < 0 || !ref.startsWith(prefiks)) continue;
    const nazwa = ref.slice(prefiks.length);
    if (nazwa !== 'HEAD') galezie[nazwa] = linia.slice(i + 1) || null;
  }
  return galezie;
}

const uruchom = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function pobierz() {
  // --prune: bez tego usunięte gałęzie zostają w refs/remotes i wyglądałyby na zajęte.
  uruchom('git', ['fetch', '-q', '--prune', 'origin']);
  const prs = JSON.parse(
    uruchom('gh', [
      'pr', 'list', '--state', 'all', '--limit', '300',
      '--json', 'number,title,headRefName,baseRefName,state,url,mergedAt,closedAt,isDraft',
    ]),
  );
  if (!prs.length) throw new Error('gh zwrócił 0 PR-ów: sprawdź `gh auth status` i czy jesteś w katalogu repo.');
  const galezie = parsujGalezie(
    uruchom('git', ['for-each-ref', '--format=%(refname) %(committerdate:iso-strict)', 'refs/remotes/origin']),
  );
  return { prs, galezie };
}

const NAZWY = {
  gotowe: 'GOTOWE DO STARTU',
  porzucone: 'PORZUCONE (do wznowienia albo przejęcia)',
  w_toku: 'W TOKU',
  czeka: 'CZEKA',
  zrobione: 'ZROBIONE',
};
const WARSZAWA = { timeZone: 'Europe/Warsaw' };
const godzina = (iso) => new Date(iso).toLocaleTimeString('pl-PL', { ...WARSZAWA, hour: '2-digit', minute: '2-digit' });

function dopisek(z) {
  if (z.stan === 'czeka') return ` (czeka na: ${z.brakuje.join(', ')})`;
  if (z.stan === 'porzucone') {
    const od = z.porzuconeOd ? `, od ${godzina(z.porzuconeOd)}` : '';
    return z.zamkniety ? ` (PR #${z.zamkniety.number} zamknięty bez scalenia${od})` : ` (gałąź bez PR i bez nowych commitów${od})`;
  }
  if (z.pr) return ` (PR #${z.pr.number}${z.pr.isDraft ? ', wersja robocza' : ''})`;
  if (z.stan === 'w_toku') return ' (gałąź zajęta, bez PR)';
  if (z.stan === 'gotowe' && z.miekkieBrakuje.length) return ` (miękkie niezrobione: ${z.miekkieBrakuje.join(', ')})`;
  return '';
}

function main() {
  const argumenty = process.argv.slice(2);
  const flagi = argumenty.filter((a) => a.startsWith('--'));
  const kto = argumenty.find((a) => !a.startsWith('--')) ?? 'wszyscy';
  if (!PASY.includes(kto)) {
    console.error(`Nieznany pas „${kto}”.\nUżycie: node scripts/stan.mjs <${PASY.join('|')}> [--json]`);
    process.exit(2);
  }
  const zadania = JSON.parse(readFileSync(new URL('../docs/zadania-v3.json', import.meta.url), 'utf8'));
  let prs, galezie;
  try {
    ({ prs, galezie } = pobierz());
  } catch (e) {
    console.error(`stan.mjs: nie udało się pobrać stanu z GitHuba: ${String(e.stderr || e.message).trim()}`);
    process.exit(1);
  }
  const wszystkie = stanZadan(zadania, prs, galezie);
  const moje = kto === 'wszyscy' ? wszystkie : wszystkie.filter((z) => z.osoba === kto);
  // PR-y [kontrakt] z innych pasów przegląda i scala pętla O1 (czyli też `wszyscy`).
  const kontrakty =
    kto === 'O1' || kto === 'wszyscy'
      ? prs
          .filter((p) => p.state === 'OPEN' && /^\[kontrakt\]/.test(p.title) && !p.headRefName.startsWith('o1/'))
          .map((p) => ({ number: p.number, url: p.url, title: p.title, galaz: p.headRefName, isDraft: p.isDraft, baseRefName: p.baseRefName }))
      : null;
  const wynik = { kto, stanNa: new Date().toISOString(), zadania: moje, ...(kontrakty ? { kontrakty } : {}) };

  if (flagi.includes('--json')) {
    console.log(JSON.stringify(wynik, null, 2));
    return;
  }
  console.log(`Pas ${kto}, stan z GitHuba na ${new Date().toLocaleTimeString('pl-PL', WARSZAWA)} (Warszawa)`);
  for (const stan of ['gotowe', 'porzucone', 'w_toku', 'czeka', 'zrobione']) {
    const lista = moje.filter((z) => z.stan === stan);
    if (!lista.length) continue;
    console.log(`\n${NAZWY[stan]}:`);
    for (const z of lista) {
      console.log(`  ${z.id} ${z.tytul ?? ''} [${z.galaz}]${dopisek(z)}${z.czlowiek && stan !== 'zrobione' ? `\n     człowiek: ${z.czlowiek}` : ''}`);
    }
  }
  if (kontrakty?.length) {
    console.log('\nPR [kontrakt] DO PRZEGLĄDU:');
    for (const k of kontrakty) console.log(`  #${k.number} ${k.title} [${k.galaz}]${k.isDraft ? ' (wersja robocza)' : ''}`);
  }
}

// Uruchomienie bezpośrednie także przez symlink (argv[1] bywa ścieżką symlinku, import.meta.url zawsze prawdziwą).
const uruchomionyJakoSkrypt = (() => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (uruchomionyJakoSkrypt) main();
