# 📅 Google Calendar zu Google Tasks Synchronisation

Synchronisieren Sie automatisch alle Termine des heutigen Tages aus Ihrem Google Calendar zu Google Tasks - **komplett kostenlos gehostet auf Vercel**!

## ✨ Features

- ✅ Automatische tägliche Synchronisation (jeden Morgen um 5:00 Uhr)
- ✅ Verhindert Duplikate - erstellt keine doppelten Tasks
- ✅ Unterstützt ganztägige und terminierte Events
- ✅ Fügt alle wichtigen Informationen hinzu (Zeit, Ort, Beschreibung)
- ✅ **100% kostenlos** auf Vercel gehostet
- ✅ Kein Server nötig - läuft als Serverless Function
- ✅ Einfaches Setup in unter 10 Minuten

## 🚀 Schnellstart - In 3 Schritten zu Ihrem automatischen Sync!

### Übersicht

1. **Google Credentials einrichten** (5 Minuten)
2. **Auf Vercel deployen** (2 Minuten)
3. **Fertig!** 🎉 Läuft ab jetzt täglich automatisch

---

## 📋 Schritt 1: Google Credentials einrichten

### 1.1 Google Cloud Projekt erstellen

1. Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com/)
2. Klicken Sie oben links auf "Projekt auswählen" → "Neues Projekt"
3. Name: `Calendar Tasks Sync` (oder beliebig)
4. Klicken Sie auf "Erstellen"

### 1.2 APIs aktivieren

1. Stellen Sie sicher, dass Ihr neues Projekt ausgewählt ist
2. Gehen Sie zu "APIs & Dienste" → "Bibliothek" (im linken Menü)
3. Suchen Sie nach "Google Calendar API" → Klicken Sie darauf → "Aktivieren"
4. Zurück zur Bibliothek → Suchen Sie "Google Tasks API" → "Aktivieren"

### 1.3 OAuth Credentials erstellen

1. Gehen Sie zu "APIs & Dienste" → "Anmeldedaten"
2. Klicken Sie oben auf "+ ANMELDEDATEN ERSTELLEN" → "OAuth-Client-ID"
3. Falls der Zustimmungsbildschirm noch nicht konfiguriert ist:
   - Klicken Sie auf "Zustimmungsbildschirm konfigurieren"
   - Wählen Sie "Extern" → "Erstellen"
   - App-Name: `Calendar Tasks Sync`
   - Nutzer-Support-E-Mail: Ihre E-Mail
   - Developer-E-Mail: Ihre E-Mail
   - Klicken Sie auf "Speichern und fortfahren" (alle anderen Schritte überspringen)
4. Zurück zu "Anmeldedaten" → "+ ANMELDEDATEN ERSTELLEN" → "OAuth-Client-ID"
5. Anwendungstyp: **Desktop-App**
6. Name: `Calendar Sync Client`
7. Klicken Sie auf "Erstellen"
8. **Wichtig:** Kopieren Sie jetzt:
   - ✅ **Client-ID** (sieht aus wie: `xxx.apps.googleusercontent.com`)
   - ✅ **Client-Secret** (zufällige Zeichenfolge)

### 1.4 Refresh Token generieren

**Option A: OAuth2 Playground (Einfacher)**

