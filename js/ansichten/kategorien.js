// Kategorien verwalten: hinzufügen, umbenennen, löschen.

import { alleKategorien, speichern, kategorieLoeschen, neueId, allesZuruecksetzen } from '../db.js';
import { sicher, gleicherName } from '../hilfen.js';
import { kopfSetzen } from '../kopf.js';
import { symbol } from '../symbole.js';
import { yummi } from '../ton.js';

let container;
let kategorien = [];
let bearbeiteteId = null; // Kategorie, die gerade umbenannt wird
let fehlermeldung = '';

export async function anzeigen(ziel) {
  kopfSetzen({ titel: 'Kategorien' });
  container = ziel;
  bearbeiteteId = null;
  fehlermeldung = '';
  kategorien = await alleKategorien();
  zeichnen();
}

function zeichnen() {
  container.innerHTML = `
    <form class="formular-zeile" id="neu-formular">
      <input class="eingabe" id="neu-name" placeholder="Neue Kategorie" maxlength="40"
             aria-label="Name der neuen Kategorie" autocomplete="off">
      <button class="knopf knopf-haupt" type="submit">Hinzufügen</button>
    </form>
    ${fehlermeldung ? `<p class="fehler">${sicher(fehlermeldung)}</p>` : ''}
    <p class="anzahl">${kategorien.length} Kategorien</p>
    <ul class="liste">
      ${kategorien.map(zeile).join('')}
    </ul>

    <section class="ausprobieren">
      <h2>Zum Ausprobieren</h2>
      <p class="leise">
        Legt 20 Beispielrezepte an und plant sie in die letzte, diese und nächste Woche ein.
        Eigene Rezepte bleiben erhalten.
      </p>
      <div class="ausprobieren-knoepfe">
        <a class="knopf knopf-haupt" href="#/beispieldaten">Beispielrezepte laden</a>
        <button type="button" class="knopf" data-ton-testen>🎉 Yummi-Ton testen</button>
        <button type="button" class="knopf knopf-gefahr" data-zuruecksetzen>
          ${symbol.muell({ groesse: 20 })} Alles zurücksetzen
        </button>
      </div>
    </section>
  `;

  container.querySelector('#neu-formular').addEventListener('submit', hinzufuegen);
  container.querySelector('.liste').addEventListener('click', listeGeklickt);
  container.querySelector('[data-zuruecksetzen]').addEventListener('click', zuruecksetzen);
  container.querySelector('[data-ton-testen]').addEventListener('click', yummi);

  const umbenennenFormular = container.querySelector('#umbenennen-formular');
  if (umbenennenFormular) {
    umbenennenFormular.addEventListener('submit', umbenennen);
    const feld = umbenennenFormular.querySelector('input');
    feld.focus();
    feld.select();
  }
}

function zeile(kategorie) {
  if (kategorie.id === bearbeiteteId) {
    return `
      <li>
        <form id="umbenennen-formular" class="formular-zeile umbenennen">
          <input class="eingabe" value="${sicher(kategorie.name)}" maxlength="40"
                 aria-label="Neuer Name" autocomplete="off">
          <button class="knopf-symbol" type="submit" title="Speichern" aria-label="Speichern">${symbol.haken({ groesse: 20 })}</button>
          <button class="knopf-symbol" type="button" data-aktion="abbrechen"
                  title="Abbrechen" aria-label="Abbrechen">${symbol.schliessen({ groesse: 20 })}</button>
        </form>
      </li>
    `;
  }
  return `
    <li>
      <span class="name">${sicher(kategorie.name)}</span>
      <button class="knopf-symbol" data-aktion="bearbeiten" data-id="${kategorie.id}"
              title="Umbenennen" aria-label="${sicher(kategorie.name)} umbenennen">${symbol.stift({ groesse: 20 })}</button>
      <button class="knopf-symbol" data-aktion="loeschen" data-id="${kategorie.id}"
              title="Löschen" aria-label="${sicher(kategorie.name)} löschen">${symbol.muell({ groesse: 20 })}</button>
    </li>
  `;
}

// Prüft einen Namen. Gibt eine Fehlermeldung zurück oder '' wenn alles passt.
function namePruefen(name, eigeneId) {
  if (!name.trim()) {
    return 'Bitte gib einen Namen ein.';
  }
  const doppelt = kategorien.some((k) => k.id !== eigeneId && gleicherName(k.name, name));
  if (doppelt) {
    return `Die Kategorie „${name.trim()}“ gibt es schon.`;
  }
  return '';
}

async function neuLaden() {
  kategorien = await alleKategorien();
  zeichnen();
}

async function hinzufuegen(ereignis) {
  ereignis.preventDefault();
  const name = container.querySelector('#neu-name').value;
  fehlermeldung = namePruefen(name);
  if (fehlermeldung) {
    zeichnen();
    return;
  }
  await speichern('kategorien', { id: neueId(), name: name.trim() });
  await neuLaden();
}

async function umbenennen(ereignis) {
  ereignis.preventDefault();
  const name = ereignis.target.querySelector('input').value;
  fehlermeldung = namePruefen(name, bearbeiteteId);
  if (fehlermeldung) {
    zeichnen();
    return;
  }
  await speichern('kategorien', { id: bearbeiteteId, name: name.trim() });
  bearbeiteteId = null;
  await neuLaden();
}

async function listeGeklickt(ereignis) {
  const knopf = ereignis.target.closest('button[data-aktion]');
  if (!knopf) return;

  fehlermeldung = '';
  const aktion = knopf.dataset.aktion;

  if (aktion === 'bearbeiten') {
    bearbeiteteId = knopf.dataset.id;
    zeichnen();
  } else if (aktion === 'abbrechen') {
    bearbeiteteId = null;
    zeichnen();
  } else if (aktion === 'loeschen') {
    const kategorie = kategorien.find((k) => k.id === knopf.dataset.id);
    const sicherGefragt = confirm(
      `Kategorie „${kategorie.name}“ löschen?\n\nSie wird aus allen Rezepten entfernt. Die Rezepte selbst bleiben erhalten.`
    );
    if (sicherGefragt) {
      await kategorieLoeschen(kategorie.id);
      await neuLaden();
    }
  }
}

async function zuruecksetzen() {
  const sicherGefragt = confirm(
    'Wirklich alles zurücksetzen?\n\nAlle Rezepte und der komplette Kalender werden gelöscht, '
    + 'die Kategorien auf die Startliste zurückgesetzt. Das lässt sich nicht rückgängig machen.'
  );
  if (sicherGefragt) {
    await allesZuruecksetzen();
    await neuLaden();
  }
}
