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
