// Rezept anlegen oder bearbeiten.

import { holen, speichern, rezeptLoeschen, alleKategorien, alleZutatenNamen, neueId } from '../db.js';
import { sicher, gleicherName, EINHEITEN, zahl, zahlLesen, htmlBereinigen, bildVerkleinern } from '../hilfen.js';
import { kopfSetzen, zurueckGehen } from '../kopf.js';

const FORMATIERUNGEN = [
  { befehl: 'bold', label: 'Fett', symbol: '<b>F</b>' },
  { befehl: 'italic', label: 'Kursiv', symbol: '<i>K</i>' },
  { befehl: 'underline', label: 'Unterstrichen', symbol: '<u>U</u>' },
  { befehl: 'insertUnorderedList', label: 'Aufzählung', symbol: '• Liste' },
  { befehl: 'insertOrderedList', label: 'Nummerierte Liste', symbol: '1. Liste' },
];

let rezept;          // das Rezept, das gerade bearbeitet wird
let istNeu;          // true = neues Rezept, false = bestehendes bearbeiten
let zutatenNamen;    // bekannte Zutaten für die Vorschläge
let formular;

export async function anzeigen(container, id) {
  const [vorhanden, kategorien, namen] = await Promise.all([
    id ? holen('rezepte', id) : null,
    alleKategorien(),
    alleZutatenNamen(),
  ]);

  if (id && !vorhanden) {
    kopfSetzen({ titel: 'Rezept', zurueck: '#/rezepte' });
    container.innerHTML = '<p class="hinweis">Dieses Rezept gibt es nicht (mehr).</p>';
    return;
  }

  istNeu = !vorhanden;
  zutatenNamen = namen;
  rezept = vorhanden ? structuredClone(vorhanden) : {
    id: neueId(),
    titel: '',
    bild: null,
    zutaten: [],
    zubereitung: '',
    dauer: null,
    kategorien: [],
    favorit: false,
  };

  kopfSetzen({
    titel: istNeu ? 'Neues Rezept' : 'Rezept bearbeiten',
    zurueck: istNeu ? '#/rezepte' : `#/rezept/${rezept.id}`,
  });

  // Ein neues Rezept startet mit einer leeren Zutatenzeile
  const zutaten = rezept.zutaten.length ? rezept.zutaten : [{ menge: null, einheit: 'g', name: '' }];

  container.innerHTML = `
    <form class="rezept-formular" novalidate>
      <div class="feld">
        <label class="bild-waehler">
          <span class="bild-vorschau">${bildVorschau()}</span>
          <input type="file" accept="image/*" class="unsichtbar" data-bild>
        </label>
        <button type="button" class="knopf-text" data-bild-entfernen ${rezept.bild ? '' : 'hidden'}>
          Bild entfernen
        </button>
      </div>

      <label class="feld">
        <span class="feld-titel">Titel</span>
        <input class="eingabe" name="titel" value="${sicher(rezept.titel)}" maxlength="100"
               autocomplete="off" placeholder="z. B. Spaghetti Bolognese">
      </label>
      <p class="fehler" data-titel-fehler hidden>Bitte gib einen Titel ein.</p>

      <label class="feld">
        <span class="feld-titel">Dauer in Minuten</span>
        <input class="eingabe eingabe-kurz" name="dauer" inputmode="numeric" maxlength="4"
               value="${rezept.dauer ?? ''}" placeholder="30" autocomplete="off">
      </label>

      <fieldset class="feld">
        <legend class="feld-titel">Kategorien</legend>
        <div class="chips">
          ${kategorien.map((k) => `
            <button type="button" class="chip chip-waehlbar" data-kategorie="${k.id}"
                    aria-pressed="${rezept.kategorien.includes(k.id)}">${sicher(k.name)}</button>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="feld">
        <legend class="feld-titel">Zutaten <span class="leise">für 2 Personen</span></legend>
        <div class="zutaten-zeilen">
          ${zutaten.map(zutatZeile).join('')}
        </div>
        <button type="button" class="knopf" data-zutat-plus>＋ Zutat</button>
      </fieldset>

      <div class="feld">
        <span class="feld-titel" id="zubereitung-titel">Zubereitung</span>
        <div class="editor-leiste" role="toolbar" aria-label="Formatierung">
          ${FORMATIERUNGEN.map((f) => `
            <button type="button" data-befehl="${f.befehl}" title="${f.label}"
                    aria-label="${f.label}">${f.symbol}</button>
          `).join('')}
        </div>
        <div class="editor zubereitung" contenteditable="true" role="textbox" aria-multiline="true"
             aria-labelledby="zubereitung-titel">${htmlBereinigen(rezept.zubereitung)}</div>
      </div>

      <button type="button" class="knopf favorit-knopf" data-favorit aria-pressed="${rezept.favorit}">
        ${favoritText()}
      </button>

      <div class="formular-aktionen">
        <button type="button" class="knopf" data-abbrechen>Abbrechen</button>
        <button type="submit" class="knopf knopf-haupt">Speichern</button>
      </div>

      ${istNeu ? '' : '<button type="button" class="knopf knopf-gefahr" data-loeschen>🗑️ Rezept löschen</button>'}
    </form>

    <datalist id="zutaten-vorschlaege">
      ${zutatenNamen.map((n) => `<option value="${sicher(n)}">`).join('')}
    </datalist>
  `;

  formular = container.querySelector('form');
  formular.addEventListener('submit', speichernGeklickt);
  formular.addEventListener('click', geklickt);
  formular.addEventListener('change', geaendert);
  formular.titel.addEventListener('input', () => {
    formular.querySelector('[data-titel-fehler]').hidden = true;
  });

  const editor = formular.querySelector('.editor');
  // Eingefügter Text wird ohne fremde Formatierung übernommen (z. B. beim Kopieren von Webseiten)
  editor.addEventListener('paste', (ereignis) => {
    ereignis.preventDefault();
    document.execCommand('insertText', false, ereignis.clipboardData.getData('text/plain'));
  });
  // Verhindert, dass ein Klick auf die Formatierungsleiste die Textmarkierung aufhebt
  formular.querySelector('.editor-leiste').addEventListener('mousedown', (e) => e.preventDefault());
}

function bildVorschau() {
  return rezept.bild
    ? `<img src="${rezept.bild}" alt="Rezeptbild">`
    : '<span class="bild-leer"><span aria-hidden="true">📷</span>Foto aufnehmen oder auswählen</span>';
}

function favoritText() {
  return rezept.favorit ? '⭐ Favorit' : '☆ Als Favorit markieren';
}

function zutatZeile(zutat) {
  const nachGeschmack = zutat.einheit === 'nach Geschmack';
  return `
    <div class="zutat-zeile">
      <input class="eingabe zutat-name" list="zutaten-vorschlaege" placeholder="Zutat"
             aria-label="Zutat" value="${sicher(zutat.name)}" autocomplete="off">
      <input class="eingabe zutat-menge" inputmode="decimal" placeholder="Menge" aria-label="Menge"
             value="${zutat.menge != null ? zahl(zutat.menge) : ''}" ${nachGeschmack ? 'disabled' : ''}>
      <select class="eingabe zutat-einheit" aria-label="Einheit">
        ${EINHEITEN.map((e) => `<option ${e === zutat.einheit ? 'selected' : ''}>${e}</option>`).join('')}
      </select>
      <button type="button" class="knopf-symbol" data-zutat-entfernen aria-label="Zutat entfernen">✕</button>
    </div>
  `;
}

async function geklickt(ereignis) {
  const knopf = ereignis.target.closest('button');
  if (!knopf || knopf.type === 'submit') return;

  if (knopf.dataset.kategorie) {
    const gewaehlt = knopf.getAttribute('aria-pressed') === 'true';
    knopf.setAttribute('aria-pressed', String(!gewaehlt));
  } else if (knopf.hasAttribute('data-zutat-plus')) {
    const zeilen = formular.querySelector('.zutaten-zeilen');
    zeilen.insertAdjacentHTML('beforeend', zutatZeile({ menge: null, einheit: 'g', name: '' }));
    zeilen.lastElementChild.querySelector('.zutat-name').focus();
  } else if (knopf.hasAttribute('data-zutat-entfernen')) {
    knopf.closest('.zutat-zeile').remove();
  } else if (knopf.dataset.befehl) {
    document.execCommand(knopf.dataset.befehl);
    formular.querySelector('.editor').focus();
  } else if (knopf.hasAttribute('data-favorit')) {
    rezept.favorit = !rezept.favorit;
    knopf.setAttribute('aria-pressed', String(rezept.favorit));
    knopf.textContent = favoritText();
  } else if (knopf.hasAttribute('data-bild-entfernen')) {
    rezept.bild = null;
    formular.querySelector('.bild-vorschau').innerHTML = bildVorschau();
    knopf.hidden = true;
  } else if (knopf.hasAttribute('data-abbrechen')) {
    zurueckGehen(istNeu ? '#/rezepte' : `#/rezept/${rezept.id}`);
  } else if (knopf.hasAttribute('data-loeschen')) {
    if (confirm(`Rezept „${rezept.titel}“ wirklich löschen?\n\nEs wird auch aus dem Kalender entfernt.`)) {
      await rezeptLoeschen(rezept.id);
      location.replace('#/rezepte');
    }
  }
}

