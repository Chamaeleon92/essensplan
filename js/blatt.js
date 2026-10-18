// "Bottom Sheets": Fenster, die von unten hereinfahren – wie in Handy-Apps.
// Schließen per ✕, Tippen auf den dunklen Hintergrund oder Herunterwischen am Griff.

import { symbol } from './symbole.js';

const WISCH_SCHWELLE_PX = 90;

// Das HTML für ein Blatt. Den Inhalt füllt man später in ".blatt-inhalt".
export function blattHtml({ klasse = '', titelId }) {
  return `
    <dialog class="blatt ${klasse}" aria-labelledby="${titelId}">
      <div class="blatt-kopf">
        <span class="blatt-griff" aria-hidden="true"></span>
        <h2 id="${titelId}"></h2>
        <button type="button" class="kopf-knopf" data-blatt-schliessen aria-label="Schließen">
          ${symbol.schliessen({ groesse: 20 })}
        </button>
      </div>
      <div class="blatt-inhalt"></div>
    </dialog>
  `;
}

// Verdrahtet Schließen-Knopf, Hintergrund und Wischgeste eines Blatts
export function blattAktivieren(dialog) {
  dialog.addEventListener('click', (ereignis) => {
    if (ereignis.target === dialog || ereignis.target.closest('[data-blatt-schliessen]')) {
      blattSchliessen(dialog);
    }
  });
  // Esc-Taste: mit Animation schließen statt sofort
  dialog.addEventListener('cancel', (ereignis) => {
    ereignis.preventDefault();
    blattSchliessen(dialog);
  });

  const kopf = dialog.querySelector('.blatt-kopf');
  let startY = null;
  let weg = 0;

  kopf.addEventListener('pointerdown', (ereignis) => {
    if (ereignis.target.closest('button')) return;
    startY = ereignis.clientY;
    weg = 0;
    kopf.setPointerCapture(ereignis.pointerId);
    dialog.classList.add('wird-gewischt');
  });
  kopf.addEventListener('pointermove', (ereignis) => {
    if (startY === null) return;
    weg = Math.max(0, ereignis.clientY - startY);
    dialog.style.transform = `translateY(${weg}px)`;
  });
  const ende = () => {
    if (startY === null) return;
    startY = null;
    dialog.classList.remove('wird-gewischt');
    dialog.style.transform = '';
    if (weg > WISCH_SCHWELLE_PX) blattSchliessen(dialog);
  };
  kopf.addEventListener('pointerup', ende);
  kopf.addEventListener('pointercancel', ende);
}

export function blattOeffnen(dialog, titel) {
  dialog.querySelector('h2').textContent = titel;
  dialog.classList.remove('schliesst');
  dialog.showModal();
  dialog.querySelector('.blatt-inhalt').scrollTop = 0;
}

export function blattSchliessen(dialog) {
  if (!dialog.open || dialog.classList.contains('schliesst')) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dialog.close();
    return;
  }
  dialog.classList.add('schliesst');
  setTimeout(() => {
    dialog.classList.remove('schliesst');
    dialog.close();
  }, 200);
}
