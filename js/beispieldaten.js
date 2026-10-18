// Beispielrezepte zum Ausprobieren. Werden über "Beispielrezepte laden" (Rezepte oder Kategorien)
// oder die Adresse #/beispieldaten angelegt. Rezepte, deren Titel es schon gibt, werden übersprungen.

import { alleRezepte, alleKategorien, speichern, neueId, planImZeitraum, planEintragen } from './db.js';
import { schluessel, wochenStart, plusTage } from './datum.js';
import { gleicherName } from './hilfen.js';

const z = (name, menge, einheit) => ({ name, menge, einheit });
const geschmack = (name) => ({ name, menge: null, einheit: 'nach Geschmack' });

const BEISPIELE = [
  {
    titel: 'Spaghetti Bolognese', dauer: 45, favorit: true, farbe: '#e9b384', symbol: '🍝',
    kategorien: ['Italienisch', 'Pasta', 'Fleisch'],
    zutaten: [
      z('Spaghetti', 250, 'g'), z('Hackfleisch', 300, 'g'), z('Zwiebeln', 1, 'Stück'),
      z('Knoblauchzehen', 2, 'Stück'), z('Passierte Tomaten', 500, 'g'), z('Olivenöl', 1, 'EL'),
      geschmack('Salz'), geschmack('Pfeffer'),
    ],
    zubereitung: `<p>Zwiebeln und Knoblauch <b>fein hacken</b>.</p><ol>
      <li>Olivenöl erhitzen, Hackfleisch darin <b>krümelig braten</b>.</li>
      <li>Zwiebeln und Knoblauch dazugeben und glasig dünsten.</li>
      <li>Passierte Tomaten einrühren, salzen, pfeffern und <i>mind. 20 Minuten</i> köcheln lassen.</li>
      <li>Spaghetti nach Packungsangabe kochen und mit der Soße servieren.</li></ol>`,
  },
  {
    titel: 'Gemüsecurry mit Reis', dauer: 30, favorit: false, farbe: '#f3d27a', symbol: '🍛',
    kategorien: ['Indisch', 'Vegetarisch', 'Vegan'],
    zutaten: [
      z('Reis', 150, 'g'), z('Kokosmilch', 1, 'Dose'), z('Currypaste', 2, 'EL'),
      z('Zwiebeln', 1, 'Stück'), z('Paprika', 1, 'Stück'), z('Zucchini', 1, 'Stück'),
      z('Kichererbsen', 1, 'Dose'), geschmack('Salz'),
    ],
    zubereitung: `<ol>
      <li>Reis nach Packungsangabe kochen.</li>
      <li>Zwiebeln, Paprika und Zucchini <b>klein schneiden</b> und anbraten.</li>
      <li>Currypaste kurz mitrösten, dann mit Kokosmilch ablöschen.</li>
      <li>Kichererbsen abgießen, dazugeben und <i>10 Minuten</i> köcheln lassen.</li></ol>`,
  },
  {
    titel: 'Lachs mit Ofengemüse', dauer: 35, favorit: true, farbe: '#9fc9b4', symbol: '🐟',
    kategorien: ['Fisch', 'Ofengericht / Auflauf', 'Low Carb'],
    zutaten: [
      z('Lachsfilet', 2, 'Stück'), z('Kartoffeln', 400, 'g'), z('Zucchini', 1, 'Stück'),
      z('Paprika', 1, 'Stück'), z('Olivenöl', 2, 'EL'), z('Zitrone', 1, 'Stück'),
      geschmack('Salz'), geschmack('Pfeffer'),
    ],
    zubereitung: `<p>Ofen auf <b>200 °C</b> Umluft vorheizen.</p><ol>
      <li>Kartoffeln, Zucchini und Paprika in Stücke schneiden, mit Olivenöl, Salz und Pfeffer mischen.</li>
      <li>Gemüse <i>20 Minuten</i> backen.</li>
      <li>Lachs dazulegen, mit Zitronenscheiben belegen und weitere <i>12 Minuten</i> garen.</li></ol>`,
  },
  {
    titel: 'Tomatensuppe', dauer: 20, favorit: false, farbe: '#e88a7a', symbol: '🍅',
    kategorien: ['Suppe & Eintopf', 'Vegan', 'Schnell (unter 30 Min.)'],
    zutaten: [
      z('Passierte Tomaten', 500, 'g'), z('Zwiebeln', 1, 'Stück'), z('Knoblauchzehen', 1, 'Stück'),
      z('Gemüsebrühe', 300, 'ml'), z('Olivenöl', 1, 'EL'), geschmack('Basilikum'), geschmack('Salz'),
    ],
    zubereitung: `<ol>
      <li>Zwiebel und Knoblauch in Olivenöl andünsten.</li>
      <li>Tomaten und Gemüsebrühe dazugeben, <i>10 Minuten</i> köcheln lassen.</li>
      <li><b>Pürieren</b>, abschmecken und mit Basilikum servieren.</li></ol>`,
  },
  {
    titel: 'Chili sin Carne', dauer: 40, favorit: false, farbe: '#c97b5a', symbol: '🌶️',
    kategorien: ['Mexikanisch', 'Vegan', 'Meal Prep'],
    zutaten: [
      z('Kidneybohnen', 1, 'Dose'), z('Mais', 1, 'Dose'), z('Passierte Tomaten', 500, 'g'),
      z('Zwiebeln', 1, 'Stück'), z('Paprika', 1, 'Stück'), z('Reis', 150, 'g'),
      z('Chilipulver', 1, 'TL'), z('Kreuzkümmel', 1, 'TL'),
    ],
    zubereitung: `<ol>
      <li>Zwiebeln und Paprika würfeln und anbraten.</li>
      <li>Gewürze kurz mitrösten.</li>
      <li>Tomaten, Bohnen und Mais dazugeben und <i>25 Minuten</i> köcheln lassen.</li>
      <li>Mit Reis servieren. <b>Tipp:</b> Schmeckt am nächsten Tag noch besser.</li></ol>`,
  },
  {
    titel: 'Griechischer Salat', dauer: 15, favorit: false, farbe: '#b9d98c', symbol: '🥗',
    kategorien: ['Salat', 'Mediterran', 'Vegetarisch', 'Schnell (unter 30 Min.)'],
    zutaten: [
      z('Gurke', 1, 'Stück'), z('Tomaten', 300, 'g'), z('Feta', 200, 'g'),
      z('Rote Zwiebel', 1, 'Stück'), z('Oliven', 50, 'g'), z('Olivenöl', 2, 'EL'), z('Oregano', 1, 'TL'),
    ],
    zubereitung: `<ul>
      <li>Gurke, Tomaten und Zwiebel in Stücke schneiden.</li>
      <li>Feta würfeln, Oliven dazugeben.</li>
      <li>Mit Olivenöl und Oregano <b>anmachen</b>.</li></ul>`,
  },
  {
    titel: 'Gebratene Nudeln mit Hähnchen', dauer: 25, favorit: false, farbe: '#e6c08f', symbol: '🍜',
    kategorien: ['Asiatisch', 'Pfannengericht', 'Fleisch', 'Schnell (unter 30 Min.)'],
    zutaten: [
      z('Mie-Nudeln', 250, 'g'), z('Hähnchenbrust', 300, 'g'), z('Paprika', 1, 'Stück'),
      z('Möhren', 2, 'Stück'), z('Sojasauce', 3, 'EL'), z('Knoblauchzehen', 2, 'Stück'), z('Sesamöl', 1, 'EL'),
    ],
    zubereitung: `<ol>
      <li>Nudeln nach Packungsangabe kochen.</li>
      <li>Hähnchen in Streifen schneiden und in Sesamöl <b>scharf anbraten</b>.</li>
      <li>Gemüse und Knoblauch dazugeben, kurz mitbraten.</li>
      <li>Nudeln und Sojasauce untermischen.</li></ol>`,
  },
  {
    titel: 'Kaiserschmarrn', dauer: 30, favorit: true, farbe: '#f1dcae', symbol: '🥞',
    kategorien: ['Dessert / Süßes', 'Deutsch', 'Vegetarisch'],
    zutaten: [
      z('Mehl', 125, 'g'), z('Milch', 250, 'ml'), z('Eier', 3, 'Stück'), z('Zucker', 2, 'EL'),
      z('Butter', 30, 'g'), z('Apfelmus', 200, 'g'), geschmack('Puderzucker'),
    ],
    zubereitung: `<ol>
      <li>Eier trennen, Eiweiß <b>steif schlagen</b>.</li>
      <li>Mehl, Milch, Eigelb und Zucker verrühren, Eischnee unterheben.</li>
      <li>In Butter goldbraun backen, wenden und <i>mit zwei Gabeln zerreißen</i>.</li>
      <li>Mit Puderzucker und Apfelmus servieren.</li></ol>`,
  },
  {
    titel: 'Ofenkartoffeln mit Kräuterquark', dauer: 50, favorit: false, farbe: '#f3d9a4', symbol: '🥔',
    kategorien: ['Deutsch', 'Vegetarisch', 'Ofengericht / Auflauf'],
    zutaten: [
      z('Kartoffeln', 800, 'g'), z('Quark', 250, 'g'), z('Olivenöl', 2, 'EL'),
      geschmack('Schnittlauch'), geschmack('Salz'),
    ],
    zubereitung: `<ol>
      <li>Kartoffeln halbieren, mit Öl und Salz bei <b>200 °C</b> etwa <i>40 Minuten</i> backen.</li>
      <li>Quark mit Schnittlauch und Salz verrühren.</li></ol>`,
  },
  {
    titel: 'Shakshuka', dauer: 25, favorit: true, farbe: '#e9a07e', symbol: '🍳',
    kategorien: ['Orientalisch', 'Vegetarisch', 'Pfannengericht', 'Schnell (unter 30 Min.)'],
    zutaten: [
      z('Eier', 4, 'Stück'), z('Passierte Tomaten', 500, 'g'), z('Paprika', 1, 'Stück'),
      z('Zwiebeln', 1, 'Stück'), z('Kreuzkümmel', 1, 'TL'), z('Feta', 100, 'g'),
    ],
    zubereitung: `<ol>
      <li>Zwiebel und Paprika anbraten, Kreuzkümmel dazu.</li>
      <li>Tomaten einrühren und <i>10 Minuten</i> köcheln.</li>
      <li>Mulden formen, <b>Eier hineinschlagen</b>, zugedeckt stocken lassen, Feta darüberbröseln.</li></ol>`,
  },
  {
    titel: 'Pizza Margherita', dauer: 40, favorit: false, farbe: null, symbol: null,
    kategorien: ['Italienisch', 'Vegetarisch', 'Für Gäste'],
    zutaten: [
      z('Pizzateig', 1, 'Packung'), z('Passierte Tomaten', 200, 'g'), z('Mozzarella', 2, 'Stück'),
      z('Olivenöl', 1, 'EL'), geschmack('Basilikum'),
    ],
    zubereitung: `<ol>
      <li>Ofen auf <b>250 °C</b> vorheizen.</li>
      <li>Teig ausrollen, mit Tomaten bestreichen und Mozzarella belegen.</li>
      <li><i>10–12 Minuten</i> backen, mit Basilikum servieren.</li></ol>`,
  },
  {
    titel: 'Buddha Bowl mit Erdnusssoße', dauer: 30, favorit: false, farbe: '#c9e4a8', symbol: '🥙',
    kategorien: ['Bowl', 'Vegan', 'Asiatisch'],
    zutaten: [
      z('Reis', 150, 'g'), z('Kichererbsen', 1, 'Dose'), z('Möhren', 2, 'Stück'),
      z('Gurke', 1, 'Stück'), z('Erdnussbutter', 3, 'EL'), z('Sojasauce', 2, 'EL'),
    ],
    zubereitung: `<ul>
      <li>Reis kochen, Kichererbsen im Ofen knusprig rösten.</li>
      <li>Gemüse in Streifen schneiden.</li>
      <li>Erdnussbutter mit Sojasauce und etwas Wasser zu einer <b>Soße</b> verrühren.</li></ul>`,
  },
  {
    titel: 'Linsensuppe', dauer: 45, favorit: false, farbe: '#d6b48a', symbol: '🥣',
    kategorien: ['Suppe & Eintopf', 'Deutsch', 'Vegan', 'Meal Prep'],
    zutaten: [
      z('Linsen', 250, 'g'), z('Möhren', 2, 'Stück'), z('Kartoffeln', 300, 'g'),
      z('Zwiebeln', 1, 'Stück'), z('Gemüsebrühe', 1, 'l'), z('Essig', 1, 'EL'),
    ],
    zubereitung: `<ol>
      <li>Gemüse würfeln und anschwitzen.</li>
      <li>Linsen und Brühe dazu, <i>30 Minuten</i> köcheln.</li>
      <li>Mit einem Schuss <b>Essig</b> abschmecken.</li></ol>`,
  },
  {
    titel: 'Hähnchen-Fajitas', dauer: 30, favorit: true, farbe: '#f0b27a', symbol: '🌮',
    kategorien: ['Mexikanisch', 'Fleisch'],
    zutaten: [
      z('Hähnchenbrust', 400, 'g'), z('Tortillas', 1, 'Packung'), z('Paprika', 2, 'Stück'),
      z('Zwiebeln', 1, 'Stück'), z('Schmand', 200, 'g'), z('Chilipulver', 1, 'TL'),
    ],
    zubereitung: `<ol>
      <li>Hähnchen und Gemüse in Streifen schneiden, mit Chili <b>scharf anbraten</b>.</li>
      <li>Tortillas erwärmen, füllen und mit Schmand servieren.</li></ol>`,
  },
  {
    titel: 'Pasta Pesto mit Tomaten', dauer: 15, favorit: false, farbe: null, symbol: null,
    kategorien: ['Pasta', 'Italienisch', 'Vegetarisch', 'Schnell (unter 30 Min.)'],
    zutaten: [
      z('Spaghetti', 250, 'g'), z('Pesto', 1, 'Packung'), z('Tomaten', 250, 'g'), z('Parmesan', 50, 'g'),
    ],
    zubereitung: '<p>Nudeln kochen, mit Pesto und halbierten Tomaten mischen, <b>Parmesan</b> darüber.</p>',
  },
  {
    titel: 'Thai-Curry mit Garnelen', dauer: 30, favorit: false, farbe: '#f5d67a', symbol: '🍤',
    kategorien: ['Asiatisch', 'Fisch'],
    zutaten: [
      z('Garnelen', 250, 'g'), z('Kokosmilch', 1, 'Dose'), z('Currypaste', 2, 'EL'),
      z('Paprika', 1, 'Stück'), z('Reis', 150, 'g'), z('Limette', 1, 'Stück'),
    ],
    zubereitung: `<ol>
      <li>Currypaste anrösten, mit Kokosmilch ablöschen.</li>
      <li>Paprika und Garnelen darin <i>5 Minuten</i> garen.</li>
      <li>Mit Limettensaft abschmecken, mit Reis servieren.</li></ol>`,
  },
  {
    titel: 'Käsespätzle', dauer: 35, favorit: true, farbe: '#f3e09a', symbol: '🧀',
    kategorien: ['Deutsch', 'Vegetarisch', 'Pfannengericht'],
    zutaten: [
      z('Spätzle', 500, 'g'), z('Bergkäse', 200, 'g'), z('Zwiebeln', 2, 'Stück'), z('Butter', 30, 'g'),
    ],
    zubereitung: `<ol>
      <li>Zwiebeln in Butter <b>goldbraun rösten</b>.</li>
      <li>Spätzle und Käse schichtweise in eine Pfanne geben, schmelzen lassen.</li>
      <li>Mit Röstzwiebeln servieren.</li></ol>`,
  },
  {
    titel: 'Falafel-Wrap', dauer: 25, favorit: false, farbe: null, symbol: null,
    kategorien: ['Orientalisch', 'Vegan', 'Schnell (unter 30 Min.)'],
    zutaten: [
      z('Falafel', 1, 'Packung'), z('Tortillas', 1, 'Packung'), z('Gurke', 1, 'Stück'),
      z('Tomaten', 200, 'g'), z('Hummus', 150, 'g'),
    ],
    zubereitung: '<p>Falafel aufbacken, Wraps mit Hummus bestreichen, mit Gemüse und Falafel füllen und <b>einrollen</b>.</p>',
  },
  {
    titel: 'Schokomousse', dauer: 20, favorit: false, farbe: '#b98a6e', symbol: '🍫',
    kategorien: ['Dessert / Süßes'],
    zutaten: [
      z('Zartbitterschokolade', 150, 'g'), z('Eier', 3, 'Stück'), z('Sahne', 200, 'ml'), z('Zucker', 1, 'EL'),
    ],
    zubereitung: `<ol>
      <li>Schokolade schmelzen, Sahne steif schlagen.</li>
      <li>Eigelb mit Zucker aufschlagen, Schokolade unterrühren.</li>
      <li>Sahne und Eischnee unterheben, <b>mind. 3 Stunden</b> kalt stellen.</li></ol>`,
  },
  {
    titel: 'Gefüllte Paprika', dauer: 60, favorit: false, farbe: '#e88a7a', symbol: '🫑',
    kategorien: ['Ofengericht / Auflauf', 'Fleisch', 'Für Gäste'],
    zutaten: [
      z('Paprika', 4, 'Stück'), z('Hackfleisch', 300, 'g'), z('Reis', 100, 'g'),
      z('Passierte Tomaten', 500, 'g'), z('Feta', 100, 'g'),
    ],
    zubereitung: `<ol>
      <li>Reis vorkochen, mit Hackfleisch und Feta mischen.</li>
      <li>Paprika aushöhlen und füllen.</li>
      <li>In Tomatensoße bei <b>180 °C</b> <i>40 Minuten</i> backen.</li></ol>`,
  },
];

