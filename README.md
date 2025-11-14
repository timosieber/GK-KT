# Google Calendar zu Google Tasks Synchronisation

Dieses Node.js-Script synchronisiert automatisch alle Termine des heutigen Tages aus einem Google Calendar zu Google Tasks.

## 📋 Features

- ✅ Liest alle Events des aktuellen Tages aus Google Calendar
- ✅ Erstellt automatisch entsprechende Tasks in Google Tasks
- ✅ Verhindert Duplikate (prüft bestehende Tasks)
- ✅ Unterstützt ganztägige und terminierte Events
- ✅ Fügt detaillierte Informationen hinzu (Startzeit, Endzeit, Beschreibung, Ort)
- ✅ Bereit für Cron-Jobs / Scheduler

## 🚀 Setup

### 1. Repository klonen und Dependencies installieren

```bash
# Dependencies installieren
npm install
```

### 2. Google Cloud Console Setup

#### 2.1 Projekt erstellen und APIs aktivieren

1. Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes
3. Aktivieren Sie folgende APIs:
   - **Google Calendar API**
   - **Google Tasks API**

#### 2.2 OAuth 2.0 Credentials erstellen

1. Gehen Sie zu "APIs & Services" > "Credentials"
2. Klicken Sie auf "+ CREATE CREDENTIALS" > "OAuth client ID"
3. Wählen Sie als Application type: **Desktop app**
4. Geben Sie einen Namen ein (z.B. "Calendar-Tasks-Sync")
5. Klicken Sie auf "CREATE"
6. Laden Sie die JSON-Datei herunter und notieren Sie:
   - `client_id`
   - `client_secret`

### 3. Refresh Token generieren

#### Option A: OAuth2 Playground (Empfohlen)

1. Gehen Sie zu [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Klicken Sie oben rechts auf das Zahnrad (⚙️)
3. Aktivieren Sie "Use your own OAuth credentials"
4. Tragen Sie Ihre **Client ID** und **Client Secret** ein
5. Wählen Sie auf der linken Seite folgende Scopes:
   ```
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/tasks
   ```
6. Klicken Sie auf "Authorize APIs"
7. Loggen Sie sich mit Ihrem Google-Account ein und erteilen Sie die Berechtigungen
8. Klicken Sie auf "Exchange authorization code for tokens"
9. Kopieren Sie den **Refresh token**

#### Option B: Manuell mit Node.js

Erstellen Sie ein temporäres Script `get-token.js`:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'urn:ietf:wg:oauth:2.0:oob'
);

const scopes = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks'
];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Öffnen Sie diese URL:', url);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Code eingeben: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('Refresh Token:', tokens.refresh_token);
  rl.close();
});
```

Führen Sie es aus:
```bash
node get-token.js
```

### 4. Tasks Liste ID finden

#### Option A: Google Tasks API Explorer

1. Gehen Sie zu [Tasks API Explorer](https://developers.google.com/tasks/reference/rest/v1/tasklists/list)
2. Autorisieren Sie die API
3. Führen Sie die Request aus
4. Finden Sie die ID Ihrer gewünschten Liste im Response

#### Option B: Mit einem Script

Erstellen Sie `get-tasklist-id.js`:

```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'urn:ietf:wg:oauth:2.0:oob'
);

oauth2Client.setCredentials({
  refresh_token: 'YOUR_REFRESH_TOKEN'
});

const tasks = google.tasks({ version: 'v1', auth: oauth2Client });

