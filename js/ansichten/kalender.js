// Kalender mit Wochen- und Monatsansicht (Startansicht der App).

import {
  alleRezepte, alleKategorien, planImZeitraum, planEintragen, planVerschieben, planEntfernen,
} from '../db.js';
import {
  schluessel, ausSchluessel, plusTage, wochenTage, monatsTage, gleicherTag, kalenderwoche,
  wochentagKurz, datumKurz, datumLang, monatText, wochenText,
} from '../datum.js';
import { sicher } from '../hilfen.js';
import { kopfSetzen } from '../kopf.js';
import { kachel } from '../kachel.js';
import { rezeptlisteAnzeigen, neuerFilter } from '../rezeptliste.js';
import { ziehenAktivieren } from '../ziehen.js';
import { einkaufslisteBerechnen, einkaufslisteText } from '../einkaufsliste.js';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Bleibt erhalten, solange die App offen ist – so landet man nach dem Ansehen
// eines Rezepts wieder in derselben Woche bzw. demselben Monat.
const zustand = {
  modus: gespeicherterModus(), // 'woche' oder 'monat'
  datum: new Date(),           // irgendein Tag in der angezeigten Woche bzw. dem Monat
};
const auswahlFilter = neuerFilter();

let container;
let geplanteRezepte = []; // alle Rezepte der angezeigten Woche (für die Einkaufsliste)
let einkaufText = '';      // fertiger Text der Einkaufsliste zum Kopieren

export async function anzeigen(ziel) {
  kopfSetzen({ titel: 'Kalender' });
  // Eigener Bereich, damit der Klick-Listener verschwindet, sobald man die Ansicht verlässt
  container = document.createElement('div');
  container.className = 'kalender';
  container.addEventListener('click', geklickt);
  ziehenAktivieren(container, abgelegt);
  ziel.append(container);
  await zeichnen();
}

// Die zuletzt gewählte Ansicht merkt sich der Browser (nur eine Bequemlichkeit).
function gespeicherterModus() {
  try {
    return localStorage.getItem('kalender-modus') === 'monat' ? 'monat' : 'woche';
  } catch {
    return 'woche';
  }
}

function modusMerken(modus) {
  try {
    localStorage.setItem('kalender-modus', modus);
  } catch {
    // Kein Problem – dann startet der Kalender beim nächsten Mal in der Wochenansicht
  }
}

async function zeichnen() {
  const istWoche = zustand.modus === 'woche';
  const tage = istWoche ? wochenTage(zustand.datum) : monatsTage(zustand.datum);

  const [eintraege, rezepte, kategorien] = await Promise.all([
    planImZeitraum(schluessel(tage[0]), schluessel(tage[tage.length - 1])),
    alleRezepte(),
    alleKategorien(),
  ]);
  const rezepteNachId = new Map(rezepte.map((r) => [r.id, r]));
  const kategorienNachId = new Map(kategorien.map((k) => [k.id, k]));

  // Einträge nach Tag sortieren: "2026-10-20" → [{ eintrag, rezept }, …]
  const proTag = new Map();
  for (const eintrag of eintraege) {
    const rezept = rezepteNachId.get(eintrag.rezeptId);
    if (!rezept) continue;
    if (!proTag.has(eintrag.datum)) proTag.set(eintrag.datum, []);
    proTag.get(eintrag.datum).push({ eintrag, rezept });
  }
  geplanteRezepte = [...proTag.values()].flat().map(({ rezept }) => rezept);

  const zeitraum = istWoche
    ? `<strong>${wochenText(tage)}</strong><span class="leise">KW ${kalenderwoche(tage[0])}</span>`
    : `<strong>${monatText(zustand.datum)}</strong>`;
  const einheit = istWoche ? 'Woche' : 'Monat';

  container.innerHTML = `
    <div class="kalender-leiste">
      <div class="umschalter" role="group" aria-label="Ansicht">
        <button type="button" data-modus="woche" aria-pressed="${istWoche}">Woche</button>
        <button type="button" data-modus="monat" aria-pressed="${!istWoche}">Monat</button>
      </div>
      <button type="button" class="knopf" data-heute>Heute</button>
    </div>

    <div class="kalender-navigation">
      <button type="button" class="knopf-symbol" data-schritt="-1"
              aria-label="Vorige ${einheit}" title="Vorige ${einheit}">‹</button>
      <div class="kalender-zeitraum" aria-live="polite">${zeitraum}</div>
      <button type="button" class="knopf-symbol" data-schritt="1"
              aria-label="Nächste ${einheit}" title="Nächste ${einheit}">›</button>
    </div>

    ${istWoche ? `
      <button type="button" class="knopf einkauf-knopf" data-einkaufsliste>
        🛒 Einkaufsliste kopieren
      </button>` : ''}

    ${istWoche
      ? wocheHtml(tage, proTag, kategorienNachId)
      : monatHtml(tage, proTag)}

    <dialog class="auswahl" aria-labelledby="auswahl-titel">
      <div class="auswahl-kopf">
        <h2 id="auswahl-titel"></h2>
        <button type="button" class="knopf-symbol" data-schliessen aria-label="Schließen">✕</button>
      </div>
      <div class="auswahl-inhalt"></div>
    </dialog>

    <dialog class="auswahl einkauf" aria-labelledby="einkauf-titel">
      <div class="auswahl-kopf">
        <h2 id="einkauf-titel">Einkaufsliste</h2>
        <button type="button" class="knopf-symbol" data-schliessen aria-label="Schließen">✕</button>
      </div>
      <div class="einkauf-inhalt"></div>
    </dialog>
  `;

  // Tippen auf den abgedunkelten Hintergrund schließt ein Overlay
  for (const dialog of container.querySelectorAll('dialog')) {
    dialog.addEventListener('click', (ereignis) => {
      if (ereignis.target === dialog) dialog.close();
    });
  }
}

