// Die Rezept-Kachel: Bild, Titel, Dauer, Kategorien und Favoriten-Stern.
// Wird in der Rezeptübersicht, im Auswahl-Overlay und im Kalender verwendet.

import { sicher, dauerText, farbklasse, bewertungText } from './hilfen.js';
import { symbol } from './symbole.js';

const MAX_KATEGORIEN = 3;

// kategorienNachId: Map von Kategorie-ID → Kategorie, damit wir die Namen anzeigen können
// bewertung:       { schnitt, anzahl } oder undefined, wenn das Rezept noch nicht bewertet wurde
export function kachel(rezept, kategorienNachId, bewertung) {
  const namen = (rezept.kategorien ?? [])
    .map((id) => kategorienNachId.get(id)?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'de'));
  const sichtbar = namen.slice(0, MAX_KATEGORIEN);
  const weitere = namen.length - sichtbar.length;

  return `
    <button type="button" class="kachel" data-id="${rezept.id}">
      <div class="kachel-bild ${farbklasse(rezept.id)}">
        ${rezept.bild
          ? `<img src="${rezept.bild}" alt="" loading="lazy">`
          : `<span class="kachel-platzhalter">${symbol.teller({ groesse: 44 })}</span>`}
        ${rezept.favorit
          ? `<span class="kachel-stern" title="Favorit" role="img" aria-label="Favorit">${symbol.stern({ groesse: 18, fuellung: 'currentColor' })}</span>`
          : ''}
      </div>
      <div class="kachel-text">
        <span class="kachel-titel">${sicher(rezept.titel)}</span>
        ${rezept.dauer || bewertung ? `
          <span class="kachel-dauer">
            ${rezept.dauer ? `${symbol.uhr({ groesse: 14 })} ${dauerText(rezept.dauer)}` : ''}
            ${bewertung ? `<span class="kachel-bewertung" title="${bewertung.anzahl}× bewertet">😋 ${bewertungText(bewertung.schnitt)}</span>` : ''}
          </span>` : ''}
        ${sichtbar.length ? `
          <span class="chips chips-klein">
            ${sichtbar.map((name) => `<span class="chip">${sicher(name)}</span>`).join('')}
            ${weitere > 0 ? `<span class="chip">+${weitere}</span>` : ''}
          </span>` : ''}
      </div>
    </button>
  `;
}
