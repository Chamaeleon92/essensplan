// Hilfsfunktionen rund ums Datum. Die Woche beginnt am Montag.

// Datum → "2026-10-20". So werden Tage im Kalender gespeichert.
export function schluessel(datum) {
  const j = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, '0');
  const t = String(datum.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}

// "2026-10-20" → Datum
export function ausSchluessel(text) {
  const [j, m, t] = text.split('-').map(Number);
  return new Date(j, m - 1, t);
}

export function plusTage(datum, anzahl) {
  const neu = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate());
  neu.setDate(neu.getDate() + anzahl);
  return neu;
}

// Montag der Woche, in der das Datum liegt
export function wochenStart(datum) {
  const tagImWoche = (datum.getDay() + 6) % 7; // Montag = 0 … Sonntag = 6
  return plusTage(datum, -tagImWoche);
}

export function wochenTage(datum) {
  const montag = wochenStart(datum);
  return Array.from({ length: 7 }, (_, i) => plusTage(montag, i));
}

// Alle Tage, die in der Monatsansicht zu sehen sind: von Montag vor dem 1.
// bis Sonntag nach dem Monatsletzten (immer ganze Wochen).
export function monatsTage(datum) {
  const erster = new Date(datum.getFullYear(), datum.getMonth(), 1);
  const letzter = new Date(datum.getFullYear(), datum.getMonth() + 1, 0);
  const tage = [];
  for (let tag = wochenStart(erster); tag <= letzter || tage.length % 7 !== 0; tag = plusTage(tag, 1)) {
    tage.push(tag);
  }
  return tage;
}

export function gleicherTag(a, b) {
  return schluessel(a) === schluessel(b);
}

// Kalenderwoche nach ISO-Norm (wie in deutschen Kalendern)
export function kalenderwoche(datum) {
  const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  const wochentag = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - wochentag);
  const jahresanfang = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - jahresanfang) / 86400000 + 1) / 7);
}

const format = (optionen) => new Intl.DateTimeFormat('de-DE', optionen);
const tagKurz = format({ weekday: 'short' });
const tagMonat = format({ day: 'numeric', month: 'numeric' });
const tagLangFormat = format({ weekday: 'long', day: 'numeric', month: 'long' });
const monatJahr = format({ month: 'long', year: 'numeric' });
const tagMonatLang = format({ day: 'numeric', month: 'short' });

export const wochentagKurz = (datum) => tagKurz.format(datum).replace('.', ''); // "Mo"
export const datumKurz = (datum) => tagMonat.format(datum);                      // "20.10."
export const datumLang = (datum) => tagLangFormat.format(datum);                 // "Montag, 20. Oktober"
export const monatText = (datum) => monatJahr.format(datum);                     // "Oktober 2026"

// "20.–26. Okt. 2026" oder über den Monatswechsel "27. Okt. – 2. Nov. 2026"
export function wochenText(tage) {
  const erster = tage[0];
  const letzter = tage[tage.length - 1];
  const jahr = letzter.getFullYear();
  if (erster.getMonth() === letzter.getMonth()) {
    return `${erster.getDate()}.–${tagMonatLang.format(letzter)} ${jahr}`;
  }
  return `${tagMonatLang.format(erster)} – ${tagMonatLang.format(letzter)} ${jahr}`;
}
