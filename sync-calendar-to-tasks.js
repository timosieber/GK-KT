#!/usr/bin/env node

/**
 * Google Calendar zu Google Tasks Synchronisations-Script
 *
 * Dieses Script liest alle Events des heutigen Tages aus einem Google Calendar
 * und erstellt automatisch entsprechende Tasks in Google Tasks.
 */

const { google } = require('googleapis');
require('dotenv').config();

// ============================================================================
// KONFIGURATION - Bitte hier Ihre Werte eintragen
// ============================================================================

const CONFIG = {
  // Google OAuth2 Credentials
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'HIER_IHRE_CLIENT_ID_EINTRAGEN',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'HIER_IHR_CLIENT_SECRET_EINTRAGEN',
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN || 'HIER_IHR_REFRESH_TOKEN_EINTRAGEN',

  // Google Calendar ID (z.B. "primary" für Hauptkalender oder spezifische ID)
  CALENDAR_ID: process.env.CALENDAR_ID || 'primary',

  // Google Tasks Liste ID
  TASKS_LIST_ID: process.env.TASKS_LIST_ID || 'HIER_IHRE_TASKS_LIST_ID_EINTRAGEN',
};

// ============================================================================
// HELPER FUNKTIONEN
// ============================================================================

/**
 * Erstellt einen OAuth2 Client mit den konfigurierten Credentials
 */
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    CONFIG.GOOGLE_CLIENT_ID,
    CONFIG.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob' // Redirect URI für Desktop-Apps
  );

  oauth2Client.setCredentials({
    refresh_token: CONFIG.GOOGLE_REFRESH_TOKEN
  });

  return oauth2Client;
}

/**
 * Gibt Start und Ende des heutigen Tages zurück
 */
function getTodayDateRange() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString()
  };
}

/**
 * Formatiert ein Datum für die Anzeige
 */
