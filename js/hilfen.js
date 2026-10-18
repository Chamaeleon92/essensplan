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
