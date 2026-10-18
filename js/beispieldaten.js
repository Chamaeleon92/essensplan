// Beispielrezepte zum Ausprobieren. Werden über "Beispielrezepte laden" (leere Rezeptliste)
// oder die Adresse #/beispieldaten angelegt. Rezepte, deren Titel es schon gibt, werden übersprungen.

import { alleRezepte, alleKategorien, speichern, neueId, planImZeitraum, planEintragen } from './db.js';
import { schluessel, wochenTage, plusTage } from './datum.js';
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

// Legt die Beispielrezepte an und plant sie in diese und nächste Woche ein (nur an freien Tagen).
// Gibt zurück, wie viele Rezepte neu angelegt wurden.
export async function beispieleLaden() {
  const [vorhanden, kategorien] = await Promise.all([alleRezepte(), alleKategorien()]);
  const kategorieId = (name) => kategorien.find((k) => gleicherName(k.name, name))?.id;

  const rezepte = [];
  let neu = 0;
  for (const beispiel of BEISPIELE) {
    const gleiches = vorhanden.find((r) => gleicherName(r.titel, beispiel.titel));
    if (gleiches) {
      rezepte.push(gleiches);
      continue;
    }
    const rezept = {
      id: neueId(),
      titel: beispiel.titel,
      dauer: beispiel.dauer,
      favorit: beispiel.favorit,
      bild: bildMalen(beispiel.farbe, beispiel.symbol),
      kategorien: beispiel.kategorien.map(kategorieId).filter(Boolean),
      zutaten: beispiel.zutaten,
      zubereitung: beispiel.zubereitung.replace(/\n\s*/g, ''),
    };
    await speichern('rezepte', rezept);
    rezepte.push(rezept);
    neu++;
  }

  // Diese Woche Mo–Sa und nächste Woche Mo–Di einplanen; Sonntag bleibt zum Ausprobieren frei
  const dieseWoche = wochenTage(new Date());
  const naechsteWoche = wochenTage(plusTage(new Date(), 7));
  const tage = [...dieseWoche.slice(0, 6), ...naechsteWoche.slice(0, 2)];
  const belegt = new Set(
    (await planImZeitraum(schluessel(tage[0]), schluessel(tage[tage.length - 1]))).map((e) => e.datum)
  );
  for (const [i, tag] of tage.entries()) {
    if (!belegt.has(schluessel(tag))) {
      await planEintragen(schluessel(tag), rezepte[i % rezepte.length].id);
    }
  }

  return neu;
}
