// Startpunkt der App: entscheidet anhand der Adresse (#/kalender, #/rezept/123, …),
// welche Ansicht angezeigt wird.

import * as kalender from './ansichten/kalender.js';
import * as rezepte from './ansichten/rezepte.js';
import * as rezeptAnsicht from './ansichten/rezept-ansicht.js';
import * as rezeptBearbeiten from './ansichten/rezept-bearbeiten.js';
import * as kategorien from './ansichten/kategorien.js';
import { beispieleLaden } from './beispieldaten.js';
import { symbol } from './symbole.js';

const inhalt = document.getElementById('inhalt');

// Die Höhe der Kopfzeile als CSS-Variable bereitstellen (für den klebenden Wochenstreifen)
const kopfzeile = document.querySelector('.kopfzeile');
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--kopf-hoehe', `${kopfzeile.offsetHeight}px`);
}).observe(kopfzeile);

// Symbole in der unteren Navigation einsetzen
for (const platz of document.querySelectorAll('.nav-symbol')) {
  platz.innerHTML = symbol[platz.dataset.symbol]();
}

// Ordnet eine Adresse einer Ansicht zu.
// "bereich" bestimmt, welcher Punkt in der Navigation hervorgehoben wird.
function ansichtFinden(teile) {
  const [erster, zweiter, dritter] = teile;

  if (erster === 'rezepte') return { bereich: 'rezepte', modul: rezepte };
  if (erster === 'kategorien') return { bereich: 'kategorien', modul: kategorien };
  if (erster === 'rezept' && zweiter === 'neu') {
    return { bereich: 'rezepte', modul: rezeptBearbeiten, parameter: null };
  }
  if (erster === 'rezept' && zweiter && dritter === 'bearbeiten') {
    return { bereich: 'rezepte', modul: rezeptBearbeiten, parameter: zweiter };
  }
  if (erster === 'rezept' && zweiter) {
    return { bereich: 'rezepte', modul: rezeptAnsicht, parameter: zweiter };
  }
  return { bereich: 'kalender', modul: kalender };
}

async function ansichtWechseln() {
  // Sonderadresse zum Ausprobieren: legt Beispielrezepte an und springt in den Kalender
  if (location.hash === '#/beispieldaten') {
    await beispieleLaden();
    location.replace('#/kalender');
    return;
  }

  // Aus "#/rezept/123/bearbeiten" wird ["rezept", "123", "bearbeiten"].
  const teile = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const ansicht = ansichtFinden(teile);

  for (const link of document.querySelectorAll('.navigation a')) {
    link.classList.toggle('aktiv', link.dataset.ansicht === ansicht.bereich);
  }

  // Jede Ansicht bekommt einen frischen Bereich – der blendet beim Erscheinen sanft ein
  const bereich = document.createElement('div');
  bereich.className = 'ansicht';
  inhalt.replaceChildren(bereich);
  window.scrollTo(0, 0);
  await ansicht.modul.anzeigen(bereich, ansicht.parameter);
}

window.addEventListener('hashchange', ansichtWechseln);
ansichtWechseln();

// Offline-Unterstützung (funktioniert nur über https oder localhost)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {
    // Ohne Service Worker läuft die App trotzdem – nur eben nicht offline
  });
}
