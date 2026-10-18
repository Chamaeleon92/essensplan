// Speichert alle Daten im Browser (IndexedDB).
// IndexedDB hat deutlich mehr Platz als localStorage, das brauchen wir später für die Rezeptbilder.

const DB_NAME = 'essensplan';
const DB_VERSION = 1;

const START_KATEGORIEN = [
  'Asiatisch', 'Bowl', 'Deutsch', 'Dessert / Süßes', 'Fisch', 'Fleisch', 'Für Gäste',
  'Indisch', 'Italienisch', 'Low Carb', 'Meal Prep', 'Mediterran', 'Mexikanisch',
  'Ofengericht / Auflauf', 'Orientalisch', 'Pasta', 'Pfannengericht', 'Salat',
  'Schnell (unter 30 Min.)', 'Suppe & Eintopf', 'Vegan', 'Vegetarisch',
];

let verbindung;

// Öffnet die Datenbank. Beim allerersten Start werden die Tabellen angelegt
// und die Startkategorien eingetragen.
function oeffnen() {
  if (!verbindung) {
    verbindung = new Promise((resolve, reject) => {
      const anfrage = indexedDB.open(DB_NAME, DB_VERSION);

      anfrage.onupgradeneeded = () => {
        const db = anfrage.result;
        db.createObjectStore('rezepte', { keyPath: 'id' });
        const plan = db.createObjectStore('plan', { keyPath: 'id' });
        plan.createIndex('datum', 'datum');
        const kategorien = db.createObjectStore('kategorien', { keyPath: 'id' });
        for (const name of START_KATEGORIEN) {
          kategorien.add({ id: neueId(), name });
        }
      };

      anfrage.onsuccess = () => resolve(anfrage.result);
      anfrage.onerror = () => reject(anfrage.error);
    });
  }
  return verbindung;
}

