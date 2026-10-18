// Kalender mit Wochen- und Monatsansicht (Startansicht der App).

import {
  alleRezepte, alleKategorien, planImZeitraum, planEintragen, planVerschieben, planEntfernen,
} from '../db.js';
import {
  schluessel, ausSchluessel, plusTage, wochenTage, monatsTage, gleicherTag, kalenderwoche,
  wochentagKurz, datumKurz, datumLang, monatText, wochenText, wochenStart,
} from '../datum.js';
import { sicher, dauerText, farbklasse } from '../hilfen.js';
import { kopfSetzen } from '../kopf.js';
import { symbol } from '../symbole.js';
import { blattHtml, blattAktivieren, blattOeffnen, blattSchliessen } from '../blatt.js';
import { konfetti } from '../konfetti.js';
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
let alleRezepteListe = [];    // alle Rezepte (zum Würfeln)
let geplanteRezepte = [];     // alle Rezepte der angezeigten Woche (für Einkaufsliste und Würfel)
// Einkaufsliste der angezeigten Woche: alle Zutaten, die markierten (= kaufen wir) und Titel
const einkauf = { liste: [], ausgewaehlt: new Set(), titel: '', woche: '' };
let neuerEintragId = null;    // dieser Eintrag "ploppt" beim nächsten Zeichnen herein
let fortschrittVorher = null; // { woche, anzahl } – um eine gerade voll gewordene Woche zu feiern

