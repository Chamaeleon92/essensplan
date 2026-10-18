// Rezeptübersicht: alle Rezepte als Kacheln, mit Suche und Filter.

import { kopfSetzen } from '../kopf.js';
import { rezeptlisteAnzeigen, neuerFilter } from '../rezeptliste.js';

// Bleibt erhalten, solange die App offen ist – so sind Suche und Filter
// noch gesetzt, wenn man aus einem Rezept zurückkommt.
const filter = neuerFilter();

export async function anzeigen(container) {
  kopfSetzen({
    titel: 'Rezepte',
    aktionen: [{ symbol: '＋', label: 'Neues Rezept', beiKlick: () => { location.hash = '#/rezept/neu'; } }],
  });

  await rezeptlisteAnzeigen(container, {
    filter,
    beiAuswahl: (rezept) => { location.hash = `#/rezept/${rezept.id}`; },
    leerText: `
      <div class="hinweis">
        <p>Noch keine Rezepte vorhanden.</p>
        <a class="knopf knopf-haupt" href="#/rezept/neu">＋ Erstes Rezept anlegen</a>
      </div>
    `,
  });
}