tasks.tasklists.list({}, (err, res) => {
  if (err) return console.error(err);
  console.log('Verfügbare Task-Listen:');
  res.data.items.forEach(list => {
    console.log(`  - ${list.title}: ${list.id}`);
  });
});
```

Führen Sie es aus:
```bash
node get-tasklist-id.js
```

### 5. Konfigurationsdatei erstellen

Kopieren Sie die Beispiel-Datei und tragen Sie Ihre Werte ein:

```bash
cp .env.example .env
```

Bearbeiten Sie `.env` und tragen Sie ein:

```env
GOOGLE_CLIENT_ID=ihre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ihr_client_secret
GOOGLE_REFRESH_TOKEN=ihr_refresh_token
CALENDAR_ID=primary
TASKS_LIST_ID=ihre_tasks_list_id
```

**Wichtige Hinweise:**
- Für Ihren Hauptkalender verwenden Sie `CALENDAR_ID=primary`
- Für einen spezifischen Kalender finden Sie die ID in den Google Calendar Einstellungen

## 🎯 Verwendung

### Einmalig ausführen

```bash
npm start
```

oder

```bash
node sync-calendar-to-tasks.js
```

### Mit Cron-Job (automatisch jeden Morgen)

#### Linux/Mac

Bearbeiten Sie Ihre Crontab:

```bash
crontab -e
```

Fügen Sie folgende Zeile hinzu (führt täglich um 7:00 Uhr aus):

```cron
0 7 * * * cd /pfad/zum/projekt && /usr/bin/node sync-calendar-to-tasks.js >> /var/log/calendar-sync.log 2>&1
```

Für 8:00 Uhr morgens:

```cron
0 8 * * * cd /pfad/zum/projekt && /usr/bin/node sync-calendar-to-tasks.js >> /var/log/calendar-sync.log 2>&1
```

#### Windows (Task Scheduler)

1. Öffnen Sie den Task Scheduler
2. Erstellen Sie eine neue Aufgabe
3. Trigger: Täglich um 7:00 Uhr
4. Aktion: Programm starten
   - Programm: `C:\Program Files\nodejs\node.exe`
   - Argumente: `C:\Pfad\zum\projekt\sync-calendar-to-tasks.js`
   - Verzeichnis: `C:\Pfad\zum\projekt`

#### Node-Cron (Alternative)

Installieren Sie node-cron:

```bash
npm install node-cron
```

Erstellen Sie `scheduler.js`:

```javascript
const cron = require('node-cron');
const { syncCalendarToTasks, getOAuth2Client } = require('./sync-calendar-to-tasks');

// Täglich um 7:00 Uhr ausführen
cron.schedule('0 7 * * *', async () => {
  console.log('Starte geplante Synchronisation...');
  const auth = getOAuth2Client();
  await syncCalendarToTasks(auth);
});