export async function anzeigen(ziel) {
  // Eigener Bereich, damit der Klick-Listener verschwindet, sobald man die Ansicht verlässt
  container = document.createElement('div');
  container.className = 'kalender';
  container.addEventListener('click', geklickt);
  ziehenAktivieren(container, abgelegt);
  ziel.append(container);
  fortschrittVorher = null;
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

// "Diese Woche", "Nächste Woche", … oder "KW 45"
function wochenName(montag) {
  const abstand = Math.round((montag - wochenStart(new Date())) / (7 * 86400000));
  if (abstand === 0) return 'Diese Woche';
  if (abstand === 1) return 'Nächste Woche';
  if (abstand === -1) return 'Letzte Woche';
  return `KW ${kalenderwoche(montag)}`;
}

function kopfAktualisieren(istWoche, tage) {
  const einheit = istWoche ? 'Woche' : 'Monat';
  const aktionen = [];
  if (istWoche) {
    aktionen.push({
      symbol: symbol.wagen({ groesse: 20 }),
      label: 'Einkaufsliste',
      hervorgehoben: true,
      beiKlick: einkaufslisteOeffnen,
    });
  }
  aktionen.push(
    { symbol: symbol.links({ groesse: 20 }), label: `Vorige ${einheit}`, beiKlick: () => blaettern(-1) },
    { symbol: symbol.rechts({ groesse: 20 }), label: `Nächste ${einheit}`, beiKlick: () => blaettern(1) },
  );
  kopfSetzen({
    untertitel: 'Hallo ihr zwei!',
    titel: istWoche ? wochenName(tage[0]) : monatText(zustand.datum),
    aktionen,
  });
}

async function zeichnen() {
  const istWoche = zustand.modus === 'woche';
  const tage = istWoche ? wochenTage(zustand.datum) : monatsTage(zustand.datum);

  const [eintraege, rezepte, kategorien] = await Promise.all([
    planImZeitraum(schluessel(tage[0]), schluessel(tage[tage.length - 1])),
    alleRezepte(),
    alleKategorien(),
  ]);
  alleRezepteListe = rezepte;
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

  kopfAktualisieren(istWoche, tage);

  const heute = new Date();
  const zeigtHeute = istWoche
    ? tage.some((tag) => gleicherTag(tag, heute))
    : zustand.datum.getMonth() === heute.getMonth() && zustand.datum.getFullYear() === heute.getFullYear();
  const zeitraum = istWoche ? `${wochenText(tage)} · KW ${kalenderwoche(tage[0])}` : '';

  container.innerHTML = `
    <div class="kalender-leiste">
      <div class="umschalter" role="group" aria-label="Ansicht">
        <button type="button" data-modus="woche" aria-pressed="${istWoche}">Woche</button>
        <button type="button" data-modus="monat" aria-pressed="${!istWoche}">Monat</button>
      </div>
      ${zeigtHeute
        ? `<span class="zeitraum">${zeitraum}</span>`
        : '<button type="button" class="knopf knopf-klein" data-heute>Zu heute</button>'}
    </div>

    ${istWoche
      ? wocheHtml(tage, proTag, kategorienNachId)
      : monatHtml(tage, proTag)}

    ${blattHtml({ klasse: 'auswahl', titelId: 'auswahl-titel' })}
    ${blattHtml({ klasse: 'einkauf', titelId: 'einkauf-titel' })}
  `;

  for (const dialog of container.querySelectorAll('dialog')) blattAktivieren(dialog);

  // Gerade eingeplantes Gericht hereinploppen lassen
  if (neuerEintragId) {
    container.querySelector(`[data-eintrag="${neuerEintragId}"]`)?.classList.add('neu');
    neuerEintragId = null;
  }

  if (istWoche) feiernWennVoll(tage, proTag);
}

// ---------- Wochenansicht ----------

function wocheHtml(tage, proTag, kategorienNachId) {
  const heute = new Date();
  const geplanteTage = tage.filter((tag) => proTag.has(schluessel(tag))).length;

  return `
    <div class="wochenstreifen">
      ${tage.map((tag) => {
        const klassen = ['streifen-tag'];
        if (gleicherTag(tag, heute)) klassen.push('heute');
        if (proTag.has(schluessel(tag))) klassen.push('geplant');
        return `
          <button type="button" class="${klassen.join(' ')}" data-tag="${schluessel(tag)}" data-springen
                  aria-label="${datumLang(tag)}">
            <span class="streifen-name">${wochentagKurz(tag)}</span>
            <span class="streifen-zahl">${tag.getDate()}</span>
            <span class="streifen-punkt"></span>
          </button>
        `;
      }).join('')}
    </div>

    ${fortschrittHtml(geplanteTage)}

    <div class="woche">
      ${tage.map((tag) => {
        const geplant = proTag.get(schluessel(tag)) ?? [];
        const istHeute = gleicherTag(tag, heute);
        return `
          <section class="tag ${istHeute ? 'heute' : ''}" data-tag="${schluessel(tag)}" id="tag-${schluessel(tag)}"
                   aria-label="${datumLang(tag)}">
            ${geplant.map(({ eintrag, rezept }) => planKarte(tag, eintrag, rezept, kategorienNachId, istHeute)).join('')}
            ${geplant.length ? '' : leererTag(tag, istHeute)}
          </section>
        `;
      }).join('')}
    </div>
  `;
}

function fortschrittHtml(anzahl) {
  const voll = anzahl === 7;
  const rest = 7 - anzahl;
  let titel = `${anzahl} von 7 Abenden geplant`;
  let text = rest === 1 ? 'Noch 1 Tag – würfelt doch was aus!' : `Noch ${rest} Tage – würfelt doch was aus!`;
  if (anzahl === 0) {
    titel = 'Noch nichts geplant';
    text = 'Tippt auf ＋ oder lasst den Würfel entscheiden.';
  }
  if (voll) {
    titel = 'Guten Appetit! 🎉';
    text = 'Die ganze Woche ist geplant.';
  }
  return `
    <div class="fortschritt ${voll ? 'voll' : ''}">
      <div class="ring" style="--anteil: ${anzahl / 7}" role="img" aria-label="${anzahl} von 7 Abenden geplant">
        <span>${voll ? symbol.haken({ groesse: 20 }) : `${anzahl}/7`}</span>
      </div>
      <div class="fortschritt-text">
        <strong>${titel}</strong>
        <span>${text}</span>
      </div>
    </div>
  `;
}

function planKarte(tag, eintrag, rezept, kategorienNachId, istHeute) {
  const kategorie = (rezept.kategorien ?? [])
    .map((id) => kategorienNachId.get(id)?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'de'))[0];
  const info = [dauerText(rezept.dauer), kategorie].filter(Boolean).join(' · ');
  const tagText = istHeute ? `Heute Abend · ${wochentagKurz(tag)}` : `${wochentagKurz(tag)} ${datumKurz(tag)}`;

  return `
    <div class="plan-eintrag" data-eintrag="${eintrag.id}">
      <button type="button" class="plan-karte ${istHeute ? 'heute' : ''}" data-id="${rezept.id}">
        <span class="plan-bild ${farbklasse(rezept.id)}">
          ${rezept.bild ? `<img src="${rezept.bild}" alt="">` : symbol.teller({ groesse: istHeute ? 48 : 28 })}
        </span>
        <span class="plan-text">
          <span class="plan-tag">${tagText}</span>
          <span class="plan-titel">${sicher(rezept.titel)}</span>
          ${info ? `<span class="plan-info">${sicher(info)}</span>` : ''}
        </span>
        ${rezept.favorit ? `<span class="plan-stern" title="Favorit">${symbol.stern({ groesse: 22, fuellung: 'currentColor' })}</span>` : ''}
      </button>
    </div>
  `;
}