1. Gehen Sie zu [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Klicken Sie oben rechts auf das **Zahnrad-Symbol** ⚙️
3. Aktivieren Sie ✅ "Use your own OAuth credentials"
4. Tragen Sie ein:
   - OAuth Client ID: `Ihre Client-ID von oben`
   - OAuth Client secret: `Ihr Client-Secret von oben`
5. Schließen Sie das Einstellungs-Popup
6. Auf der linken Seite unter "Step 1":
   - Scrollen Sie zu "Google Calendar API v3"
   - ✅ Aktivieren Sie `https://www.googleapis.com/auth/calendar.readonly`
   - Scrollen Sie zu "Tasks API v1"
   - ✅ Aktivieren Sie `https://www.googleapis.com/auth/tasks`
7. Klicken Sie auf den blauen Button **"Authorize APIs"**
8. Wählen Sie Ihr Google-Konto aus
9. Klicken Sie auf "Erweitert" → "Zu Calendar Tasks Sync (unsicher) wechseln"
10. Klicken Sie auf "Weiter" und erteilen Sie die Berechtigungen
11. Sie werden zurück zum Playground geleitet
12. Klicken Sie auf **"Exchange authorization code for tokens"**
13. **Wichtig:** Kopieren Sie den **Refresh token** (lange Zeichenfolge)

### 1.5 Tasks Liste ID finden

**Einfachste Methode:**

1. Gehen Sie zu [Google Tasks API Explorer](https://developers.google.com/tasks/reference/rest/v1/tasklists/list)
2. Klicken Sie rechts auf den blauen Button **"Try this method"**
3. Falls gefragt, loggen Sie sich mit Ihrem Google-Konto ein
4. Klicken Sie auf **"EXECUTE"**
5. Im Response sehen Sie Ihre Aufgabenlisten:
   ```json
   {
     "items": [
       {
         "id": "MTU2NzgyMzQ1Njc4OTAxMjM0NTY6MDow",  ← Das ist Ihre Tasks List ID
         "title": "Meine Aufgaben"
       }
     ]
   }
   ```
6. **Wichtig:** Kopieren Sie die **ID** Ihrer gewünschten Liste

### 1.6 Kalender ID (optional)

Standardmäßig wird Ihr Hauptkalender (`primary`) verwendet.

Wenn Sie einen anderen Kalender verwenden möchten:
1. Öffnen Sie [Google Calendar](https://calendar.google.com/)
2. Klicken Sie links auf die drei Punkte neben Ihrem Kalender → "Einstellungen und Freigabe"
3. Scrollen Sie zu "Kalender-ID" → Kopieren Sie die ID (z.B. `abc123@group.calendar.google.com`)

---

## 🚀 Schritt 2: Auf Vercel deployen

### 2.1 Repository auf GitHub hochladen

**Falls noch nicht geschehen:**

1. Gehen Sie zu [GitHub](https://github.com/) und loggen Sie sich ein
2. Klicken Sie auf das **+** Symbol oben rechts → "New repository"
3. Repository-Name: `calendar-tasks-sync` (oder beliebig)
4. Wählen Sie "Public" oder "Private"
5. Klicken Sie auf "Create repository"
6. Folgen Sie den Anweisungen, um Ihren Code hochzuladen

**Oder klonen Sie direkt dieses Repository:**

```bash
git clone https://github.com/IHR_USERNAME/GK-KT.git
cd GK-KT
```

### 2.2 Auf Vercel deployen (kostenlos!)

1. Gehen Sie zu [vercel.com](https://vercel.com/)
2. Klicken Sie auf **"Sign Up"** (oder "Log in" falls Sie schon einen Account haben)
3. Wählen Sie **"Continue with GitHub"**
4. Autorisieren Sie Vercel

**Neues Projekt erstellen:**

1. Klicken Sie auf **"Add New..."** → **"Project"**
2. Wählen Sie Ihr Repository aus (z.B. `GK-KT` oder `calendar-tasks-sync`)
3. Falls das Repository nicht angezeigt wird:
   - Klicken Sie auf "Adjust GitHub App Permissions"
   - Geben Sie Zugriff auf das Repository
4. Klicken Sie auf **"Import"**
5. **Build Settings:** (normalerweise automatisch erkannt)
   - Framework Preset: `Other`
   - Build Command: `npm install`
   - Output Directory: (leer lassen)
6. Klicken Sie auf **"Deploy"**

### 2.3 Environment Variables hinzufügen

**Wichtig:** Fügen Sie jetzt Ihre Google Credentials hinzu!

1. Während oder nach dem ersten Deployment:
   - Gehen Sie zu Ihrem Projekt-Dashboard auf Vercel
   - Klicken Sie oben auf **"Settings"**
   - Links im Menü: **"Environment Variables"**

2. Fügen Sie folgende Variablen hinzu (klicken Sie jedes Mal auf "Add" nach Eingabe):

| Variable Name | Wert | Beispiel |
|---------------|------|----------|
| `GOOGLE_CLIENT_ID` | Ihre Client-ID | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Ihr Client-Secret | `GOCSPX-xxxxxxxxxxxx` |
| `GOOGLE_REFRESH_TOKEN` | Ihr Refresh Token | `1//0gxxxxxxxxxxxxxxxxxx` |
| `TASKS_LIST_ID` | Ihre Tasks Liste ID | `MTU2NzgyMzQ1Njc4OTAxMjM0NTY6MDow` |
| `CALENDAR_ID` | `primary` (oder Ihre Kalender-ID) | `primary` |

3. Klicken Sie nach jeder Variable auf **"Save"**

### 2.4 Neu deployen

1. Gehen Sie zurück zur **"Deployments"**-Seite
2. Klicken Sie oben rechts auf die drei Punkte **"..."** → **"Redeploy"**
3. Bestätigen Sie mit **"Redeploy"**

**Fertig! 🎉** Ihr Sync läuft jetzt täglich automatisch um 5:00 UTC (6:00 MEZ / 7:00 MESZ)!

---

## ✅ Schritt 3: Testen und Verifizieren

### Manuell testen

Ihre Vercel Function ist jetzt unter folgender URL erreichbar:

```
https://ihr-projekt-name.vercel.app/api/sync
```

**Test im Browser:**
1. Öffnen Sie die URL in Ihrem Browser
2. Sie sollten eine JSON-Response sehen mit dem Ergebnis

**Test mit curl:**
```bash
curl https://ihr-projekt-name.vercel.app/api/sync
```

**Erwartete Response:**
```json
{
  "success": true,
  "message": "Synchronisation erfolgreich",
  "result": {
    "eventsFound": 3,
    "tasksCreated": 2,
    "tasksSkipped": 1
  }
}
```

### Logs ansehen

1. Gehen Sie zu Ihrem Vercel Dashboard
2. Klicken Sie auf Ihr Projekt
3. Gehen Sie zu **"Functions"** (oben im Menü)
4. Klicken Sie auf `api/sync.js`
5. Hier sehen Sie alle Ausführungen und Logs

### Automatische Ausführung

Die `vercel.json` konfiguriert einen Cron Job:

```json
{
  "crons": [{
    "path": "/api/sync",
    "schedule": "0 5 * * *"
  }]
}
```

**Bedeutet:** Täglich um 5:00 UTC (= 6:00 MEZ Winter / 7:00 MESZ Sommer)

**Andere Zeiten:**
- `0 6 * * *` = 6:00 UTC (7:00/8:00 Lokalzeit)
- `0 8 * * *` = 8:00 UTC (9:00/10:00 Lokalzeit)
- `0 9 * * *` = 9:00 UTC (10:00/11:00 Lokalzeit)

Ändern Sie die `vercel.json` und pushen Sie den Code, um die Zeit anzupassen.

---

## 🔧 Verwendung

### Automatisch (empfohlen)

Sobald auf Vercel deployed, läuft der Sync **vollautomatisch** jeden Tag!

Sie müssen **nichts mehr tun**. Jeden Morgen werden automatisch alle Events des Tages als Tasks erstellt.

### Manuell (optional)

Wenn Sie den Sync manuell ausführen möchten:

**Option 1: Über den Browser**
```
https://ihr-projekt-name.vercel.app/api/sync
```

**Option 2: Lokal auf Ihrem Computer**

```bash
# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env

# .env mit Ihren Credentials bearbeiten
# Dann:
npm start
```

---

## 💰 Kosten

### Vercel Free Tier (Hobby Plan)

**Alles kostenlos:**
- ✅ 100 GB Bandwidth/Monat
- ✅ 100 GB-Stunden Serverless Function Execution/Monat
- ✅ Unbegrenzte Deployments
- ✅ Automatische HTTPS
- ✅ **Cron Jobs inklusive!**

**Für dieses Projekt:**
- 1 Ausführung pro Tag = ~30 Ausführungen/Monat
- Jede Ausführung dauert ca. 2-5 Sekunden
- **Gesamtkosten: 0,00 € (kostenlos!)**

Der Free Tier ist **mehr als ausreichend** für diesen Use Case!

---

## 🎯 Was macht das Script?

1. **Jeden Morgen um 5:00 Uhr:**
   - Ruft alle Events des heutigen Tages aus Ihrem Google Calendar ab
   - Prüft, ob bereits Tasks für diese Events existieren
   - Erstellt neue Tasks in Google Tasks für jedes Event (falls noch nicht vorhanden)

2. **Jeder Task enthält:**
   - **Titel:** Name des Events
   - **Beschreibung:** Details, Startzeit, Endzeit, Ort
   - **Fälligkeit:** Startzeit des Termins
   - **Eindeutige Signatur:** Verhindert Duplikate

3. **Beispiel:**
   ```
   Calendar Event: "Team Meeting um 10:00"
   → Google Tasks:
      Titel: "Team Meeting"
      Fälligkeit: Heute 10:00
      Notizen: Details mit Startzeit, Endzeit, Ort, Link
   ```

---

## 🛠️ Anpassungen

### Zeit ändern

Bearbeiten Sie `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/sync",
    "schedule": "0 5 * * *"  ← Aktuelle Zeit (5:00 UTC)
  }]
}
```

**Cron Syntax:**
```
┌─── Minute (0-59)
│ ┌─── Stunde (0-23)
│ │ ┌─── Tag im Monat (1-31)
│ │ │ ┌─── Monat (1-12)
│ │ │ │ ┌─── Wochentag (0-7, 0 und 7 = Sonntag)
│ │ │ │ │
0 5 * * *  = Täglich um 5:00 UTC
```

**Beispiele:**
- `0 6 * * *` - Täglich um 6:00 UTC
- `0 7 * * *` - Täglich um 7:00 UTC
- `0 8 * * 1-5` - Werktags um 8:00 UTC
- `0 9 * * 1,3,5` - Montag, Mittwoch, Freitag um 9:00 UTC

Nach Änderung pushen Sie den Code zu GitHub, Vercel deployed automatisch!

### Anderen Kalender verwenden

Ändern Sie in den Vercel Environment Variables:
- `CALENDAR_ID` von `primary` auf Ihre Kalender-ID

### Code anpassen

1. Code lokal bearbeiten
2. Zu GitHub pushen:
   ```bash
   git add .
   git commit -m "Update sync logic"
   git push
   ```
3. Vercel erkennt automatisch den Push und deployed die neue Version!

---

## 🐛 Troubleshooting

### "Missing environment variables"

**Problem:** Environment Variables fehlen oder sind falsch.

**Lösung:**
1. Vercel Dashboard → Ihr Projekt → Settings → Environment Variables
2. Prüfen Sie alle 5 Variablen:
   - ✅ GOOGLE_CLIENT_ID
   - ✅ GOOGLE_CLIENT_SECRET
   - ✅ GOOGLE_REFRESH_TOKEN
   - ✅ CALENDAR_ID
   - ✅ TASKS_LIST_ID
3. Neu deployen: Deployments → ... → Redeploy

### "Invalid credentials"

**Problem:** Client ID, Secret oder Refresh Token falsch.

**Lösung:**
1. Generieren Sie einen neuen Refresh Token (siehe Schritt 1.4)
2. Prüfen Sie Client ID und Secret in Google Cloud Console
3. Aktualisieren Sie die Environment Variables auf Vercel
4. Neu deployen

### "Tasks list not found"

**Problem:** Tasks Liste ID falsch oder Liste wurde gelöscht.

**Lösung:**
1. Neue Tasks Liste ID holen (siehe Schritt 1.5)
2. TASKS_LIST_ID auf Vercel aktualisieren
3. Neu deployen

### "Calendar not found"

**Problem:** Kalender-ID falsch oder kein Zugriff.

**Lösung:**
- Verwenden Sie `primary` für Ihren Hauptkalender
- Oder prüfen Sie die Kalender-ID in Google Calendar (Schritt 1.6)

### Function läuft nicht automatisch

**Problem:** Cron Job scheint nicht zu laufen.

**Lösung:**
1. Prüfen Sie die `vercel.json` - ist die cron-Konfiguration vorhanden?
2. Warten Sie bis zur konfigurierten Zeit
3. Prüfen Sie Logs: Vercel Dashboard → Functions → api/sync.js
4. Testen Sie manuell: `https://ihr-projekt.vercel.app/api/sync`

### Keine Events gefunden

**Problem:** "0 Events gefunden"

**Mögliche Ursachen:**
- Heute sind keine Termine im Kalender
- Falscher Kalender (prüfen Sie CALENDAR_ID)
- Zeitzone: Script läuft in UTC

### API Rate Limit

**Problem:** "Rate limit exceeded"

**Lösung:**
- Das Script hat bereits eine 500ms Pause zwischen API-Aufrufen
- Bei sehr vielen Events: Erhöhen Sie den Timeout in `api/sync.js`:
  ```javascript
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 Sekunde
  ```

---

## 🌐 Alternative Hosting-Optionen

Obwohl Vercel die empfohlene und einfachste Option ist, können Sie das Projekt auch auf anderen Plattformen hosten:

### Render (Native Cron Jobs)

```bash
# render.yaml ist bereits konfiguriert
# Einfach auf render.com deployen
```

**Setup:**
1. [render.com](https://render.com/) → Sign up
2. New → Cron Job
3. Repository verbinden
4. Environment Variables setzen
5. Deploy!

### Netlify (mit GitHub Actions)

```bash
# netlify.toml und .github/workflows/daily-sync.yml sind vorhanden
```

**Setup:**
1. [netlify.com](https://netlify.com/) → Sign up
2. New site from Git
3. Repository verbinden
4. Environment Variables setzen
5. GitHub Secret hinzufügen: `NETLIFY_FUNCTION_URL`

### Railway ($5 Guthaben/Monat)

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Weitere Optionen

Siehe `DEPLOYMENT.md` für Anleitungen zu:
- Google Cloud Run (2M Requests/Monat kostenlos)
- AWS Lambda
- Cloudflare Workers
- Fly.io

---

## 📚 Projektstruktur

```
├── api/
│   └── sync.js              # Vercel Serverless Function (Haupt-Script)
├── netlify/
│   └── functions/
│       └── sync-calendar.js # Netlify Function (Alternative)
├── .github/
│   └── workflows/
│       └── daily-sync.yml   # GitHub Actions Workflow
├── sync-calendar-to-tasks.js # Standalone Node.js Script (lokal)
├── package.json             # Dependencies
├── vercel.json              # Vercel Config (Cron Jobs)
├── netlify.toml             # Netlify Config
├── render.yaml              # Render Config
├── .env.example             # Environment Variables Template
├── DEPLOYMENT.md            # Detaillierte Deployment-Guides
└── README.md                # Diese Datei
```

---

## 📊 Was passiert bei der Synchronisation?

**Beispiel-Output (in Vercel Logs sichtbar):**

```
═══════════════════════════════════════════════════════════════
   🌐 Vercel Function: Calendar → Tasks Sync
═══════════════════════════════════════════════════════════════

⏰ Ausgeführt am: 14.11.2025, 05:00:15

📅 Rufe Events für heute ab...
✅ 3 Event(s) gefunden

📋 5 bestehende Task(s) gefunden

📌 Verarbeite: "Team Meeting"
   ✅ Task erstellt: "Team Meeting"

📌 Verarbeite: "Arzttermin"
   ⏭️  Übersprungen (Task existiert bereits)

📌 Verarbeite: "Projekt Review"
   ✅ Task erstellt: "Projekt Review"

✨ Synchronisation abgeschlossen!

📊 Statistik:
   • Events gefunden: 3
   • Tasks erstellt: 2
   • Übersprungen: 1

✅ Function erfolgreich ausgeführt!
```

---

## 🔒 Sicherheit

- ✅ Alle Credentials werden nur als Environment Variables gespeichert
- ✅ Keine Credentials im Code
- ✅ `.gitignore` schützt lokale `.env` Dateien
- ✅ HTTPS by default auf Vercel
- ✅ OAuth2 mit Refresh Token (sicher und langlebig)

**Wichtig:**
- Committen Sie **niemals** Ihre `.env` Datei
- Teilen Sie **niemals** Ihre Tokens öffentlich
- Verwenden Sie Vercel Environment Variables für Credentials

---

## 🆘 Support & Hilfe

**Probleme?**
1. Prüfen Sie das [Troubleshooting](#-troubleshooting)
2. Schauen Sie in die Vercel Logs
3. Erstellen Sie ein Issue auf GitHub

**Fragen?**
- Öffnen Sie ein Issue im Repository
- Prüfen Sie die `DEPLOYMENT.md` für erweiterte Optionen

---

## 📝 Lizenz

MIT License - Nutzen Sie das Projekt frei für private und kommerzielle Zwecke!

---

## ❤️ Credits

Erstellt für die einfache Synchronisation von Google Calendar zu Google Tasks.

**Viel Erfolg mit Ihrem automatischen Calendar-Sync! 🎉**

Bei Fragen oder Problemen, öffnen Sie gerne ein Issue!