// Malt ein einfaches Bild: farbiger Hintergrund mit großem Emoji
function bildMalen(farbe, symbol) {
  const leinwand = document.createElement('canvas');
  leinwand.width = 600;
  leinwand.height = 450;
  const stift = leinwand.getContext('2d');
  stift.fillStyle = farbe;
  stift.fillRect(0, 0, 600, 450);
  stift.font = '200px sans-serif';
  stift.textAlign = 'center';
  stift.textBaseline = 'middle';
  stift.fillText(symbol, 300, 240);
  return leinwand.toDataURL('image/jpeg', 0.8);
}

// Welches Rezept an welchem Tag eingeplant wird: [Wochen ab heute, Tag (0 = Montag), Titel]
const PLAN = [
  [-1, 0, 'Linsensuppe'], [-1, 1, 'Käsespätzle'], [-1, 2, 'Thai-Curry mit Garnelen'],
  [-1, 3, 'Buddha Bowl mit Erdnusssoße'], [-1, 4, 'Pizza Margherita'], [-1, 5, 'Hähnchen-Fajitas'],
  [-1, 6, 'Schokomousse'],
  [0, 0, 'Spaghetti Bolognese'], [0, 1, 'Gemüsecurry mit Reis'], [0, 2, 'Lachs mit Ofengemüse'],
  [0, 3, 'Tomatensuppe'], [0, 4, 'Chili sin Carne'], [0, 5, 'Griechischer Salat'],
  [1, 0, 'Shakshuka'], [1, 2, 'Ofenkartoffeln mit Kräuterquark'], [1, 4, 'Gefüllte Paprika'],
];

