# Anforderungen – Essensplan

Web-App für zwei Personen, um jede Woche Rezepte einzuplanen und daraus die Einkaufsliste zu erstellen.

- **Bedienung:** hauptsächlich am Handy und Tablet (Mobile First), funktioniert aber auch am Computer
- **Sprache:** Deutsch
- **Kochen:** nur abends, ein Gericht pro Tag, jedes Rezept ist für **2 Personen**

---

## 1. Rezepte

### Felder

| Feld | Beschreibung |
|---|---|
| Bild | Foto mit der Kamera aufnehmen oder aus der Mediathek wählen. Wird beim Speichern automatisch verkleinert. |
| Titel | Pflichtfeld |
| Zutaten | Liste aus Menge, Einheit und Zutat. Neue Zeilen über **+**, Zeilen lassen sich wieder entfernen. |
| Zubereitung | Formatierbarer Text: fett, kursiv, unterstrichen, Aufzählung, nummerierte Liste |
| Dauer | Gesamtzeit in Minuten |
| Kategorien | Mehrfachauswahl |
| Favorit | Ja/Nein ⭐ |

### Einheiten

g · kg · ml · l · EL · TL · Stück · Prise · Packung · Dose · nach Geschmack (ohne Menge)

### Zutaten-Vorschläge

Beim Eintippen einer Zutat schlägt die App bereits verwendete Zutaten vor (z. B. „Zwi…“ → „Zwiebeln“). So heißen Zutaten überall gleich, was für den Zutatenfilter und das Zusammenrechnen in der Einkaufsliste wichtig ist.

### Ansehen und Bearbeiten

- Ein Klick auf ein Rezept öffnet den **Ansichtsmodus**.
- Über den **✏️-Knopf** wechselt man in den **Bearbeitungsmodus**.
- Im Bearbeitungsmodus: Speichern, als Favorit markieren, **Löschen** (mit Sicherheitsabfrage).
- Wird ein Rezept gelöscht, verschwindet es auch aus dem Kalender.

### Kachel

Bild, Titel, Dauer, Kategorien, Favoriten-Stern

### Rezeptübersicht

- Alle Rezepte als Kacheln
- **Suche** nach Titel
- **Filter** nach Kategorien, Zutaten und Favoriten (kombinierbar)
- Knopf zum Anlegen eines neuen Rezepts

---

## 2. Kategorien

- Eine **einfache Liste** ohne Gruppen, alphabetisch sortiert
- Im Bereich **Kategorien verwalten** lassen sie sich hinzufügen, umbenennen und löschen.
- Beim Löschen wird die Kategorie aus allen Rezepten entfernt, die Rezepte selbst bleiben erhalten (mit Sicherheitsabfrage).

**Startliste:**
Asiatisch · Bowl · Deutsch · Dessert / Süßes · Fisch · Fleisch · Für Gäste · Indisch · Italienisch · Low Carb · Meal Prep · Mediterran · Mexikanisch · Ofengericht / Auflauf · Orientalisch · Pasta · Pfannengericht · Salat · Schnell (unter 30 Min.) · Suppe & Eintopf · Vegan · Vegetarisch

---

## 3. Kalender (Startansicht)

- Umschaltbar zwischen **Woche** und **Monat**
- Die Woche geht von **Montag bis Sonntag**
- Navigation: **‹ ›** für vor und zurück, Knopf **„Heute“**
- Ein Gericht pro Tag

### Gericht einplanen

- Ein leerer Tag zeigt ein **+**.
- Ein Klick auf **+** öffnet ein Overlay mit allen Rezepten, inklusive Suche und Filter wie in der Rezeptübersicht.
- Mit der Auswahl eines Rezepts wird es für diesen Tag eingeplant.

### Darstellung

- **Wochenansicht:** Kachel mit Bild, Titel, Dauer, Kategorien und Favoriten-Stern
- **Monatsansicht:** nur der Titel

### Verschieben und Entfernen

- Geplante Gerichte lassen sich per **Drag & Drop** auf einen anderen Tag verschieben.
  - Am Computer mit der Maus
  - Am Handy/Tablet durch **langes Drücken und Ziehen**, damit normales Scrollen nichts verschiebt
- Landen dadurch zwei Gerichte auf einem Tag, ist das erlaubt. Sie werden untereinander angezeigt und lassen sich von Hand korrigieren.
- Beim Ziehen erscheint unten ein **Papierkorb** 🗑️. Wer das Gericht dort ablegt, entfernt es aus dem Kalender. Das Rezept selbst bleibt erhalten.
- Ein Klick auf ein geplantes Gericht öffnet das Rezept im Ansichtsmodus.

---

## 4. Einkaufsliste

- Knopf **„Einkaufsliste kopieren“** in der Wochenansicht
- Enthält alle Zutaten der **angezeigten Woche** (Mo–So)
- Gleiche Zutaten werden **addiert**:
  - g ↔ kg und ml ↔ l werden umgerechnet (800 g + 400 g = 1,2 kg)
  - Andere Einheiten werden nur bei gleicher Einheit addiert
  - „nach Geschmack“ erscheint ohne Menge
- **Alphabetisch** sortiert
- Vor dem Kopieren gibt es eine kurze **Vorschau**.
- Die Liste wird als Text **in die Zwischenablage** kopiert, damit man sie in Notizen einfügen kann.

**Format:**

```
Einkaufsliste 20.–26.10.

• 1,2 kg Kartoffeln
• 200 ml Sahne
• 500 g Tomaten
• 3 Stück Zwiebeln
• Salz (nach Geschmack)
```

---

## 5. Technik (Version 1)

- Reines **HTML, CSS und JavaScript**, ohne Framework und ohne Build-Schritt
- Daten werden **im Browser** gespeichert (IndexedDB, damit auch Bilder Platz haben)
- Veröffentlichung über **GitHub Pages**
- Lässt sich auf dem Handy zum Homescreen hinzufügen

---

## 6. Ausbaustufen (später)

1. **Gemeinsame Daten:** Online-Datenbank mit Login (z. B. Supabase), damit beide auf ihren eigenen Geräten dieselben Rezepte und Pläne sehen
2. **Vorräte:** Zutaten, die man schon zu Hause hat, von der Einkaufsliste streichen

Bis zur Ausbaustufe 1 sind die Daten nur auf dem Gerät gespeichert, auf dem sie eingegeben wurden.
