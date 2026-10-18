// Steuert die Kopfzeile: Titel, Zurück-Knopf und Aktionsknöpfe rechts (z. B. ✏️ oder ＋).

const titel = document.getElementById('seitentitel');
const zurueckKnopf = document.getElementById('zurueck');
const aktionenBereich = document.getElementById('kopf-aktionen');

let zurueckZiel = null;

zurueckKnopf.addEventListener('click', () => zurueckGehen(zurueckZiel));

// titel:     Text in der Kopfzeile
// zurueck:   Adresse, zu der der Zurück-Knopf führt (null = kein Zurück-Knopf)
// aktionen:  Liste von Knöpfen, z. B. [{ symbol: '✏️', label: 'Bearbeiten', beiKlick: () => … }]
export function kopfSetzen({ titel: text, zurueck = null, aktionen = [] }) {
  titel.textContent = text;
  document.title = `${text} · Essensplan`;

  zurueckZiel = zurueck;
  zurueckKnopf.hidden = !zurueck;

  aktionenBereich.innerHTML = '';
  for (const aktion of aktionen) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'knopf-symbol';
    knopf.textContent = aktion.symbol;
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