// Legt die Beispielrezepte an und plant sie in letzte, diese und nächste Woche ein
// (nur an freien Tagen). Gibt zurück, wie viele Rezepte neu angelegt wurden.
export async function beispieleLaden() {
  const [vorhanden, kategorien] = await Promise.all([alleRezepte(), alleKategorien()]);
  const kategorieId = (name) => kategorien.find((k) => gleicherName(k.name, name))?.id;

  const rezeptNachTitel = new Map(vorhanden.map((r) => [r.titel.toLocaleLowerCase('de'), r]));
  let neu = 0;
  for (const beispiel of BEISPIELE) {
    if (rezeptNachTitel.has(beispiel.titel.toLocaleLowerCase('de'))) continue;
    const rezept = {
      id: neueId(),
      titel: beispiel.titel,
      dauer: beispiel.dauer,
      favorit: beispiel.favorit,
      bild: beispiel.farbe ? bildMalen(beispiel.farbe, beispiel.symbol) : null,
      kategorien: beispiel.kategorien.map(kategorieId).filter(Boolean),
      zutaten: beispiel.zutaten,
      zubereitung: beispiel.zubereitung.replace(/\n\s*/g, ''),
    };
    await speichern('rezepte', rezept);
    rezeptNachTitel.set(rezept.titel.toLocaleLowerCase('de'), rezept);
    neu++;
  }

  const montag = wochenStart(new Date());
  const tage = PLAN.map(([woche, tag]) => plusTage(montag, woche * 7 + tag));
  const belegt = new Set(
    (await planImZeitraum(schluessel(plusTage(montag, -7)), schluessel(plusTage(montag, 13)))).map((e) => e.datum)
  );
  for (const [i, [, , titel]] of PLAN.entries()) {
    const datum = schluessel(tage[i]);
    const rezept = rezeptNachTitel.get(titel.toLocaleLowerCase('de'));
    if (rezept && !belegt.has(datum)) {
      await planEintragen(datum, rezept.id);
      belegt.add(datum);
    }
  }

  return neu;
}
