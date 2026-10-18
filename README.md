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
| `js/hilfen.js` | Hilfsfunktionen (Mengen, Dauer, Bilder verkleinern, Text bereinigen) |
| `js/datum.js` | Datumsfunktionen (Wochen, Monate, Kalenderwoche, deutsche Formate) |
| `js/einkaufsliste.js` | Einkaufsliste berechnen (zusammenrechnen, umrechnen, sortieren) |
| `js/ziehen.js` | Drag & Drop im Kalender (Maus und Finger) mit Papierkorb |
| `js/beispieldaten.js` | 8 Beispielrezepte zum Ausprobieren |
| `js/kopf.js` | Kopfzeile mit Titel, Zurück-Knopf und Aktionen |
| `js/kachel.js` | Rezept-Kachel (Bild, Titel, Dauer, Kategorien, Favorit) |
| `js/rezeptliste.js` | Rezeptliste mit Suche und Filter (auch für das Kalender-Overlay) |
| `js/ansichten/` | Eine Datei pro Ansicht: Kalender, Rezepte, Rezept ansehen, Rezept bearbeiten, Kategorien |

## Beispielrezepte

Zum Ausprobieren gibt es 8 Beispielrezepte. Sie werden angelegt und in diese und nächste Woche eingeplant:

- in der leeren Rezeptliste auf **Beispielrezepte laden** tippen, oder
- die Adresse um `#/beispieldaten` ergänzen, z. B. `http://127.0.0.1:5500/index.html#/beispieldaten`

Rezepte, die es schon gibt, werden nicht doppelt angelegt.
