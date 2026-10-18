// Startpunkt der App: entscheidet anhand der Adresse (#/kalender, #/rezepte, …),
// welche Ansicht angezeigt wird.

import * as kalender from './ansichten/kalender.js';
import * as rezepte from './ansichten/rezepte.js';
import * as kategorien from './ansichten/kategorien.js';

const ansichten = {
  kalender: { titel: 'Kalender', modul: kalender },
  rezepte: { titel: 'Rezepte', modul: rezepte },
  kategorien: { titel: 'Kategorien', modul: kategorien },
};

const inhalt = document.getElementById('inhalt');
const seitentitel = document.getElementById('seitentitel');

async function ansichtWechseln() {
  // Aus "#/rezepte" wird "rezepte". Ohne Angabe startet die App im Kalender.
  const name = location.hash.replace('#/', '') || 'kalender';
  const ansicht = ansichten[name] ?? ansichten.kalender;

  seitentitel.textContent = ansicht.titel;
  document.title = `${ansicht.titel} · Essensplan`;

  for (const link of document.querySelectorAll('.navigation a')) {
    link.classList.toggle('aktiv', link.dataset.ansicht === name);
  }

  inhalt.innerHTML = '';
  await ansicht.modul.anzeigen(inhalt);
}

window.addEventListener('hashchange', ansichtWechseln);
ansichtWechseln();
