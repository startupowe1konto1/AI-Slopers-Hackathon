// Godziny otwarcia z OpenStreetMap (opening_hours, np. „Mo-Fr 08:00-20:00; Sa-Su off”) po polsku.
// Tylko skróty dni i typowe słowa; reguł OSM nie interpretujemy (DECYZJE-v3 O3-3: tłumaczenie skrótów po 24:00).
const DNI: Record<string, string> = { Mo: 'pn', Tu: 'wt', We: 'śr', Th: 'czw', Fr: 'pt', Sa: 'sob', Su: 'nd', PH: 'święta' };

export function godzinyPoPolsku(godziny: string): string {
  return godziny
    .replace(/"([^"]*)"/g, '$1')
    .replace(/\b(?:on|by) appointment\b/gi, 'po umówieniu')
    .replace(/\b24\/7\b/g, 'całą dobę')
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)(?![a-z])(\d)?/g, (_, d: string, cyfra?: string) => DNI[d] + (cyfra ? ` ${cyfra}` : ''))
    .replace(/\boff\b/g, 'nieczynne')
    .replace(/\s*-\s*/g, '–')
    .replace(/,(?=\S)/g, ', ');
}