function leererTag(tag, istHeute) {
  const tagText = istHeute ? `Heute · ${wochentagKurz(tag)} ${datumKurz(tag)}` : `${wochentagKurz(tag)} ${datumKurz(tag)}`;
  return `
    <div class="leerer-tag ${istHeute ? 'heute' : ''}">
      <span class="leer-text">
        <span class="plan-tag">${tagText}</span>
        <span class="leer-hinweis">Noch nichts geplant</span>
      </span>
      <button type="button" class="knopf-wuerfel" data-wuerfeln="${schluessel(tag)}"
              aria-label="Zufälliges Rezept für ${datumLang(tag)} würfeln">
        ${symbol.wuerfel({ groesse: 18 })} Würfeln
      </button>
      <button type="button" class="knopf-plus" data-planen="${schluessel(tag)}"
              aria-label="Rezept für ${datumLang(tag)} einplanen">
        ${symbol.plus({ groesse: 20 })}
      </button>
    </div>
  `;
}

// ---------- Monatsansicht ----------

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
                <button type="button" class="monat-eintrag ${farbklasse(rezept.id)}" data-id="${rezept.id}">${sicher(rezept.titel)}</button>
              </div>
            `).join('')}
            ${geplant.length ? '' : `
              <button type="button" class="monat-plus" data-planen="${schluessel(tag)}"
                      aria-label="Rezept für ${datumLang(tag)} einplanen">${symbol.plus({ groesse: 16 })}</button>`}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ---------- Bedienung ----------

async function blaettern(schritt) {
  const d = zustand.datum;
  zustand.datum = zustand.modus === 'woche'
    ? plusTage(d, 7 * schritt)
    : new Date(d.getFullYear(), d.getMonth() + schritt, 1);
  fortschrittVorher = null;
  await zeichnen();
}

async function geklickt(ereignis) {
  const ziel = ereignis.target.closest('button');
  if (!ziel || !container.contains(ziel)) return;

  // Klicks innerhalb des Auswahl-Blatts verarbeitet die Rezeptliste selbst
  if (ziel.closest('.auswahl .blatt-inhalt')) return;

  if (ziel.dataset.modus) {
    zustand.modus = ziel.dataset.modus;
    modusMerken(zustand.modus);
    fortschrittVorher = null;
    await zeichnen();
  } else if (ziel.hasAttribute('data-heute')) {
    zustand.datum = new Date();
    fortschrittVorher = null;
    await zeichnen();
  } else if (ziel.hasAttribute('data-springen')) {
    container.querySelector(`#tag-${ziel.dataset.tag}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else if (ziel.dataset.planen) {
    await auswahlOeffnen(ziel.dataset.planen);
  } else if (ziel.dataset.wuerfeln) {
    await wuerfeln(ziel.dataset.wuerfeln, ziel);
  } else if (ziel.dataset.zutat !== undefined) {
    zutatUmschalten(ziel);
  } else if (ziel.hasAttribute('data-alle')) {
    alleUmschalten();
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
    neuerEintragId = eintragId;
  }
  await zeichnen();
}

