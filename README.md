# Balance

Mobile-first Ernährungs-Tracker als installierbare Web-App. Das Profil und das Tagesprotokoll sind lokal im Browser gespeichert. Der optionale KI-Planimpuls läuft über einen kleinen Node.js-Server als sicherer Proxy; der Anthropic-Schlüssel gehört ausschließlich in die Server-Umgebungsvariable `ANTHROPIC_API_KEY`.

## GitHub Pages bereitstellen

Im Repository unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** auswählen. Der Workflow in `.github/workflows/pages.yml` veröffentlicht die App nach jedem Push auf `main`. Danach ist sie unter `https://it-money97.github.io/Projekt-Abnehmen/` erreichbar. Am iPhone den Link in Safari öffnen, **Teilen → Zum Home-Bildschirm** wählen und Balance von dort starten. Im installierten Modus nutzt die Oberfläche den Bildschirm samt iPhone-Safe-Areas und einer nativen Tab-Leiste.

GitHub Pages ist statisches Hosting: Tagebuch und Profil werden weiterhin nur lokal im Browser auf dem jeweiligen Gerät gespeichert. Häufige Lebensmittel und einige Markenprodukte erkennt die App mit lokalen Nährwert-Richtwerten, auch ohne Internet. Weitere Markenprodukte lassen sich ohne API-Schlüssel in der öffentlichen Open-Food-Facts-Datenbank suchen. Nur der optionale Claude-Planimpuls benötigt einen Anthropic-Schlüssel. Anthropic bietet keinen allgemein kostenlosen Claude-API-Schlüssel; für die Lebensmittelsuche ist Claude nicht nötig. Konten-/Gerätesynchronisierung gibt es nicht; dafür wäre ein Datenbank-/Auth-Backend nötig.

Die App erlaubt Profil- und Tageszieländerungen, Gewichtseinträge sowie das Bearbeiten/Löschen einzelner Lebensmittel über mobile Dialogfenster. Der 21-Tage-Fokusplan enthält Wochenabschnitte, tägliche abhakbare Gewohnheiten und einen alltagstauglichen Mahlzeiten-Baukasten. Er verspricht keine bestimmte Abnahme und empfiehlt weder extremes Einschränken noch Wasserentzug. Diese Daten bleiben lokal auf dem jeweiligen Gerät.

## Lokal starten

Voraussetzung: Node.js 18 oder neuer.

```powershell
node server.js
```

Dann `http://localhost:3000` im Browser öffnen. Lokale Erkennung, Online-Suche bei Open Food Facts, manuelle Nährwerterfassung und Tagebuch funktionieren ohne API-Schlüssel oder Supabase. Kartoffeln und Oreo haben lokale Richtwerte; weitere Produkte sucht die App über die kostenlose, gemeinschaftlich gepflegte Produktdatenbank (API v2). Die Lebensmittelsuche ruft keine KI auf und verbraucht keine Claude-Tokens. Der Node.js-Server hält erfolgreiche Suchantworten zehn Minuten im Arbeitsspeicher, damit wiederholte Suchbegriffe keine erneute Anfrage an Open Food Facts auslösen. Mehrere Zutaten lassen sich als Satz eingeben oder diktieren. Bei unbekannten Gerichten sucht die App die einzelnen Satzteile parallel; du prüfst pro Teil den passenden Treffer und die Portionsmenge, bevor die Auswahl eingetragen wird. GitHub Pages kann keinen Node-Proxy ausführen und versucht deshalb die öffentliche Suche direkt; falls der Browserzugriff dort durch CORS blockiert wird, muss der Node.js-Server auf einem eigenen Hosting erreichbar sein. Die Suche benötigt Internet und unterliegt den Nutzungsbedingungen sowie Rate-Limits von Open Food Facts. Die Spracherkennung verwendet in unterstützten Browsern bevorzugt das lokale deutsche Sprachpaket, wenn es verfügbar oder herunterladbar ist; andernfalls hängt sie vom Sprachdienst des Browsers ab. Mikrofonzugriff setzt Browser-Unterstützung, eine Berechtigung und eine sichere Verbindung (HTTPS oder localhost) voraus. Falls der Browser-Sprachdienst nicht erreichbar ist, kannst du unter Windows das Eingabefeld fokussieren und `Win+H` für die Windows-Sprachdiktierung drücken; am Handy kannst du das Diktier-Mikrofon der Tastatur verwenden. Der optionale Claude-Planimpuls benötigt einen Server-Schlüssel.

## Claude konfigurieren

Der optionale Claude-Planimpuls kann mit einem serverseitigen Anthropic-Schlüssel aktiviert werden. Für die Lebensmittelerkennung ist der Schlüssel nicht erforderlich.

```powershell
$env:ANTHROPIC_API_KEY = "dein-serverseitiger-api-schlüssel"
node server.js
```

Optional kann `ANTHROPIC_MODEL` auf ein von deinem Anthropic-Konto unterstütztes Claude-Modell gesetzt werden. Den API-Schlüssel niemals in `app.js` oder anderen Dateien im Browser ablegen. Beim Hosting muss HTTPS verwendet werden; für öffentliche Nutzung sollte zusätzlich ein Rate-Limit und eine Missbrauchsbegrenzung vor den KI-Endpunkt geschaltet werden.

## Hinweise

- Kalorien und Nährwerte sind Schätzungen. Open Food Facts enthält Millionen von Produktangaben, ist aber gemeinschaftlich gepflegt und keine qualitätsgesicherte Nährwertdatenbank. Marken, Abtropfgewicht und Portionsgrößen können abweichen; nicht jedes hausgemachte Gericht ist enthalten.
- Online-Nährwerte stammen aus der gemeinschaftlich gepflegten [Open-Food-Facts-Datenbank](https://world.openfoodfacts.org/). Die Daten können unvollständig oder falsch sein; Treffer und Portionsgrößen bitte prüfen. Für hausgemachte Gerichte können stattdessen Nährwerte manuell eingetragen werden.
- Aktuelles Startprofil: männlich, 29 Jahre, 177 cm, 107 kg, überwiegend sitzend. Tagesziel und Makroziele sind Orientierung und keine ärztliche Verordnung.
- Der Wunsch, 6 kg in 3 Wochen abzunehmen, ist ambitioniert und sollte nicht mit einer Crash-Diät verfolgt werden. Die App empfiehlt einen moderateren Richtwert; individuelle Ziele bitte medizinisch abklären.
- Es gibt in dieser Version noch keine Anmeldung, Cloud-Synchronisierung, Barcode-Suche oder qualitätsgesicherte Lebensmitteldatenbank.
