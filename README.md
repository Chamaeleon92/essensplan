# essensplan
Web-App zur gemeinsamen Wochenplanung von Rezepten und Mahlzeiten – mit automatisch erstellter Einkaufsliste.

Alle Anforderungen stehen in [ANFORDERUNGEN.md](ANFORDERUNGEN.md).

## App starten

1. Ordner in VS Code öffnen
2. Rechtsklick auf `index.html` → **Open with Live Server**

Ein Doppelklick auf `index.html` reicht nicht: Die App ist in mehrere JavaScript-Dateien (Module) aufgeteilt, und die lädt der Browser nur über einen Webserver.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst mit Kopfzeile und Navigation |
| `css/style.css` | Gestaltung (inkl. dunklem Modus) |
| `js/app.js` | Startpunkt, wechselt zwischen den Ansichten |
| `js/db.js` | Datenspeicherung im Browser (IndexedDB) |
| `js/hilfen.js` | Kleine Hilfsfunktionen |
| `js/ansichten/` | Eine Datei pro Ansicht (Kalender, Rezepte, Kategorien) |
