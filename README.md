# Balance

Mobile-first Ernährungs-Tracker als installierbare Web-App. Das Profil und das Tagesprotokoll sind lokal im Browser gespeichert. Für eine echte Claude-Auswertung läuft ein kleiner Node.js-Server als sicherer Proxy; der Anthropic-Schlüssel gehört ausschließlich in die Server-Umgebungsvariable `ANTHROPIC_API_KEY`.

## GitHub Pages bereitstellen

Im Repository unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** auswählen. Der Workflow in `.github/workflows/pages.yml` veröffentlicht die App nach jedem Push auf `main`. Danach ist sie unter `https://it-money97.github.io/Projekt-Abnehmen/` erreichbar. Am Handy den Link in Safari/Chrome öffnen und über das Browser-Menü **Zum Home-Bildschirm** / **Installieren** wählen.

GitHub Pages ist statisches Hosting: Tagebuch und Profil werden weiterhin nur lokal im Browser auf dem jeweiligen Gerät gespeichert. Claude-API und Konten-/Gerätesynchronisierung laufen dort nicht. Für geräteübergreifende Synchronisierung wäre ein Datenbank-/Auth-Backend nötig; Supabase ist für den ersten Einsatz nicht erforderlich.

## Lokal starten

Voraussetzung: Node.js 18 oder neuer.

```powershell
node server.js
```

Dann `http://localhost:3000` im Browser öffnen. Ohne API-Schlüssel funktionieren die lokale Erkennung der eingebauten Beispiel-Lebensmittel, das Tagesprotokoll und die Nährwert-Schätzungen. Die Spracherkennung benötigt Browser-Unterstützung und meist eine sichere Verbindung (HTTPS oder localhost).

## Claude konfigurieren

PowerShell:

```powershell
$env:ANTHROPIC_API_KEY = "dein-serverseitiger-api-schlüssel"
node server.js
```

Optional kann `ANTHROPIC_MODEL` auf ein von deinem Anthropic-Konto unterstütztes Claude-Modell gesetzt werden. Den API-Schlüssel niemals in `app.js` oder anderen Dateien im Browser ablegen. Beim Hosting muss HTTPS verwendet werden; für öffentliche Nutzung sollte zusätzlich ein Rate-Limit und eine Missbrauchsbegrenzung vor den KI-Endpunkt geschaltet werden.

## Hinweise

- Kalorien und Nährwerte sind grobe Schätzungen, keine verifizierte Produktdatenbank. Marken, Abtropfgewicht und Portionsgrößen können abweichen.
- Aktuelles Startprofil: männlich, 29 Jahre, 177 cm, 107 kg, überwiegend sitzend. Tagesziel und Makroziele sind Orientierung und keine ärztliche Verordnung.
- Der Wunsch, 6 kg in 3 Wochen abzunehmen, ist ambitioniert und sollte nicht mit einer Crash-Diät verfolgt werden. Die App empfiehlt einen moderateren Richtwert; individuelle Ziele bitte medizinisch abklären.
- Es gibt in dieser Version noch keine Anmeldung, Cloud-Synchronisierung, Barcode-Suche oder qualitätsgesicherte Lebensmitteldatenbank.