async function geaendert(ereignis) {
  const ziel = ereignis.target;

  // "nach Geschmack" braucht keine Menge
  if (ziel.matches('.zutat-einheit')) {
    const mengenFeld = ziel.closest('.zutat-zeile').querySelector('.zutat-menge');
    mengenFeld.disabled = ziel.value === 'nach Geschmack';
    if (mengenFeld.disabled) mengenFeld.value = '';
  }

  if (ziel.matches('[data-bild]') && ziel.files[0]) {
    try {
      rezept.bild = await bildVerkleinern(ziel.files[0]);
      formular.querySelector('.bild-vorschau').innerHTML = bildVorschau();
      formular.querySelector('[data-bild-entfernen]').hidden = false;
    } catch (fehler) {
      alert(fehler.message);
    }
    ziel.value = '';
  }
}

// Bekannte Zutaten in ihrer bisherigen Schreibweise übernehmen ("zwiebeln" → "Zwiebeln"),
// damit die Einkaufsliste gleiche Zutaten zusammenrechnen kann.
function zutatName(eingabe) {
  const name = eingabe.trim().replace(/\s+/g, ' ');
  return zutatenNamen.find((bekannt) => gleicherName(bekannt, name)) ?? name;
}

async function speichernGeklickt(ereignis) {
  ereignis.preventDefault();

  const titel = formular.titel.value.trim();
  const titelFehler = formular.querySelector('[data-titel-fehler]');
  titelFehler.hidden = Boolean(titel);
  if (!titel) {
    formular.titel.focus();
    return;
  }

  const dauer = parseInt(formular.dauer.value, 10);
  const editor = formular.querySelector('.editor');

  rezept.titel = titel;
  rezept.dauer = dauer > 0 ? dauer : null;
  rezept.kategorien = [...formular.querySelectorAll('[data-kategorie][aria-pressed=true]')]
    .map((knopf) => knopf.dataset.kategorie);
  rezept.zutaten = [...formular.querySelectorAll('.zutat-zeile')]
    .map((zeile) => {
      const einheit = zeile.querySelector('.zutat-einheit').value;
      return {
        name: zutatName(zeile.querySelector('.zutat-name').value),
        menge: einheit === 'nach Geschmack' ? null : zahlLesen(zeile.querySelector('.zutat-menge').value),
        einheit,
      };
    })
    .filter((zutat) => zutat.name);
  rezept.zubereitung = editor.textContent.trim() ? htmlBereinigen(editor.innerHTML) : '';

  await speichern('rezepte', rezept);

  // Nach dem Speichern zur Ansicht des Rezepts
  if (istNeu) {
    location.replace(`#/rezept/${rezept.id}`);
  } else {
    zurueckGehen(`#/rezept/${rezept.id}`);
  }
}
