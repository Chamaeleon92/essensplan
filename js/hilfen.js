// Kleine Hilfsfunktionen, die in mehreren Ansichten gebraucht werden.

// Macht Text sicher, bevor er per innerHTML eingefügt wird.
// So kann z. B. ein Kategoriename wie "<b>" die Seite nicht durcheinanderbringen.
export function sicher(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Vergleicht zwei Namen ohne Rücksicht auf Groß-/Kleinschreibung und Leerzeichen am Rand.
export function gleicherName(a, b) {
  return a.trim().toLocaleLowerCase('de') === b.trim().toLocaleLowerCase('de');
}

export const EINHEITEN = [
  'g', 'kg', 'ml', 'l', 'EL', 'TL', 'Stück', 'Prise', 'Packung', 'Dose', 'nach Geschmack',
];

// Formatiert eine Zahl auf Deutsch, z. B. 1.5 → "1,5"
export function zahl(wert) {
  return wert.toLocaleString('de-DE', { maximumFractionDigits: 2 });
}

// Liest eine Zahl aus einem Eingabefeld. Akzeptiert Komma und Punkt. Leer/ungültig → null
export function zahlLesen(text) {
  const wert = parseFloat(String(text).replace(',', '.'));
  return Number.isFinite(wert) && wert > 0 ? wert : null;
}

const MEHRZAHL = { Prise: 'Prisen', Packung: 'Packungen', Dose: 'Dosen' };

// "200 g", "3 Stück", "2 Dosen", "nach Geschmack" – oder '' wenn es keine Menge gibt
export function mengeText(menge, einheit) {
  if (einheit === 'nach Geschmack') return 'nach Geschmack';
  if (menge == null) return '';
  const anzeige = menge > 1 ? (MEHRZAHL[einheit] ?? einheit) : einheit;
  return `${zahl(menge)} ${anzeige}`;
}

export function dauerText(minuten) {
  if (!minuten) return '';
  if (minuten < 60) return `${minuten} Min.`;
  const stunden = Math.floor(minuten / 60);
  const rest = minuten % 60;
  return rest ? `${stunden} Std. ${rest} Min.` : `${stunden} Std.`;
}

// Lässt aus formatiertem Text (Zubereitung) nur harmlose Formatierungen übrig:
// fett, kursiv, unterstrichen, Listen und Zeilenumbrüche. Alles andere wird entfernt.
const ERLAUBTE_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'BR', 'P', 'DIV']);
const GANZ_ENTFERNEN = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE']);

export function htmlBereinigen(html) {
  const vorlage = document.createElement('template');
  vorlage.innerHTML = html ?? '';
  knotenBereinigen(vorlage.content);
  return vorlage.innerHTML;
}

function knotenBereinigen(eltern) {
  for (const knoten of [...eltern.childNodes]) {
    if (knoten.nodeType === Node.TEXT_NODE) continue;
    if (knoten.nodeType !== Node.ELEMENT_NODE || GANZ_ENTFERNEN.has(knoten.tagName)) {
      knoten.remove();
      continue;
    }
    knotenBereinigen(knoten);
    if (ERLAUBTE_TAGS.has(knoten.tagName)) {
      for (const attribut of [...knoten.attributes]) knoten.removeAttribute(attribut.name);
    } else {
      // Unbekanntes Element (z. B. <span>): Inhalt behalten, Element selbst entfernen
      knoten.replaceWith(...knoten.childNodes);
    }
  }
}

// Verkleinert ein Foto auf höchstens 1200 Pixel Kantenlänge und gibt es als JPEG-Daten-URL zurück.
// Handyfotos haben oft mehrere MB – so bleiben es ca. 150–300 KB.
export function bildVerkleinern(datei, maxKante = 1200) {
  return new Promise((resolve, reject) => {
    const adresse = URL.createObjectURL(datei);
    const bild = new Image();
    bild.onload = () => {
      const faktor = Math.min(1, maxKante / Math.max(bild.naturalWidth, bild.naturalHeight));
      const leinwand = document.createElement('canvas');
      leinwand.width = Math.round(bild.naturalWidth * faktor);
      leinwand.height = Math.round(bild.naturalHeight * faktor);
      leinwand.getContext('2d').drawImage(bild, 0, 0, leinwand.width, leinwand.height);
      URL.revokeObjectURL(adresse);
      resolve(leinwand.toDataURL('image/jpeg', 0.8));
    };
    bild.onerror = () => {
      URL.revokeObjectURL(adresse);
      reject(new Error('Das Bild konnte nicht gelesen werden.'));
    };
    bild.src = adresse;
  });
}

// Jedes Rezept bekommt anhand seiner ID eine feste Pastellfarbe (für Bilder-Platzhalter)
export function farbklasse(id) {
  let summe = 0;
  for (const zeichen of String(id)) summe = (summe * 31 + zeichen.charCodeAt(0)) % 997;
  return `farbe-${summe % 6}`;
}

// Durchschnittliche Bewertung als Text: 4.5 → "4,5", 4 → "4"
export function bewertungText(schnitt) {
  return schnitt.toLocaleString('de-DE', { maximumFractionDigits: 1 });
}