// Führt eine Aktion in einer Transaktion aus und wartet, bis sie abgeschlossen ist.
async function transaktion(tabellen, modus, aktion) {
  const db = await oeffnen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(tabellen, modus);
    let ergebnis;
    Promise.resolve(aktion(tx)).then((wert) => { ergebnis = wert; });
    tx.oncomplete = () => resolve(ergebnis);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Wandelt eine einzelne IndexedDB-Anfrage in ein Promise um.
function warten(anfrage) {
  return new Promise((resolve, reject) => {
    anfrage.onsuccess = () => resolve(anfrage.result);
    anfrage.onerror = () => reject(anfrage.error);
  });
}

export function neueId() {
  return crypto.randomUUID();
}

export function alle(tabelle) {
  return transaktion(tabelle, 'readonly', (tx) => warten(tx.objectStore(tabelle).getAll()));
}

export function holen(tabelle, id) {
  return transaktion(tabelle, 'readonly', (tx) => warten(tx.objectStore(tabelle).get(id)));
}

export function speichern(tabelle, eintrag) {
  return transaktion(tabelle, 'readwrite', (tx) => {
    tx.objectStore(tabelle).put(eintrag);
  });
}

// ---------- Kategorien ----------

export async function alleKategorien() {
  const kategorien = await alle('kategorien');
  return kategorien.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

// Löscht eine Kategorie und entfernt sie aus allen Rezepten.
// Die Rezepte selbst bleiben erhalten.
export function kategorieLoeschen(id) {
  return transaktion(['kategorien', 'rezepte'], 'readwrite', async (tx) => {
    tx.objectStore('kategorien').delete(id);
    const rezepteTabelle = tx.objectStore('rezepte');
    const rezepte = await warten(rezepteTabelle.getAll());
    for (const rezept of rezepte) {
      if (rezept.kategorien?.includes(id)) {
        rezept.kategorien = rezept.kategorien.filter((k) => k !== id);
        rezepteTabelle.put(rezept);
      }
    }
  });
}

// ---------- Rezepte ----------

export async function alleRezepte() {
  const rezepte = await alle('rezepte');
  return rezepte.sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
}

// Löscht ein Rezept und nimmt es aus dem Kalender.
export function rezeptLoeschen(id) {
  return transaktion(['rezepte', 'plan'], 'readwrite', async (tx) => {
    tx.objectStore('rezepte').delete(id);
    const planTabelle = tx.objectStore('plan');
    const eintraege = await warten(planTabelle.getAll());
    for (const eintrag of eintraege) {
      if (eintrag.rezeptId === id) {
        planTabelle.delete(eintrag.id);
      }
    }
  });
}

// Alle Zutatennamen, die in irgendeinem Rezept vorkommen – für Vorschläge und den Zutatenfilter.
export async function alleZutatenNamen() {
  const rezepte = await alle('rezepte');
  const namen = new Map(); // klein geschrieben → Schreibweise, wie sie zuerst vorkam
  for (const rezept of rezepte) {
    for (const zutat of rezept.zutaten) {
      const schluessel = zutat.name.toLocaleLowerCase('de');
      if (!namen.has(schluessel)) namen.set(schluessel, zutat.name);
    }
  }
  return [...namen.values()].sort((a, b) => a.localeCompare(b, 'de'));
}

// ---------- Kalender (Plan) ----------
// Ein Planeintrag sieht so aus: { id, datum: "2026-10-20", rezeptId }

// Alle Einträge zwischen zwei Tagen (jeweils einschließlich), z. B. für eine Woche
export function planImZeitraum(von, bis) {
  return transaktion('plan', 'readonly', (tx) => {
    const bereich = IDBKeyRange.bound(von, bis);
    return warten(tx.objectStore('plan').index('datum').getAll(bereich));
  });
}

// Gibt die ID des neuen Eintrags zurück
export async function planEintragen(datum, rezeptId) {
  const id = neueId();
  await speichern('plan', { id, datum, rezeptId });
  return id;
}

export function planVerschieben(id, datum) {
  return transaktion('plan', 'readwrite', async (tx) => {
    const tabelle = tx.objectStore('plan');
    const eintrag = await warten(tabelle.get(id));
    if (eintrag) tabelle.put({ ...eintrag, datum });
  });
}

export function planEntfernen(id) {
  return transaktion('plan', 'readwrite', (tx) => {
    tx.objectStore('plan').delete(id);
  });
}

// ---------- Bewertungen ("Wie war's?") ----------
// Die Bewertung steht direkt am Planeintrag: bewertung = 1–5 Herzen, 0 = übersprungen.

export function planBewerten(id, bewertung) {
  return transaktion('plan', 'readwrite', async (tx) => {
    const tabelle = tx.objectStore('plan');
    const eintrag = await warten(tabelle.get(id));
    if (eintrag) tabelle.put({ ...eintrag, bewertung });
  });
}

// Noch nicht bewertete Abende der letzten 7 Tage (ohne heute), der jüngste zuerst
export async function offeneBewertungen(von, bis) {
  const eintraege = await planImZeitraum(von, bis);
  return eintraege
    .filter((eintrag) => eintrag.bewertung === undefined)
    .sort((a, b) => b.datum.localeCompare(a.datum));
}

// Durchschnitt pro Rezept: Map von Rezept-ID → { schnitt: 4.5, anzahl: 2 }
export async function bewertungenProRezept() {
  const summen = new Map();
  for (const eintrag of await alle('plan')) {
    if (!eintrag.bewertung) continue;
    const bisher = summen.get(eintrag.rezeptId) ?? { summe: 0, anzahl: 0 };
    summen.set(eintrag.rezeptId, { summe: bisher.summe + eintrag.bewertung, anzahl: bisher.anzahl + 1 });
  }
  return new Map([...summen].map(([id, { summe, anzahl }]) => [id, { schnitt: summe / anzahl, anzahl }]));
}

// ---------- Zum Ausprobieren ----------

// Löscht alle Rezepte und den Kalender und stellt die Startkategorien wieder her.
export function allesZuruecksetzen() {
  return transaktion(['rezepte', 'plan', 'kategorien'], 'readwrite', (tx) => {
    tx.objectStore('rezepte').clear();
    tx.objectStore('plan').clear();
    const kategorien = tx.objectStore('kategorien');
    kategorien.clear();
    for (const name of START_KATEGORIEN) {
      kategorien.add({ id: neueId(), name });
    }
  });
}
