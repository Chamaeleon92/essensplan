// Rezeptliste mit Suche und Filter (Favoriten, Kategorien, Zutaten).
// Wird in der Rezeptübersicht und später im Auswahl-Overlay des Kalenders verwendet.

import { alleRezepte, alleKategorien, alleZutatenNamen, bewertungenProRezept } from './db.js';
import { sicher, gleicherName } from './hilfen.js';
import { kachel } from './kachel.js';
import { symbol } from './symbole.js';

// Ein leerer Filterzustand. Wer die Filter zwischen zwei Besuchen behalten will,
// hebt sich das Objekt auf und gibt es beim nächsten Mal wieder mit.
export function neuerFilter() {
  return { suche: '', nurFavoriten: false, kategorien: [], zutaten: [], offen: false, sortierung: 'name' };
}

// container:   Element, in das die Liste gezeichnet wird
// filter:      Filterzustand (siehe neuerFilter)
// beiAuswahl:  Funktion, die beim Tippen auf eine Kachel mit dem Rezept aufgerufen wird
// leerText:    HTML, das angezeigt wird, wenn es noch gar keine Rezepte gibt
export async function rezeptlisteAnzeigen(container, { filter, beiAuswahl, leerText }) {
  const [rezepte, kategorien, zutatenNamen, bewertungen] = await Promise.all([
    alleRezepte(), alleKategorien(), alleZutatenNamen(), bewertungenProRezept(),
  ]);
  const kategorienNachId = new Map(kategorien.map((k) => [k.id, k]));

  // Gelöschte Kategorien aus einem alten Filter entfernen
  filter.kategorien = filter.kategorien.filter((id) => kategorienNachId.has(id));

  if (rezepte.length === 0) {
    container.innerHTML = leerText;
    return;
  }

  // Eigene ID pro Liste, damit zwei Listen auf einer Seite sich nicht in die Quere kommen
  const listenId = `zutaten-${Math.random().toString(36).slice(2)}`;

  container.innerHTML = `
    <div class="suche-zeile">
      ${symbol.lupe({ groesse: 20 })}
      <input class="eingabe" type="search" placeholder="Rezept suchen …"
             aria-label="Rezept suchen" value="${sicher(filter.suche)}">
    </div>
    <details class="filter" ${filter.offen ? 'open' : ''}>
      <summary></summary>
      <div class="filter-inhalt"></div>
    </details>
    <div class="listen-leiste">
      <p class="anzahl"></p>
      <div class="umschalter umschalter-klein" role="group" aria-label="Sortierung">
        <button type="button" data-sortierung="name">A–Z</button>
        <button type="button" data-sortierung="bewertung">😋 Beste zuerst</button>
      </div>
    </div>
    <div class="raster"></div>
    <datalist id="${listenId}">
      ${zutatenNamen.map((n) => `<option value="${sicher(n)}">`).join('')}
    </datalist>
  `;

  const suchfeld = container.querySelector('input[type=search]');
  const details = container.querySelector('.filter');
  const zusammenfassung = container.querySelector('.filter summary');
  const filterInhalt = container.querySelector('.filter-inhalt');
  const anzahl = container.querySelector('.anzahl');
  const raster = container.querySelector('.raster');

  function filterZeichnen() {
    const aktive = (filter.nurFavoriten ? 1 : 0) + filter.kategorien.length + filter.zutaten.length;
    zusammenfassung.textContent = aktive ? `Filter (${aktive})` : 'Filter';

    filterInhalt.innerHTML = `
      <div class="filter-gruppe">
        <button type="button" class="chip chip-waehlbar" data-favoriten
                aria-pressed="${filter.nurFavoriten}">${symbol.stern({ groesse: 16, fuellung: 'currentColor' })} Nur Favoriten</button>
      </div>

      <h3 class="filter-titel">Kategorien</h3>
      <div class="chips">
        ${kategorien.map((k) => `
          <button type="button" class="chip chip-waehlbar" data-kategorie="${k.id}"
                  aria-pressed="${filter.kategorien.includes(k.id)}">${sicher(k.name)}</button>
        `).join('')}
      </div>

      <h3 class="filter-titel">Zutaten</h3>
      <div class="formular-zeile">
        <input class="eingabe" list="${listenId}" placeholder="Zutat eingeben"
               aria-label="Zutat zum Filtern" autocomplete="off" data-zutat-eingabe>
        <button type="button" class="knopf" data-zutat-hinzufuegen>Hinzufügen</button>
      </div>
      <div class="chips">
        ${filter.zutaten.map((name, i) => `
          <button type="button" class="chip chip-waehlbar" aria-pressed="true" data-zutat-entfernen="${i}"
                  aria-label="${sicher(name)} aus dem Filter entfernen">${sicher(name)} ${symbol.schliessen({ groesse: 14 })}</button>
        `).join('')}
      </div>

      ${aktive ? '<button type="button" class="knopf-text" data-zuruecksetzen>Filter zurücksetzen</button>' : ''}
    `;
  }

  function rasterZeichnen() {
    const treffer = rezepte.filter((rezept) => passt(rezept, filter));
    if (filter.sortierung === 'bewertung') treffer.sort(besteZuerst);
    for (const knopf of container.querySelectorAll('[data-sortierung]')) {
      knopf.setAttribute('aria-pressed', String(knopf.dataset.sortierung === filter.sortierung));
    }
    anzahl.textContent = treffer.length === 1 ? '1 Rezept' : `${treffer.length} Rezepte`;
    raster.innerHTML = treffer.length
      ? treffer.map((r) => kachel(r, kategorienNachId, bewertungen.get(r.id))).join('')
      : '<p class="hinweis">Kein Rezept passt zu Suche und Filter.</p>';
  }

  function zutatHinzufuegen() {
    const feld = filterInhalt.querySelector('[data-zutat-eingabe]');
    // Bekannte Zutat in ihrer üblichen Schreibweise übernehmen ("salz" → "Salz")
    const eingabe = feld.value.trim();
    const name = zutatenNamen.find((bekannt) => gleicherName(bekannt, eingabe)) ?? eingabe;
    if (name && !filter.zutaten.some((z) => gleicherName(z, name))) {
      filter.zutaten.push(name);
    }
    feld.value = '';
    neuZeichnen();
  }

  function neuZeichnen() {
    filterZeichnen();
    rasterZeichnen();
  }

  suchfeld.addEventListener('input', () => {
    filter.suche = suchfeld.value;
    rasterZeichnen();
  });

  details.addEventListener('toggle', () => {
    filter.offen = details.open;
  });

  filterInhalt.addEventListener('click', (ereignis) => {
    const ziel = ereignis.target.closest('button');
    if (!ziel) return;

    if (ziel.hasAttribute('data-favoriten')) {
      filter.nurFavoriten = !filter.nurFavoriten;
    } else if (ziel.dataset.kategorie) {
      const id = ziel.dataset.kategorie;
      filter.kategorien = filter.kategorien.includes(id)
        ? filter.kategorien.filter((k) => k !== id)
        : [...filter.kategorien, id];
    } else if (ziel.hasAttribute('data-zutat-hinzufuegen')) {
      zutatHinzufuegen();
      return;
    } else if (ziel.dataset.zutatEntfernen !== undefined) {
      filter.zutaten.splice(Number(ziel.dataset.zutatEntfernen), 1);
    } else if (ziel.hasAttribute('data-zuruecksetzen')) {
      Object.assign(filter, { nurFavoriten: false, kategorien: [], zutaten: [] });
    }
    neuZeichnen();
  });

  // Enter im Zutatenfeld fügt die Zutat hinzu
  filterInhalt.addEventListener('keydown', (ereignis) => {
    if (ereignis.target.matches('[data-zutat-eingabe]') && ereignis.key === 'Enter') {
      ereignis.preventDefault();
      zutatHinzufuegen();
    }
  });

  // Hitliste: bestbewertete zuerst, bei Gleichstand die öfter bewerteten; Unbewertete ans Ende
  function besteZuerst(a, b) {
    const ba = bewertungen.get(a.id);
    const bb = bewertungen.get(b.id);
    return (bb?.schnitt ?? 0) - (ba?.schnitt ?? 0)
      || (bb?.anzahl ?? 0) - (ba?.anzahl ?? 0)
      || a.titel.localeCompare(b.titel, 'de');
  }

  container.querySelector('[aria-label="Sortierung"]').addEventListener('click', (ereignis) => {
    const knopf = ereignis.target.closest('[data-sortierung]');
    if (!knopf) return;
    filter.sortierung = knopf.dataset.sortierung;
    rasterZeichnen();
  });

  raster.addEventListener('click', (ereignis) => {
    const ziel = ereignis.target.closest('.kachel');
    if (ziel) beiAuswahl(rezepte.find((r) => r.id === ziel.dataset.id));
  });

  neuZeichnen();
}

// Alle aktiven Filter müssen zutreffen (UND-Verknüpfung).
function passt(rezept, filter) {
  if (filter.nurFavoriten && !rezept.favorit) return false;

  const suche = filter.suche.trim().toLocaleLowerCase('de');
  if (suche && !rezept.titel.toLocaleLowerCase('de').includes(suche)) return false;

  if (!filter.kategorien.every((id) => rezept.kategorien.includes(id))) return false;

  return filter.zutaten.every((gesucht) =>
    rezept.zutaten.some((zutat) => gleicherName(zutat.name, gesucht))
  );
}