// Würfelt ein zufälliges Rezept für einen Tag. Bevorzugt Rezepte, die diese Woche
// noch nicht dran sind – Favoriten haben doppelte Chancen.
async function wuerfeln(tagSchluessel, knopf) {
  if (alleRezepteListe.length === 0) {
    await auswahlOeffnen(tagSchluessel);
    return;
  }
  const schonGeplant = new Set(geplanteRezepte.map((r) => r.id));
  const frische = alleRezepteListe.filter((r) => !schonGeplant.has(r.id));
  const auswahl = frische.length ? frische : alleRezepteListe;
  const lose = auswahl.flatMap((r) => (r.favorit ? [r, r] : [r]));
  const rezept = lose[Math.floor(Math.random() * lose.length)];

  knopf.classList.add('rollt');
  navigator.vibrate?.(20);
  await new Promise((fertig) => setTimeout(fertig, 450));

  neuerEintragId = await planEintragen(tagSchluessel, rezept.id);
  await zeichnen();
}

// Feiert mit Konfetti, wenn die Woche gerade eben voll geworden ist
function feiernWennVoll(tage, proTag) {
  const woche = schluessel(tage[0]);
  const anzahl = tage.filter((tag) => proTag.has(schluessel(tag))).length;
  if (fortschrittVorher?.woche === woche && fortschrittVorher.anzahl < 7 && anzahl === 7) {
    konfetti();
    navigator.vibrate?.([30, 60, 30]);
  }
  fortschrittVorher = { woche, anzahl };
}

// Öffnet das Blatt mit allen Rezepten, um eins für den Tag auszuwählen.
async function auswahlOeffnen(tagSchluessel) {
  const dialog = container.querySelector('dialog.auswahl');
  auswahlFilter.suche = ''; // Suche startet jedes Mal leer, die Filter bleiben

  await rezeptlisteAnzeigen(dialog.querySelector('.blatt-inhalt'), {
    filter: auswahlFilter,
    beiAuswahl: async (rezept) => {
      neuerEintragId = await planEintragen(tagSchluessel, rezept.id);
      blattSchliessen(dialog);
      await zeichnen();
    },
    leerText: `
      <div class="hinweis">
        <p>Noch keine Rezepte vorhanden.</p>
        <a class="knopf knopf-haupt" href="#/rezept/neu">${symbol.plus({ groesse: 18 })} Erstes Rezept anlegen</a>
      </div>
    `,
  });

  blattOeffnen(dialog, `Rezept für ${datumLang(ausSchluessel(tagSchluessel))}`);
}

// ---------- Einkaufsliste ----------

function einkaufslisteOeffnen() {
  const dialog = container.querySelector('dialog.einkauf');
  const inhalt = dialog.querySelector('.blatt-inhalt');
  const tage = wochenTage(zustand.datum);
  einkauf.titel = `Einkaufsliste ${datumKurz(tage[0])}–${datumKurz(tage[6])}`;
  einkauf.woche = schluessel(tage[0]);

  if (geplanteRezepte.length === 0) {
    einkauf.liste = [];
    inhalt.innerHTML = '<p class="hinweis">Für diese Woche ist noch nichts geplant.</p>';
    blattOeffnen(dialog, einkauf.titel);
    return;
  }

  einkauf.liste = einkaufslisteBerechnen(geplanteRezepte);
  // Gemerkte Auswahl dieser Woche – aber nur Zutaten, die es noch gibt
  const vorhanden = new Set(einkauf.liste.map(zutatSchluessel));
  einkauf.ausgewaehlt = new Set(auswahlLesen(einkauf.woche).filter((name) => vorhanden.has(name)));
  const anzahl = geplanteRezepte.length;

  inhalt.innerHTML = `
    <p class="anzahl">${einkauf.liste.length} Zutaten aus ${anzahl} ${anzahl === 1 ? 'Gericht' : 'Gerichten'}</p>
    ${einkauf.liste.length ? `
      <div class="einkauf-leiste">
        <span class="einkauf-hinweis">Tippt an, was ihr noch kaufen müsst.</span>
        <button type="button" class="knopf knopf-klein" data-alle></button>
      </div>
      <ul class="einkauf-liste">
        ${einkauf.liste.map((zutat, i) => `
          <li>
            <button type="button" class="einkauf-eintrag" role="checkbox" data-zutat="${i}"
                    aria-checked="${einkauf.ausgewaehlt.has(zutatSchluessel(zutat))}">
              <span class="einkauf-haken">${symbol.haken({ groesse: 16 })}</span>
              <span class="zutat-mengenangabe">${zutat.menge ? sicher(zutat.menge) : 'nach Geschmack'}</span>
              <span class="einkauf-name">${sicher(zutat.name)}</span>
            </button>
          </li>
        `).join('')}
      </ul>` : '<p class="hinweis">Die geplanten Rezepte haben keine Zutaten.</p>'}
    <div class="blatt-aktionen">
      <button type="button" class="knopf knopf-haupt" data-kopieren></button>
    </div>
  `;
  auswahlAnzeigen();
  blattOeffnen(dialog, einkauf.titel);
}