console.log('Scheduler gestartet. Wartet auf geplante Ausführung...');
```

## ☁️ Auf Netlify hosten (Kostenlos)

Sie können dieses Script **kostenlos** auf Netlify hosten und als Serverless Function ausführen lassen. Das hat mehrere Vorteile:
- ✅ Kein eigener Server nötig
- ✅ Automatische Ausführung per Scheduled Function
- ✅ Kostenlos im Free Tier (mit Einschränkungen)
- ✅ Einfaches Deployment über GitHub

### Netlify Free vs. Pro

**Free Tier:**
- ✅ Netlify Functions sind verfügbar
- ❌ Scheduled Functions **nicht** verfügbar (nur in Pro/Business/Enterprise)
- ✅ Manuelle Ausführung per HTTP-Request möglich
- ✅ Kann mit externem Cron-Service kombiniert werden (siehe unten)

**Pro Tier ($19/Monat):**
- ✅ Scheduled Functions verfügbar
- ✅ Automatische tägliche Ausführung
- ✅ Längere Function-Laufzeit

### Setup auf Netlify (Free Tier)

#### 1. Repository auf GitHub pushen

```bash
# Falls noch nicht geschehen
git remote add origin https://github.com/IHR_USERNAME/IHR_REPO.git
git push -u origin main
```

#### 2. Netlify Account erstellen

1. Gehen Sie zu [netlify.com](https://www.netlify.com/)
2. Klicken Sie auf "Sign up"
3. Melden Sie sich mit GitHub an

#### 3. Neues Site auf Netlify erstellen

1. Klicken Sie auf "Add new site" > "Import an existing project"
2. Wählen Sie "GitHub" und autorisieren Sie Netlify
3. Wählen Sie Ihr Repository aus
4. **Build Settings:**
   - Build command: `npm install`
   - Publish directory: (leer lassen)
   - Functions directory: `netlify/functions`
5. Klicken Sie auf "Deploy site"

#### 4. Environment Variables konfigurieren

Gehen Sie zu: **Site settings** > **Environment variables** > **Add a variable**

Fügen Sie folgende Variablen hinzu:

```
GOOGLE_CLIENT_ID         → ihre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET     → ihr_client_secret
GOOGLE_REFRESH_TOKEN     → ihr_refresh_token
CALENDAR_ID              → primary
TASKS_LIST_ID            → ihre_tasks_list_id
```

**Wichtig:** Klicken Sie nach jeder Variable auf "Create variable"!

#### 5. Function testen (Manueller Trigger)

Nach dem Deployment finden Sie Ihre Function unter:

```
https://ihre-site-name.netlify.app/.netlify/functions/sync-calendar
```

Sie können die Function auch über den kürzeren Alias aufrufen:

```
https://ihre-site-name.netlify.app/sync
```

**Testen Sie die Function:**

```bash
curl https://ihre-site-name.netlify.app/sync
```

Oder öffnen Sie die URL einfach in Ihrem Browser.

#### 6. Logs ansehen

Um zu sehen, ob die Function erfolgreich läuft:

1. Gehen Sie zu Ihrem Netlify Dashboard
2. Klicken Sie auf Ihre Site
3. Gehen Sie zu "Functions"
4. Klicken Sie auf "sync-calendar"
5. Sehen Sie sich die Logs an

### Automatische Ausführung mit externem Cron (Free Tier)

Da Scheduled Functions im Free Tier nicht verfügbar sind, können Sie einen kostenlosen externen Cron-Service nutzen:

#### Option A: cron-job.org (Empfohlen)

1. Gehen Sie zu [cron-job.org](https://cron-job.org/)
2. Erstellen Sie einen kostenlosen Account
3. Klicken Sie auf "Create Cronjob"
4. **Konfiguration:**
   - Title: `Calendar to Tasks Sync`
   - URL: `https://ihre-site-name.netlify.app/sync`
   - Execution schedule: `Every day at 07:00`
   - Timezone: Wählen Sie Ihre Zeitzone (z.B. Europe/Berlin)
5. Klicken Sie auf "Create Cronjob"

**Fertig!** Der Cron-Job ruft jetzt täglich Ihre Netlify Function auf.

#### Option B: EasyCron