function formatDateTime(dateString) {
  if (!dateString) return 'Keine Zeit angegeben';

  const date = new Date(dateString);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Extrahiert die Startzeit für Ganztags-Events oder normale Events
 */
function getEventStartTime(event) {
  if (event.start.dateTime) {
    return event.start.dateTime;
  } else if (event.start.date) {
    // Ganztags-Event
    return new Date(event.start.date + 'T00:00:00').toISOString();
  }
  return null;
}

/**
 * Erstellt eine eindeutige Signatur für ein Event
 * Diese wird verwendet, um Duplikate zu vermeiden
 */
function createEventSignature(event) {
  const startTime = getEventStartTime(event);
  return `[CAL-EVENT] ${event.summary} | ${startTime}`;
}

// ============================================================================
// HAUPT-FUNKTIONEN
// ============================================================================

/**
 * Holt alle Events des heutigen Tages aus dem Google Calendar
 */
async function getTodayEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  const dateRange = getTodayDateRange();

  console.log('📅 Rufe Events für heute ab...');
  console.log(`   Zeitraum: ${formatDateTime(dateRange.start)} bis ${formatDateTime(dateRange.end)}`);

  try {
    const response = await calendar.events.list({
      calendarId: CONFIG.CALENDAR_ID,
      timeMin: dateRange.start,
      timeMax: dateRange.end,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`✅ ${events.length} Event(s) gefunden\n`);

    return events;
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Calendar Events:', error.message);
    throw error;
  }
}

/**
 * Holt alle bestehenden Tasks aus der Google Tasks Liste
 */
async function getExistingTasks(auth) {
  const tasks = google.tasks({ version: 'v1', auth });

  try {
    const response = await tasks.tasks.list({
      tasklist: CONFIG.TASKS_LIST_ID,
      showCompleted: false,
      showHidden: false,
      maxResults: 100
    });

    return response.data.items || [];
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Tasks:', error.message);
    throw error;
  }
}

/**
 * Prüft, ob ein Task für dieses Event bereits existiert
 */
function taskExists(event, existingTasks) {
  const eventSignature = createEventSignature(event);

  return existingTasks.some(task => {
    // Prüfe, ob die Signatur im Task-Title oder in den Notes enthalten ist
    return task.title?.includes(eventSignature) ||
           task.notes?.includes(eventSignature);
  });
}

/**
 * Erstellt einen neuen Task in Google Tasks basierend auf einem Calendar Event
 */
async function createTaskFromEvent(auth, event) {
  const tasks = google.tasks({ version: 'v1', auth });

  const startTime = getEventStartTime(event);
  const endTime = event.end?.dateTime || event.end?.date;

  // Erstelle die Task-Beschreibung mit allen relevanten Informationen
  const eventSignature = createEventSignature(event);
  const notes = `${eventSignature}

Beschreibung: ${event.description || 'Keine Beschreibung'}
Startzeit: ${formatDateTime(startTime)}
Endzeit: ${formatDateTime(endTime)}
Ort: ${event.location || 'Kein Ort angegeben'}

Link: ${event.htmlLink || ''}`;

  const taskData = {
    title: event.summary || 'Unbenanntes Event',
    notes: notes,
    due: startTime // Fälligkeit ist die Startzeit des Events
  };

  try {
    const response = await tasks.tasks.insert({
      tasklist: CONFIG.TASKS_LIST_ID,
      requestBody: taskData
    });

    console.log(`   ✅ Task erstellt: "${taskData.title}"`);
    return response.data;
  } catch (error) {
    console.error(`   ❌ Fehler beim Erstellen des Tasks für "${event.summary}":`, error.message);
    throw error;
  }
}

/**
 * Synchronisiert alle Events des heutigen Tages zu Google Tasks
 */
async function syncCalendarToTasks(auth) {
  console.log('🔄 Starte Synchronisation...\n');

  // Hole Events und bestehende Tasks
  const events = await getTodayEvents(auth);
  const existingTasks = await getExistingTasks(auth);

  console.log(`📋 ${existingTasks.length} bestehende Task(s) gefunden`);
  console.log('─────────────────────────────────────────\n');

  if (events.length === 0) {
    console.log('ℹ️  Keine Events für heute vorhanden.');
    return;
  }

  let createdCount = 0;
  let skippedCount = 0;

  // Verarbeite jedes Event
  for (const event of events) {
    const eventTitle = event.summary || 'Unbenanntes Event';
    console.log(`📌 Verarbeite: "${eventTitle}"`);

    // Prüfe auf Duplikate
    if (taskExists(event, existingTasks)) {
      console.log(`   ⏭️  Übersprungen (Task existiert bereits)\n`);
      skippedCount++;
      continue;
    }

    // Erstelle neuen Task
    await createTaskFromEvent(auth, event);
    createdCount++;
    console.log('');

    // Kleine Pause zwischen API-Aufrufen, um Rate Limits zu vermeiden
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Zusammenfassung
  console.log('─────────────────────────────────────────');
  console.log('✨ Synchronisation abgeschlossen!\n');
  console.log(`📊 Statistik:`);
  console.log(`   • Events gefunden: ${events.length}`);
  console.log(`   • Tasks erstellt: ${createdCount}`);
  console.log(`   • Übersprungen (bereits vorhanden): ${skippedCount}`);
}

// ============================================================================
// VALIDIERUNG & HAUPTPROGRAMM
// ============================================================================

/**
 * Validiert die Konfiguration
 */
function validateConfig() {
  const requiredFields = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'TASKS_LIST_ID'
  ];

  const missing = requiredFields.filter(field => {
    const value = CONFIG[field];
    return !value || value.startsWith('HIER_');
  });

  if (missing.length > 0) {
    console.error('❌ Fehler: Folgende Konfigurationswerte fehlen oder sind nicht gesetzt:\n');
    missing.forEach(field => console.error(`   • ${field}`));
    console.error('\nBitte konfigurieren Sie diese Werte in der .env Datei oder direkt im Script.\n');
    process.exit(1);
  }
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Google Calendar → Google Tasks Synchronisation');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Validiere Konfiguration
  validateConfig();

  try {
    // Erstelle OAuth2 Client
    const auth = getOAuth2Client();

    // Starte Synchronisation
    await syncCalendarToTasks(auth);

    console.log('\n✅ Fertig!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ein Fehler ist aufgetreten:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

// Script ausführen
if (require.main === module) {
  main();
}

module.exports = { syncCalendarToTasks, getTodayEvents, createTaskFromEvent };