function zutatSchluessel(zutat) {
  return zutat.name.toLocaleLowerCase('de');
}

function zutatUmschalten(eintrag) {
  const name = zutatSchluessel(einkauf.liste[Number(eintrag.dataset.zutat)]);
  if (einkauf.ausgewaehlt.has(name)) {
    einkauf.ausgewaehlt.delete(name);
  } else {
    einkauf.ausgewaehlt.add(name);
  }
  eintrag.setAttribute('aria-checked', String(einkauf.ausgewaehlt.has(name)));
  auswahlMerken();
  auswahlAnzeigen();
}

// "Alle" markiert alles – sind schon alle markiert, wird der Knopf zu "Keine"
function alleUmschalten() {
  const alleMarkiert = einkauf.ausgewaehlt.size === einkauf.liste.length;
  einkauf.ausgewaehlt = alleMarkiert ? new Set() : new Set(einkauf.liste.map(zutatSchluessel));
  for (const eintrag of container.querySelectorAll('.einkauf-eintrag')) {
    eintrag.setAttribute('aria-checked', String(!alleMarkiert));
  }
  auswahlMerken();
  auswahlAnzeigen();
}

// Aktualisiert den Alle/Keine-Knopf und den Kopier-Knopf passend zur Auswahl
function auswahlAnzeigen() {
  const anzahl = einkauf.ausgewaehlt.size;
  const alleKnopf = container.querySelector('[data-alle]');
  if (alleKnopf) alleKnopf.textContent = anzahl === einkauf.liste.length ? 'Keine' : 'Alle';

  const kopierKnopf = container.querySelector('[data-kopieren]');
  kopierKnopf.disabled = anzahl === 0;
  kopierKnopf.classList.remove('kopiert');
  kopierKnopf.innerHTML = anzahl === 0
    ? '<span>Noch nichts ausgewählt</span>'
    : `${symbol.kopieren({ groesse: 20 })} <span>${anzahl === 1 ? '1 Zutat' : `${anzahl} Zutaten`} kopieren</span>`;
}

// Die Auswahl wird pro Woche im Browser gemerkt (nur eine Bequemlichkeit)
function auswahlLesen(woche) {
  try {
    return JSON.parse(localStorage.getItem(`einkauf-${woche}`)) ?? [];
  } catch {
    return [];
  }
}

function auswahlMerken() {
  try {
    localStorage.setItem(`einkauf-${einkauf.woche}`, JSON.stringify([...einkauf.ausgewaehlt]));
  } catch {
    // Kein Problem – dann ist die Auswahl beim nächsten Öffnen eben leer
  }
}

// Kopiert die markierten Zutaten, damit man sie z. B. in Notizen einfügen kann
async function kopieren(knopf) {
  const markiert = einkauf.liste.filter((zutat) => einkauf.ausgewaehlt.has(zutatSchluessel(zutat)));
  const text = einkaufslisteText(markiert, einkauf.titel);
  let geklappt = false;
  try {
    await navigator.clipboard.writeText(text);
    geklappt = true;
  } catch {
    geklappt = altmodischKopieren(text);
  }
  knopf.innerHTML = geklappt
    ? `${symbol.haken({ groesse: 20 })} <span>Kopiert! Jetzt in Notizen einfügen</span>`
    : '<span>Kopieren hat nicht geklappt</span>';
  knopf.classList.toggle('kopiert', geklappt);
  if (geklappt) navigator.vibrate?.(15);
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
