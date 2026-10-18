// Steuert die Kopfzeile: Titel (optional mit kleiner Zeile darüber), Zurück-Knopf
// und runde Aktionsknöpfe rechts.

import { symbol } from './symbole.js';

const untertitel = document.getElementById('untertitel');
const titel = document.getElementById('seitentitel');
const zurueckKnopf = document.getElementById('zurueck');
const aktionenBereich = document.getElementById('kopf-aktionen');

let zurueckZiel = null;

zurueckKnopf.innerHTML = symbol.links();
zurueckKnopf.addEventListener('click', () => zurueckGehen(zurueckZiel));

// titel:       Text in der Kopfzeile
// untertitel:  kleine Zeile über dem Titel (optional)
// zurueck:     Adresse, zu der der Zurück-Knopf führt (null = kein Zurück-Knopf)
// aktionen:    Liste von Knöpfen, z. B. [{ symbol: symbol.stift(), label: 'Bearbeiten', beiKlick: () => … }]
//              optional mit hervorgehoben: true für einen farbigen Knopf
export function kopfSetzen({ titel: text, untertitel: zeile = '', zurueck = null, aktionen = [] }) {
  titel.textContent = text;
  untertitel.textContent = zeile;
  untertitel.hidden = !zeile;
  document.title = `${text} · Essensplan`;

  zurueckZiel = zurueck;
  zurueckKnopf.hidden = !zurueck;

  aktionenBereich.innerHTML = '';
  for (const aktion of aktionen) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = aktion.hervorgehoben ? 'kopf-knopf hervorgehoben' : 'kopf-knopf';
    knopf.innerHTML = aktion.symbol;
    knopf.title = aktion.label;
    knopf.setAttribute('aria-label', aktion.label);
    knopf.addEventListener('click', aktion.beiKlick);
    aktionenBereich.append(knopf);
  }
}

// Geht eine Seite zurück. Wurde die App direkt auf dieser Seite geöffnet
// (es gibt also kein "zurück"), springen wir stattdessen zum Ersatzziel.
export function zurueckGehen(ersatzziel) {
  if (history.length > 1) {
    history.back();
  } else {
    location.replace(ersatzziel);
  }
}