function wocheHtml(tage, proTag, kategorienNachId) {
  const heute = new Date();
  return `
    <div class="woche">
      ${tage.map((tag) => {
        const geplant = proTag.get(schluessel(tag)) ?? [];
        return `
          <section class="tag ${gleicherTag(tag, heute) ? 'heute' : ''}" data-tag="${schluessel(tag)}"
                   aria-label="${datumLang(tag)}">
            <div class="tag-kopf">
              <span class="tag-name">${wochentagKurz(tag)}</span>
              <span class="tag-datum">${datumKurz(tag)}</span>
            </div>
            <div class="tag-inhalt">
              ${geplant.map(({ eintrag, rezept }) => `
                <div class="plan-eintrag" data-eintrag="${eintrag.id}">
                  ${kachel(rezept, kategorienNachId)}
                </div>
              `).join('')}
              ${geplant.length ? '' : plusKnopf(tag, 'tag-plus')}
            </div>
          </section>
        `;
      }).join('')}
    </div>
  `;
}

function monatHtml(tage, proTag) {
  const heute = new Date();
  const monat = zustand.datum.getMonth();
  return `
    <div class="monat">
      ${WOCHENTAGE.map((name) => `<div class="monat-wochentag">${name}</div>`).join('')}
      ${tage.map((tag) => {
        const geplant = proTag.get(schluessel(tag)) ?? [];
        const klassen = [
          'monat-tag',
          tag.getMonth() !== monat ? 'anderer-monat' : '',
          gleicherTag(tag, heute) ? 'heute' : '',
        ].join(' ');
        return `
          <div class="${klassen}" data-tag="${schluessel(tag)}">
            <span class="monat-zahl">${tag.getDate()}</span>
            ${geplant.map(({ eintrag, rezept }) => `
              <div class="plan-eintrag" data-eintrag="${eintrag.id}">
                <button type="button" class="monat-eintrag" data-id="${rezept.id}">${sicher(rezept.titel)}</button>
              </div>
            `).join('')}
            ${geplant.length ? '' : plusKnopf(tag, 'monat-plus')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function plusKnopf(tag, klasse) {
  return `
    <button type="button" class="${klasse}" data-planen="${schluessel(tag)}"
            aria-label="Rezept für ${datumLang(tag)} einplanen">＋</button>
  `;
}

async function geklickt(ereignis) {
  const ziel = ereignis.target.closest('button');
  if (!ziel || !container.contains(ziel)) return;

  // Klicks innerhalb des Auswahl-Overlays verarbeitet die Rezeptliste selbst
  if (ziel.closest('.auswahl-inhalt')) return;

  if (ziel.dataset.modus) {
    zustand.modus = ziel.dataset.modus;
    modusMerken(zustand.modus);
    await zeichnen();
  } else if (ziel.hasAttribute('data-heute')) {
    zustand.datum = new Date();
    await zeichnen();
  } else if (ziel.dataset.schritt) {
    const schritt = Number(ziel.dataset.schritt);
    const d = zustand.datum;
    zustand.datum = zustand.modus === 'woche'
      ? plusTage(d, 7 * schritt)
      : new Date(d.getFullYear(), d.getMonth() + schritt, 1);
    await zeichnen();
  } else if (ziel.dataset.planen) {
    await auswahlOeffnen(ziel.dataset.planen);
  } else if (ziel.hasAttribute('data-schliessen')) {
    ziel.closest('dialog').close();
  } else if (ziel.hasAttribute('data-einkaufsliste')) {
    einkaufslisteOeffnen();
  } else if (ziel.hasAttribute('data-kopieren')) {
    await kopieren(ziel);
  } else if (ziel.dataset.id) {
    // Klick auf ein geplantes Gericht öffnet das Rezept
    location.hash = `#/rezept/${ziel.dataset.id}`;
  }
}

// Ein Gericht wurde per Drag & Drop auf einen Tag oder in den Papierkorb gezogen
async function abgelegt(eintragId, ziel) {
  if (ziel.art === 'papierkorb') {
    await planEntfernen(eintragId);
  } else {
    await planVerschieben(eintragId, ziel.datum);
  }
  await zeichnen();
}

// Öffnet das Overlay mit allen Rezepten, um eins für den Tag auszuwählen.
async function auswahlOeffnen(tagSchluessel) {
  const dialog = container.querySelector('dialog.auswahl:not(.einkauf)');
  dialog.querySelector('h2').textContent = `Rezept für ${datumLang(ausSchluessel(tagSchluessel))}`;
  auswahlFilter.suche = ''; // Suche startet jedes Mal leer, die Filter bleiben

  await rezeptlisteAnzeigen(dialog.querySelector('.auswahl-inhalt'), {
    filter: auswahlFilter,
    beiAuswahl: async (rezept) => {
      await planEintragen(tagSchluessel, rezept.id);
      dialog.close();
      await zeichnen();
    },
    leerText: `
      <div class="hinweis">
        <p>Noch keine Rezepte vorhanden.</p>
        <a class="knopf knopf-haupt" href="#/rezept/neu">＋ Erstes Rezept anlegen</a>
      </div>
    `,
  });

  dialog.showModal();
}

// Zeigt die Einkaufsliste der angezeigten Woche als Vorschau an
function einkaufslisteOeffnen() {
  const dialog = container.querySelector('dialog.einkauf');
  const inhalt = dialog.querySelector('.einkauf-inhalt');
  const tage = wochenTage(zustand.datum);
  const titel = `Einkaufsliste ${datumKurz(tage[0])}–${datumKurz(tage[6])}`;
  dialog.querySelector('h2').textContent = titel;

  if (geplanteRezepte.length === 0) {
    einkaufText = '';
    inhalt.innerHTML = '<p class="hinweis">Für diese Woche ist noch nichts geplant.</p>';
    dialog.showModal();
    return;
  }

  const liste = einkaufslisteBerechnen(geplanteRezepte);
  einkaufText = einkaufslisteText(liste, titel);
  const anzahl = geplanteRezepte.length;

  inhalt.innerHTML = `
    <p class="anzahl">${liste.length} Zutaten aus ${anzahl} ${anzahl === 1 ? 'Gericht' : 'Gerichten'}</p>
    ${liste.length ? `
      <ul class="einkauf-liste">
        ${liste.map(({ name, menge }) => `
          <li>
            <span class="zutat-mengenangabe">${menge ? sicher(menge) : '<span class="leise">nach Geschmack</span>'}</span>
            <span>${sicher(name)}</span>
          </li>
        `).join('')}
      </ul>` : '<p class="hinweis">Die geplanten Rezepte haben keine Zutaten.</p>'}
    <div class="einkauf-aktionen">
      <button type="button" class="knopf knopf-haupt" data-kopieren ${liste.length ? '' : 'disabled'}>
        📋 In die Zwischenablage kopieren
      </button>
    </div>
  `;
  dialog.showModal();
}

// Kopiert die Einkaufsliste, damit man sie z. B. in Notizen einfügen kann
async function kopieren(knopf) {
  let geklappt = false;
  try {
    await navigator.clipboard.writeText(einkaufText);
    geklappt = true;
  } catch {
    geklappt = altmodischKopieren(einkaufText);
  }
  knopf.textContent = geklappt ? '✓ Kopiert! Jetzt in Notizen einfügen' : 'Kopieren hat nicht geklappt';
  knopf.classList.toggle('kopiert', geklappt);
}

// Ersatzweg für Browser, die navigator.clipboard nicht erlauben
function altmodischKopieren(text) {
  const feld = document.createElement('textarea');
  feld.value = text;
  feld.setAttribute('readonly', '');
  feld.style.position = 'fixed';
  feld.style.opacity = '0';
  document.body.append(feld);
  feld.select();
  let geklappt = false;
  try {
    geklappt = document.execCommand('copy');
  } catch {
    geklappt = false;
  }
  feld.remove();
  return geklappt;
}
