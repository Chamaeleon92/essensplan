// Drag & Drop für geplante Gerichte im Kalender – mit Maus und mit dem Finger.
//
// Maus:   anpacken und losziehen
// Finger: kurz gedrückt halten, bis die Kachel "abhebt", dann ziehen.
//         So kann man weiterhin ganz normal scrollen.
//
// Beim Ziehen erscheint unten ein Papierkorb. Am oberen und unteren Rand scrollt die Seite mit.

import { symbol } from './symbole.js';

const HALTEN_MS = 350;      // so lange muss der Finger liegen bleiben
const TOLERANZ_PX = 8;      // so weit darf er sich dabei bewegen
const RAND_PX = 90;         // Abstand zum Rand, ab dem automatisch gescrollt wird
const MAX_SCROLL_PX = 14;   // höchste Scroll-Geschwindigkeit pro Bild

// bereich:     Element, in dem die Planeinträge (.plan-eintrag) liegen
// beiAblegen:  wird aufgerufen mit (eintragId, ziel) – ziel ist
//              { art: 'tag', datum: '2026-10-20' } oder { art: 'papierkorb' }
export function ziehenAktivieren(bereich, beiAblegen) {
  let start = null;   // wo der Finger/die Maus aufgesetzt hat
  let zug = null;     // läuft gerade ein Ziehvorgang? Dann stehen hier die Details
  let halteTimer = null;

  bereich.addEventListener('pointerdown', (ereignis) => {
    const element = ereignis.target.closest('.plan-eintrag');
    if (!element || ereignis.button > 0 || zug) return;

    start = {
      x: ereignis.clientX,
      y: ereignis.clientY,
      element,
      maus: ereignis.pointerType === 'mouse',
    };
    if (!start.maus) {
      halteTimer = setTimeout(() => zugStarten(start.x, start.y), HALTEN_MS);
    }

    document.addEventListener('pointermove', bewegt);
    document.addEventListener('pointerup', losgelassen);
    document.addEventListener('pointercancel', abgebrochen);
    document.addEventListener('touchmove', scrollenVerhindern, { passive: false });
    document.addEventListener('keydown', tasteGedrueckt);
  });

  // Kein Kontextmenü und kein eingebautes Bild-Ziehen auf den Kacheln
  bereich.addEventListener('contextmenu', (ereignis) => {
    if (ereignis.target.closest('.plan-eintrag')) ereignis.preventDefault();
  });
  bereich.addEventListener('dragstart', (ereignis) => ereignis.preventDefault());

  function bewegt(ereignis) {
    if (zug) {
      ereignis.preventDefault();
      zug.x = ereignis.clientX;
      zug.y = ereignis.clientY;
      geistBewegen();
      return;
    }
    const weg = Math.hypot(ereignis.clientX - start.x, ereignis.clientY - start.y);
    if (weg > TOLERANZ_PX) {
      if (start.maus) {
        zugStarten(ereignis.clientX, ereignis.clientY);
      } else {
        // Finger bewegt sich, bevor die Haltezeit um ist → der Nutzer will scrollen
        aufraeumen();
      }
    }
  }

  // Während des Ziehens darf die Seite nicht unter dem Finger wegscrollen
  function scrollenVerhindern(ereignis) {
    if (zug) ereignis.preventDefault();
  }

  function zugStarten(x, y) {
    clearTimeout(halteTimer);
    const element = start.element;
    const rahmen = element.getBoundingClientRect();

    // Eine Kopie der Kachel folgt dem Finger, das Original wird blass
    const geist = element.cloneNode(true);
    geist.classList.add('zieh-geist');
    geist.style.width = `${rahmen.width}px`;
    // Innerhalb der Woche/des Monats einhängen, damit die Kopie genauso aussieht wie das Original
    (element.closest('.woche, .monat') ?? document.body).append(geist);
    element.classList.add('wird-gezogen');

    const papierkorb = document.createElement('div');
    papierkorb.className = 'papierkorb';
    papierkorb.innerHTML = `${symbol.muell({ groesse: 24 })} Hierher ziehen zum Entfernen`;
    document.body.append(papierkorb);
    document.body.classList.add('zieht');

    zug = {
      element,
      geist,
      papierkorb,
      versatzX: x - rahmen.left,
      versatzY: y - rahmen.top,
      x,
      y,
      ziel: null,
      markiert: null,
      scrollSchleife: null,
    };

    navigator.vibrate?.(15);
    geistBewegen();
    autoScrollen();
  }

  function geistBewegen() {
    zug.geist.style.transform = `translate(${zug.x - zug.versatzX}px, ${zug.y - zug.versatzY}px)`;
    zielBestimmen();
  }

  // Was liegt gerade unter dem Finger: ein Tag, der Papierkorb oder nichts?
  function zielBestimmen() {
    const darunter = document.elementFromPoint(zug.x, zug.y);
    const imPapierkorb = Boolean(darunter?.closest('.papierkorb'));
    const tag = imPapierkorb ? null : darunter?.closest('[data-tag]');

    zug.papierkorb.classList.toggle('aktiv', imPapierkorb);
    zug.geist.classList.toggle('ueber-papierkorb', imPapierkorb);
    if (zug.markiert !== tag) {
      zug.markiert?.classList.remove('ziel-markiert');
      tag?.classList.add('ziel-markiert');
      zug.markiert = tag;
    }

    if (imPapierkorb) zug.ziel = { art: 'papierkorb' };
    else if (tag) zug.ziel = { art: 'tag', datum: tag.dataset.tag };
    else zug.ziel = null;
  }

  // Scrollt die Seite, solange der Finger nah am oberen oder unteren Rand ist
  function autoScrollen() {
    if (!zug) return;
    // Oben kleben Kopfzeile und Wochenstreifen – gescrollt wird knapp darunter
    const deckel = Math.max(0, ...[...document.querySelectorAll('.kopfzeile, .wochenstreifen')]
      .map((element) => element.getBoundingClientRect().bottom)
      .filter((kante) => kante < window.innerHeight / 2));
    const oben = deckel + RAND_PX;
    const unten = zug.papierkorb.getBoundingClientRect().top - 30;
    let schritt = 0;
    if (zug.y > deckel && zug.y < oben) {
      schritt = -MAX_SCROLL_PX * Math.min(1, (oben - zug.y) / RAND_PX);
    } else if (zug.y > unten - RAND_PX && zug.y < unten + 30) {
      schritt = MAX_SCROLL_PX * Math.min(1, (zug.y - (unten - RAND_PX)) / RAND_PX);
    }
    if (schritt) {
      window.scrollBy(0, schritt);
      zielBestimmen();
    }
    zug.scrollSchleife = requestAnimationFrame(autoScrollen);
  }

  function losgelassen() {
    if (!zug) {
      aufraeumen();
      return;
    }
    const eintragId = zug.element.dataset.eintrag;
    const ziel = zug.ziel;
    const vorherTag = zug.element.closest('[data-tag]')?.dataset.tag;

    // Nach dem Ziehen soll kein "Klick" auf das Gericht durchrutschen (der würde das Rezept öffnen)
    klickEinmalVerschlucken();
    aufraeumen();

    if (ziel && !(ziel.art === 'tag' && ziel.datum === vorherTag)) {
      beiAblegen(eintragId, ziel);
    }
  }

  function abgebrochen() {
    aufraeumen();
  }

  function tasteGedrueckt(ereignis) {
    if (ereignis.key === 'Escape') aufraeumen();
  }

  function aufraeumen() {
    clearTimeout(halteTimer);
    if (zug) {
      cancelAnimationFrame(zug.scrollSchleife);
      zug.geist.remove();
      zug.papierkorb.remove();
      zug.element.classList.remove('wird-gezogen');
      zug.markiert?.classList.remove('ziel-markiert');
      document.body.classList.remove('zieht');
    }
    zug = null;
    start = null;
    document.removeEventListener('pointermove', bewegt);
    document.removeEventListener('pointerup', losgelassen);
    document.removeEventListener('pointercancel', abgebrochen);
    document.removeEventListener('touchmove', scrollenVerhindern);
    document.removeEventListener('keydown', tasteGedrueckt);
  }
}

function klickEinmalVerschlucken() {
  const verschlucken = (ereignis) => {
    ereignis.stopPropagation();
    ereignis.preventDefault();
  };
  window.addEventListener('click', verschlucken, { capture: true, once: true });
  // Falls gar kein Klick kommt (z. B. am Handy), die Sperre gleich wieder aufheben
  setTimeout(() => window.removeEventListener('click', verschlucken, { capture: true }), 50);
}
