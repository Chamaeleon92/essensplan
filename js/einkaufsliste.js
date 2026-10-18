// Berechnet die Einkaufsliste aus mehreren Rezepten.
//
// - Gleiche Zutaten (egal ob groß oder klein geschrieben) werden zusammengefasst.
// - g und kg bzw. ml und l werden ineinander umgerechnet (800 g + 400 g = 1,2 kg).
// - Andere Einheiten werden nur addiert, wenn sie gleich sind (2 EL + 1 EL = 3 EL).
//   Unterschiedliche Einheiten bleiben getrennt: "2 EL + 100 ml Olivenöl".
// - "nach Geschmack" (oder Zutaten ganz ohne Menge) erscheinen nur mit Namen.

import { zahl, mengeText } from './hilfen.js';

// Einheiten, die ineinander umgerechnet werden: Einheit → [Grundeinheit, Faktor]
const UMRECHNUNG = {
  g: ['g', 1],
  kg: ['g', 1000],
  ml: ['ml', 1],
  l: ['ml', 1000],
};

// Gibt eine alphabetisch sortierte Liste zurück: [{ name: 'Zwiebeln', menge: '3 Stück' }, …]
// menge ist '' bei Zutaten "nach Geschmack".
export function einkaufslisteBerechnen(rezepte) {
  const zutaten = new Map(); // klein geschriebener Name → { name, mengen: Map(Einheit → Summe) }

  for (const rezept of rezepte) {
    for (const zutat of rezept.zutaten) {
      const schluessel = zutat.name.toLocaleLowerCase('de');
      if (!zutaten.has(schluessel)) {
        zutaten.set(schluessel, { name: zutat.name, mengen: new Map() });
      }
      if (zutat.menge == null || zutat.einheit === 'nach Geschmack') continue;

      const [einheit, faktor] = UMRECHNUNG[zutat.einheit] ?? [zutat.einheit, 1];
      const mengen = zutaten.get(schluessel).mengen;
      mengen.set(einheit, (mengen.get(einheit) ?? 0) + zutat.menge * faktor);
    }
  }

  return [...zutaten.values()]
    .map(({ name, mengen }) => ({
      name,
      menge: [...mengen].map(([einheit, summe]) => mengeAnzeigen(summe, einheit)).join(' + '),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

// Große Mengen in kg bzw. l anzeigen: 1200 g → "1,2 kg"
function mengeAnzeigen(summe, einheit) {
  if (einheit === 'g' && summe >= 1000) return `${zahl(summe / 1000)} kg`;
  if (einheit === 'ml' && summe >= 1000) return `${zahl(summe / 1000)} l`;
  return mengeText(summe, einheit);
}

// Der Text zum Kopieren, z. B. für die Notizen-App
export function einkaufslisteText(liste, titel) {
  const zeilen = liste.map(({ name, menge }) => (menge ? `• ${menge} ${name}` : `• ${name} (nach Geschmack)`));
  return `${titel}\n\n${zeilen.join('\n')}\n`;
}
