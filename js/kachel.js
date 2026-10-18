// Die Rezept-Kachel: Bild, Titel, Dauer, Kategorien und Favoriten-Stern.
// Wird in der Rezeptübersicht, im Auswahl-Overlay und im Kalender verwendet.

import { sicher, dauerText } from './hilfen.js';

const MAX_KATEGORIEN = 3;

// kategorienNachId: Map von Kategorie-ID → Kategorie, damit wir die Namen anzeigen können
export function kachel(rezept, kategorienNachId) {
  const namen = (rezept.kategorien ?? [])
    .map((id) => kategorienNachId.get(id)?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'de'));
  const sichtbar = namen.slice(0, MAX_KATEGORIEN);
  const weitere = namen.length - sichtbar.length;

  return `
    <button type="button" class="kachel" data-id="${rezept.id}">
      <div class="kachel-bild">
        ${rezept.bild
          ? `<img src="${rezept.bild}" alt="" loading="lazy">`
          : '<span class="kachel-platzhalter" aria-hidden="true">🍽️</span>'}
        ${rezept.favorit ? '<span class="kachel-stern" title="Favorit" aria-label="Favorit">⭐</span>' : ''}
      </div>
      <div class="kachel-text">
        <span class="kachel-titel">${sicher(rezept.titel)}</span>
        ${rezept.dauer ? `<span class="kachel-dauer">⏱ ${dauerText(rezept.dauer)}</span>` : ''}
        ${sichtbar.length ? `
          <span class="chips chips-klein">
            ${sichtbar.map((name) => `<span class="chip">${sicher(name)}</span>`).join('')}
            ${weitere > 0 ? `<span class="chip">+${weitere}</span>` : ''}
          </span>` : ''}
      </div>
    </button>
  `;
}
