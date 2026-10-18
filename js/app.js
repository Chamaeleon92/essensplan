// Startpunkt der App: entscheidet anhand der Adresse (#/kalender, #/rezept/123, …),
// welche Ansicht angezeigt wird.

import * as kalender from './ansichten/kalender.js';
import * as rezepte from './ansichten/rezepte.js';
import * as rezeptAnsicht from './ansichten/rezept-ansicht.js';
import * as rezeptBearbeiten from './ansichten/rezept-bearbeiten.js';
import * as kategorien from './ansichten/kategorien.js';

const inhalt = document.getElementById('inhalt');

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
  // Aus "#/rezept/123/bearbeiten" wird ["rezept", "123", "bearbeiten"].
  const teile = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const ansicht = ansichtFinden(teile);

  for (const link of document.querySelectorAll('.navigation a')) {
    link.classList.toggle('aktiv', link.dataset.ansicht === ansicht.bereich);
  }

  inhalt.innerHTML = '';
  window.scrollTo(0, 0);
  await ansicht.modul.anzeigen(inhalt, ansicht.parameter);
}

window.addEventListener('hashchange', ansichtWechseln);
ansichtWechseln();
