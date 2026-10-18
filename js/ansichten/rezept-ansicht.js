// Ansichtsmodus eines Rezepts – zum Nachlesen beim Kochen.

import { holen, alleKategorien } from '../db.js';
import { sicher, mengeText, dauerText, htmlBereinigen } from '../hilfen.js';
import { kopfSetzen } from '../kopf.js';

export async function anzeigen(container, id) {
  const [rezept, kategorien] = await Promise.all([holen('rezepte', id), alleKategorien()]);

  if (!rezept) {
    kopfSetzen({ titel: 'Rezept', zurueck: '#/rezepte' });
    container.innerHTML = `
      <div class="hinweis">
        <p>Dieses Rezept gibt es nicht (mehr).</p>
        <a class="knopf" href="#/rezepte">Zu den Rezepten</a>
      </div>
    `;
    return;
  }

  kopfSetzen({
    titel: 'Rezept',
    zurueck: '#/rezepte',
    aktionen: [{
      symbol: '✏️',
      label: 'Bearbeiten',
      beiKlick: () => { location.hash = `#/rezept/${id}/bearbeiten`; },
    }],
  });

  const kategorienNamen = kategorien
    .filter((k) => rezept.kategorien.includes(k.id))
    .map((k) => k.name);

  container.innerHTML = `
    <article class="rezept">
      ${rezept.bild ? `<img class="rezept-bild" src="${rezept.bild}" alt="">` : ''}

      <h2 class="rezept-titel">
        ${sicher(rezept.titel)}
        ${rezept.favorit ? '<span title="Favorit" aria-label="Favorit">⭐</span>' : ''}
      </h2>

      <div class="rezept-info">
        ${rezept.dauer ? `<span>⏱ ${dauerText(rezept.dauer)}</span>` : ''}
        <span>👥 2 Personen</span>
      </div>

      ${kategorienNamen.length ? `
        <div class="chips">
          ${kategorienNamen.map((n) => `<span class="chip">${sicher(n)}</span>`).join('')}
        </div>` : ''}

      <h3>Zutaten</h3>
      ${rezept.zutaten.length ? `
        <ul class="zutatenliste">
          ${rezept.zutaten.map((z) => `
            <li>
              <span class="zutat-mengenangabe">${sicher(mengeText(z.menge, z.einheit))}</span>
              <span>${sicher(z.name)}</span>
            </li>
          `).join('')}
        </ul>` : '<p class="leise">Keine Zutaten eingetragen.</p>'}

      <h3>Zubereitung</h3>
      ${rezept.zubereitung
        ? `<div class="zubereitung">${htmlBereinigen(rezept.zubereitung)}</div>`
        : '<p class="leise">Keine Zubereitung eingetragen.</p>'}
    </article>
  `;
}
