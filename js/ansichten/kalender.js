// Kalender mit Wochen- und Monatsansicht – wird in Schritt 3 gebaut.

import { kopfSetzen } from '../kopf.js';

export function anzeigen(container) {
  kopfSetzen({ titel: 'Kalender' });
  container.innerHTML = `
    <p class="hinweis">📅 Hier entsteht der Kalender mit Wochen- und Monatsansicht.</p>
  `;
}
