// Rezeptübersicht: alle Rezepte als Kacheln, mit Suche und Filter.

import { kopfSetzen } from '../kopf.js';
import { rezeptlisteAnzeigen, neuerFilter } from '../rezeptliste.js';
import { symbol } from '../symbole.js';

// Bleibt erhalten, solange die App offen ist – so sind Suche und Filter
// noch gesetzt, wenn man aus einem Rezept zurückkommt.
const filter = neuerFilter();

export async function anzeigen(container) {
  kopfSetzen({
    titel: 'Rezepte',
    aktionen: [{
      symbol: symbol.plus({ groesse: 20 }),
      label: 'Neues Rezept',
      hervorgehoben: true,
      beiKlick: () => { location.hash = '#/rezept/neu'; },
    }],
  });

  await rezeptlisteAnzeigen(container, {
    filter,
    beiAuswahl: (rezept) => { location.hash = `#/rezept/${rezept.id}`; },
    leerText: `
      <div class="hinweis">
        <p>Noch keine Rezepte vorhanden.</p>
        <a class="knopf knopf-haupt" href="#/rezept/neu">${symbol.plus({ groesse: 18 })} Erstes Rezept anlegen</a>
        <p><a class="knopf" href="#/beispieldaten">Beispielrezepte laden</a></p>
      </div>
    `,
  });
}
