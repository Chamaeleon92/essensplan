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
| `css/style.css` | Gestaltung „Frisch & verspielt“ (Hell und Dunkel automatisch) |
| `schriften/` | Schriften Fredoka und Nunito (SIL Open Font License), liegen lokal – keine Verbindung zu Google |
| `js/app.js` | Startpunkt, wechselt zwischen den Ansichten |
| `js/db.js` | Datenspeicherung im Browser (IndexedDB) |
| `js/hilfen.js` | Hilfsfunktionen (Mengen, Dauer, Bilder verkleinern, Text bereinigen) |
| `js/datum.js` | Datumsfunktionen (Wochen, Monate, Kalenderwoche, deutsche Formate) |
| `js/einkaufsliste.js` | Einkaufsliste berechnen (zusammenrechnen, umrechnen, sortieren) |
| `js/ziehen.js` | Drag & Drop im Kalender (Maus und Finger) mit Papierkorb |
| `js/beispieldaten.js` | 8 Beispielrezepte zum Ausprobieren |
| `js/symbole.js` | Alle Symbole als SVG |
| `js/blatt.js` | Bottom Sheets (fahren von unten herein, wegwischbar) |
| `js/konfetti.js` | Konfetti, wenn die Woche voll geplant ist |
| `js/kopf.js` | Kopfzeile mit Titel, Zurück-Knopf und Aktionen |
| `js/kachel.js` | Rezept-Kachel (Bild, Titel, Dauer, Kategorien, Favorit) |
| `js/rezeptliste.js` | Rezeptliste mit Suche und Filter (auch für das Kalender-Overlay) |
| `js/ansichten/` | Eine Datei pro Ansicht: Kalender, Rezepte, Rezept ansehen, Rezept bearbeiten, Kategorien |

## Beispielrezepte

Zum Ausprobieren gibt es 20 Beispielrezepte (einige ohne Foto). Sie werden angelegt und in die letzte, diese und nächste Woche eingeplant – der Sonntag dieser Woche bleibt frei zum Würfeln:

- unter **Kategorien → Zum Ausprobieren → Beispielrezepte laden** (oder in der leeren Rezeptliste), oder
- die Adresse um `#/beispieldaten` ergänzen, z. B. `http://127.0.0.1:5500/index.html#/beispieldaten`

Rezepte, die es schon gibt, werden nicht doppelt angelegt. Mit **Alles zurücksetzen** (ebenfalls unter Kategorien) fängt man wieder bei null an.

## Als App installieren

Die App ist eine **Progressive Web App**: Sie lässt sich wie eine normale App auf den Homescreen legen, öffnet sich im Vollbild und funktioniert auch ohne Internet.

- **iPhone/iPad (Safari):** Teilen-Symbol → **Zum Home-Bildschirm**
- **Android (Chrome):** Menü ⋮ → **App installieren**