1. Gehen Sie zu [easycron.com](https://www.easycron.com/)
2. Erstellen Sie einen Free Account
3. Erstellen Sie einen neuen Cron Job:
   - URL: `https://ihre-site-name.netlify.app/sync`
   - Cron Expression: `0 7 * * *` (täglich um 7:00)
   - HTTP Method: GET
   - Timezone: Ihre Zeitzone

#### Option C: GitHub Actions (kostenlos)

Erstellen Sie `.github/workflows/daily-sync.yml` in Ihrem Repository:

```yaml
name: Daily Calendar Sync

on:
  schedule:
    # Täglich um 7:00 UTC (8:00 MEZ / 9:00 MESZ)
    - cron: '0 7 * * *'
  workflow_dispatch:  # Ermöglicht manuelles Triggern

jobs:
  trigger-sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Netlify Function
        run: |
          curl -X GET https://ihre-site-name.netlify.app/sync

      - name: Check if successful
        run: echo "Sync triggered successfully!"
```

Ändern Sie `ihre-site-name` zu Ihrem tatsächlichen Netlify Site-Namen.

**Hinweise zu GitHub Actions:**
- ⏱️ Cron-Jobs können bis zu 10 Minuten verspätet sein
- 🆓 Komplett kostenlos für öffentliche Repositories
- 🔒 Auch kostenlos für private Repos (2000 Minuten/Monat free)

### Automatische Ausführung mit Netlify Pro

Falls Sie Netlify Pro haben, ist die Konfiguration bereits in `netlify.toml` enthalten:

```toml
[[functions]]
  path = "/sync-calendar"
  schedule = "0 7 * * *"  # Täglich um 7:00 UTC
```

Die Function wird dann automatisch jeden Tag ausgeführt, ohne externe Services!

### Netlify Function Limits

**Free Tier:**
- 125.000 Function-Aufrufe pro Monat
- 100 Stunden Function-Laufzeit pro Monat
- Timeout: 10 Sekunden pro Aufruf

**Pro Tier:**
- 2 Millionen Function-Aufrufe pro Monat
- 100 Stunden Function-Laufzeit pro Monat
- Timeout: 26 Sekunden pro Aufruf

Für eine tägliche Synchronisation (1x pro Tag = 30x pro Monat) ist der Free Tier mehr als ausreichend!

### Deployment-Updates

Wenn Sie Änderungen am Code vornehmen:

1. Committen und pushen Sie die Änderungen zu GitHub:
   ```bash
   git add .
   git commit -m "Update sync script"
   git push
   ```

2. Netlify erkennt automatisch den Push und deployed die neue Version!

### Netlify CLI (Optional)

Für fortgeschrittene Benutzer können Sie auch das Netlify CLI verwenden:

```bash
# Netlify CLI installieren
npm install -g netlify-cli

# Anmelden
netlify login

# In Ihrem Projekt-Ordner
netlify init

# Function lokal testen
netlify dev

# Manuell deployen
netlify deploy --prod
```

### Vorteile von Netlify

✅ **Einfaches Setup** - In wenigen Minuten einsatzbereit
✅ **Automatische Deployments** - Bei jedem Git Push
✅ **Kostenlos** - Free Tier reicht für tägliche Syncs
✅ **Skalierbar** - Automatisches Scaling
✅ **Logs & Monitoring** - Eingebautes Logging
✅ **Sicher** - HTTPS by default

## 🌐 Weitere kostenlose Hosting-Optionen

Neben Netlify gibt es mehrere weitere **100% kostenlose** Plattformen für das Hosting von Node.js Serverless Functions mit Cron-Job-Unterstützung:

### Vergleichstabelle

| Plattform | Free Tier | Cron Support | Setup-Schwierigkeit | Empfehlung |
|-----------|-----------|--------------|---------------------|------------|
| **Netlify** | 125k Requests/Monat | ⚠️ Nur Pro ($19/mo) | ⭐ Einfach | ✅ Mit externem Cron |
| **Vercel** | 100 GB Bandwidth | ✅ Ja (Cron Jobs) | ⭐ Einfach | ✅✅ Empfohlen! |
| **Render** | 750 Stunden/Monat | ✅ Ja (Cron Jobs) | ⭐⭐ Mittel | ✅✅ Sehr gut! |
| **Railway** | $5 Guthaben/Monat | ✅ Ja | ⭐⭐ Mittel | ✅ Solide Option |
| **Cloudflare Workers** | 100k Requests/Tag | ✅ Ja (Cron Triggers) | ⭐⭐⭐ Komplex | ✅ Für Fortgeschrittene |
| **AWS Lambda** | 1M Requests/Monat | ✅ Ja (EventBridge) | ⭐⭐⭐⭐ Schwer | ⚠️ Komplex |
| **Google Cloud Run** | 2M Requests/Monat | ✅ Ja (Cloud Scheduler) | ⭐⭐⭐ Komplex | ✅ Großzügige Limits |
| **Deno Deploy** | 100k Requests/Tag | ✅ Ja | ⭐⭐ Mittel | ⚠️ Deno, nicht Node.js |
| **Fly.io** | 3 VMs kostenlos | ✅ Ja | ⭐⭐⭐ Komplex | ✅ Gute Alternative |

---

### 🥇 Option 1: Vercel (Empfohlen!)

**Warum Vercel?**
- ✅ Native Cron Jobs Support im Free Tier
- ✅ Einfachstes Setup
- ✅ 100 GB Bandwidth/Monat kostenlos
- ✅ Automatische Deployments von GitHub

#### Setup auf Vercel

**1. Vercel Function erstellen**

Erstellen Sie `api/sync.js`:

```javascript
const { google } = require('googleapis');

// Konfiguration aus Environment Variables
const CONFIG = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  CALENDAR_ID: process.env.CALENDAR_ID || 'primary',
  TASKS_LIST_ID: process.env.TASKS_LIST_ID,
};

// Ihre Sync-Logik hier (gleich wie in sync-calendar-to-tasks.js)
// ... (kompletter Code wie zuvor)

module.exports = async (req, res) => {
  try {
    const auth = getOAuth2Client();
    const result = await syncCalendarToTasks(auth);

    res.status(200).json({
      success: true,
      message: 'Sync erfolgreich',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

**2. `vercel.json` erstellen**

```json
{
  "crons": [{
    "path": "/api/sync",
    "schedule": "0 7 * * *"
  }]
}
```

**3. Deployen**

```bash
# Vercel CLI installieren
npm i -g vercel

# Anmelden
vercel login

# Deployen
vercel

# Environment Variables setzen
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REFRESH_TOKEN
vercel env add CALENDAR_ID
vercel env add TASKS_LIST_ID

# Production deployment
vercel --prod
```

**Fertig!** Die Function läuft nun täglich um 7:00 UTC automatisch.

---

### 🥈 Option 2: Render

**Warum Render?**
- ✅ Native Cron Jobs Support
- ✅ 750 kostenlose Stunden/Monat
- ✅ Einfaches Dashboard
- ✅ PostgreSQL-Datenbank inklusive (falls später benötigt)

#### Setup auf Render

**1. Render Account erstellen**
- Gehen Sie zu [render.com](https://render.com/)
- Sign up mit GitHub

**2. Neuen Cron Job erstellen**
1. Dashboard > "New" > "Cron Job"
2. Repository auswählen
3. **Konfiguration:**
   - Name: `calendar-tasks-sync`
   - Command: `node sync-calendar-to-tasks.js`
   - Schedule: `0 7 * * *` (täglich um 7:00 UTC)

**3. Environment Variables setzen**
Im Render Dashboard unter "Environment":
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
CALENDAR_ID=primary
TASKS_LIST_ID=...
```

**Fertig!** Render führt den Cron Job automatisch täglich aus.

---

### 🥉 Option 3: Railway

**Warum Railway?**
- ✅ $5 Guthaben/Monat kostenlos
- ✅ Sehr entwicklerfreundlich
- ✅ Unterstützt alle Node.js Features

#### Setup auf Railway

**1. Railway Account**
- Gehen Sie zu [railway.app](https://railway.app/)
- Sign up mit GitHub

**2. Neues Projekt**
```bash
# Railway CLI installieren
npm i -g @railway/cli

# Anmelden
railway login

# Projekt initialisieren
railway init

# Environment Variables setzen
railway variables set GOOGLE_CLIENT_ID="..."
railway variables set GOOGLE_CLIENT_SECRET="..."
railway variables set GOOGLE_REFRESH_TOKEN="..."
railway variables set CALENDAR_ID="primary"
railway variables set TASKS_LIST_ID="..."

# Deployen
railway up
```

**3. Cron Job einrichten**

Erstellen Sie `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "startCommand": "node scheduler.js"
  }
}
```

Verwenden Sie dann das `scheduler.js` Script mit node-cron aus der README.

---

### ⚡ Option 4: Cloudflare Workers

**Warum Cloudflare?**
- ✅ 100.000 Requests/Tag kostenlos
- ✅ Extrem schnell (Edge Computing)
- ✅ Native Cron Triggers

⚠️ **Hinweis:** Cloudflare Workers verwenden eine angepasste JavaScript-Runtime. `googleapis` muss durch Fetch-Requests ersetzt werden.

#### Setup auf Cloudflare

**1. Wrangler CLI installieren**

```bash
npm install -g wrangler

# Anmelden
wrangler login
```

**2. Worker erstellen**

```bash
wrangler init calendar-sync
cd calendar-sync
```

**3. `wrangler.toml` konfigurieren**

```toml
name = "calendar-sync"
main = "src/index.js"
compatibility_date = "2025-01-01"

[triggers]
crons = ["0 7 * * *"]

[vars]
CALENDAR_ID = "primary"
```

**4. Secrets setzen**

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_REFRESH_TOKEN
wrangler secret put TASKS_LIST_ID
```

**5. Deployen**

```bash
wrangler deploy
```

**Hinweis:** Der Code muss angepasst werden, da Cloudflare Workers keine Node.js-Module wie `googleapis` unterstützen. Sie müssen direkt mit der Google API über `fetch()` kommunizieren.

---

### 🔥 Option 5: Google Cloud Run + Cloud Scheduler

**Warum Google Cloud?**
- ✅ 2 Millionen Requests/Monat kostenlos
- ✅ Sehr großzügige Limits
- ✅ Professionelles Ökosystem

#### Setup auf Google Cloud

**1. Google Cloud Account**
- Gehen Sie zu [cloud.google.com](https://cloud.google.com/)
- Aktivieren Sie Cloud Run und Cloud Scheduler APIs

**2. Dockerfile erstellen**

```dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

CMD ["node", "sync-calendar-to-tasks.js"]
```

**3. Deployen**

```bash
# Google Cloud CLI installieren
# https://cloud.google.com/sdk/docs/install

# Anmelden
gcloud auth login

# Projekt erstellen
gcloud projects create mein-calendar-sync

# Cloud Run deployen
gcloud run deploy calendar-sync \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLIENT_ID="...",GOOGLE_CLIENT_SECRET="...",GOOGLE_REFRESH_TOKEN="...",CALENDAR_ID="primary",TASKS_LIST_ID="..."

# Cloud Scheduler Job erstellen
gcloud scheduler jobs create http calendar-daily-sync \
  --schedule="0 7 * * *" \
  --uri="https://calendar-sync-xxx.run.app" \
  --http-method=GET \
  --location=europe-west1
```

---

### 🦕 Option 6: Deno Deploy

**Warum Deno Deploy?**
- ✅ 100.000 Requests/Tag kostenlos
- ✅ Edge Computing (sehr schnell)
- ✅ Einfaches Deployment

⚠️ **Hinweis:** Verwendet Deno statt Node.js. Code muss angepasst werden.

#### Setup auf Deno Deploy

```bash
# Deno installieren
curl -fsSL https://deno.land/install.sh | sh

# Projekt deployen
deno deploy --project=calendar-sync sync.ts
```

**`deno.json` für Cron:**

```json
{
  "tasks": {
    "cron": "deno run --allow-net --allow-env sync.ts"
  },
  "cron": ["0 7 * * *"]
}
```

---

## 💡 Empfehlung: Was soll ich wählen?

### Für Anfänger:
**🥇 Vercel** - Einfachstes Setup, native Cron Jobs, perfekt für Einsteiger

### Für mehr Kontrolle:
**🥈 Render** - Sehr gutes Dashboard, einfache Verwaltung, native Cron Jobs

### Für maximale Free Tier Limits:
**🏆 Google Cloud Run** - 2 Millionen Requests/Monat, sehr großzügig

### Für schnellste Performance:
**⚡ Cloudflare Workers** - Edge Computing, aber komplexere Einrichtung

### Für vollständige Node.js-Kompatibilität:
**🚂 Railway** - Volle Node.js-Unterstützung, sehr entwicklerfreundlich

---

## 🆚 Netlify vs. Vercel vs. Render - Direkter Vergleich

| Feature | Netlify (Free) | Vercel (Free) | Render (Free) |
|---------|----------------|---------------|---------------|
| **Cron Jobs** | ❌ Nein (nur Pro) | ✅ Ja | ✅ Ja |
| **Requests/Monat** | 125.000 | Unbegrenzt* | Unbegrenzt* |
| **Bandwidth** | 100 GB | 100 GB | 100 GB |
| **Build Minutes** | 300 Min/Mo | Unbegrenzt | 500 Min/Mo |
| **GitHub Integration** | ✅ | ✅ | ✅ |
| **Custom Domains** | ✅ | ✅ | ✅ |
| **Environment Variables** | ✅ | ✅ | ✅ |
| **Logs & Monitoring** | ✅ | ✅ | ✅ |
| **Setup-Schwierigkeit** | ⭐ Einfach | ⭐ Einfach | ⭐⭐ Mittel |

*Begrenzt durch Ausführungszeit und Ressourcen

### 🎯 Finale Empfehlung

Für Ihr Google Calendar → Tasks Sync Projekt:

1. **Beste Wahl:** **Vercel** - Native Cron Jobs, einfachstes Setup
2. **Alternative:** **Render** - Ebenfalls native Cron Jobs, gutes Dashboard
3. **Mit Netlify:** Kombinieren Sie mit **GitHub Actions** (wie bereits konfiguriert)

Alle drei Optionen sind **100% kostenlos** und mehr als ausreichend für eine tägliche Synchronisation!

## 📊 Ausgabe

Das Script gibt detaillierte Informationen aus:

```
═══════════════════════════════════════════════════════════════
   Google Calendar → Google Tasks Synchronisation
═══════════════════════════════════════════════════════════════

📅 Rufe Events für heute ab...
   Zeitraum: 14.11.2025, 00:00 bis 14.11.2025, 23:59
✅ 3 Event(s) gefunden

📋 5 bestehende Task(s) gefunden
─────────────────────────────────────────────────────────────────

📌 Verarbeite: "Team Meeting"
   ✅ Task erstellt: "Team Meeting"

📌 Verarbeite: "Arzttermin"
   ⏭️  Übersprungen (Task existiert bereits)

📌 Verarbeite: "Projekt Review"
   ✅ Task erstellt: "Projekt Review"

─────────────────────────────────────────────────────────────────
✨ Synchronisation abgeschlossen!

📊 Statistik:
   • Events gefunden: 3
   • Tasks erstellt: 2
   • Übersprungen (bereits vorhanden): 1

✅ Fertig!
```

## 🔧 Anpassungen

### Konfiguration im Script ändern

Sie können die Werte auch direkt im Script anpassen, wenn Sie keine `.env` Datei verwenden möchten.

Öffnen Sie `sync-calendar-to-tasks.js` und ändern Sie die Werte in der `CONFIG` Konstante:

```javascript
const CONFIG = {
  GOOGLE_CLIENT_ID: 'ihre_client_id.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'ihr_client_secret',
  GOOGLE_REFRESH_TOKEN: 'ihr_refresh_token',
  CALENDAR_ID: 'primary',
  TASKS_LIST_ID: 'ihre_tasks_list_id',
};
```

### Zeitraum anpassen

Standardmäßig werden Events des heutigen Tages synchronisiert. Um dies zu ändern, bearbeiten Sie die Funktion `getTodayDateRange()` in `sync-calendar-to-tasks.js`.

Beispiel für morgen:

```javascript
function getTomorrowDateRange() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
  const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString()
  };
}
```

### Task-Format anpassen

Um das Format der erstellten Tasks zu ändern, bearbeiten Sie die Funktion `createTaskFromEvent()` in `sync-calendar-to-tasks.js`.

## 🛡️ Sicherheit

- Committen Sie **niemals** Ihre `.env` Datei ins Repository
- Die `.gitignore` Datei schützt automatisch Ihre Credentials
- Behandeln Sie Ihre Tokens wie Passwörter

## 🐛 Troubleshooting

### "Fehler: Konfigurationswerte fehlen"

Stellen Sie sicher, dass alle Werte in der `.env` Datei korrekt eingetragen sind.

### "Invalid credentials"

- Prüfen Sie Ihre Client ID und Client Secret
- Stellen Sie sicher, dass der Refresh Token korrekt ist
- Generieren Sie ggf. einen neuen Refresh Token

### "Calendar not found"

- Prüfen Sie die Calendar ID
- Für den Hauptkalender verwenden Sie `primary`
- Stellen Sie sicher, dass die Google Calendar API aktiviert ist

### "Tasks list not found"

- Prüfen Sie die Tasks List ID
- Verwenden Sie das Script aus Abschnitt 4, um die richtige ID zu finden

### Rate Limit Errors

Das Script enthält bereits eine kleine Verzögerung zwischen API-Aufrufen (500ms). Bei vielen Events können Sie diese in der `syncCalendarToTasks()` Funktion erhöhen.

## 📝 Lizenz

MIT

## 🤝 Beitragen

Contributions sind willkommen! Erstellen Sie gerne Issues oder Pull Requests.
