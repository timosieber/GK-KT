/**
 * Netlify Scheduled Function für Google Calendar zu Tasks Sync
 *
 * Diese Function wird automatisch von Netlify ausgeführt (täglich um 7:00 UTC)
 * Kann auch manuell über einen HTTP-Request getriggert werden
 */

const { google } = require('googleapis');

// ============================================================================
// KONFIGURATION - Wird automatisch aus Netlify Environment Variables geladen
// ============================================================================

const CONFIG = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  CALENDAR_ID: process.env.CALENDAR_ID || 'primary',
  TASKS_LIST_ID: process.env.TASKS_LIST_ID,
};

// ============================================================================
// HELPER FUNKTIONEN
// ============================================================================

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    CONFIG.GOOGLE_CLIENT_ID,
    CONFIG.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );

  oauth2Client.setCredentials({
    refresh_token: CONFIG.GOOGLE_REFRESH_TOKEN
  });

  return oauth2Client;
}

function getTodayDateRange() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString()
  };
}

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

function getEventStartTime(event) {
  if (event.start.dateTime) {
    return event.start.dateTime;
  } else if (event.start.date) {
    return new Date(event.start.date + 'T00:00:00').toISOString();
  }
  return null;
}

function createEventSignature(event) {
  const startTime = getEventStartTime(event);
  return `[CAL-EVENT] ${event.summary} | ${startTime}`;
}

// ============================================================================
// SYNC FUNKTIONEN
// ============================================================================

async function getTodayEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  const dateRange = getTodayDateRange();

  console.log('📅 Rufe Events für heute ab...');
  console.log(`   Zeitraum: ${formatDateTime(dateRange.start)} bis ${formatDateTime(dateRange.end)}`);

  const response = await calendar.events.list({
    calendarId: CONFIG.CALENDAR_ID,
    timeMin: dateRange.start,
    timeMax: dateRange.end,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];
  console.log(`✅ ${events.length} Event(s) gefunden`);

  return events;
}

async function getExistingTasks(auth) {
  const tasks = google.tasks({ version: 'v1', auth });

  const response = await tasks.tasks.list({
    tasklist: CONFIG.TASKS_LIST_ID,
    showCompleted: false,
    showHidden: false,
    maxResults: 100
  });

  return response.data.items || [];
}

function taskExists(event, existingTasks) {
  const eventSignature = createEventSignature(event);

  return existingTasks.some(task => {
    return task.title?.includes(eventSignature) ||
           task.notes?.includes(eventSignature);
  });
}

async function createTaskFromEvent(auth, event) {
  const tasks = google.tasks({ version: 'v1', auth });

  const startTime = getEventStartTime(event);
  const endTime = event.end?.dateTime || event.end?.date;

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
    due: startTime
  };

  const response = await tasks.tasks.insert({
    tasklist: CONFIG.TASKS_LIST_ID,
    requestBody: taskData
  });

  console.log(`   ✅ Task erstellt: "${taskData.title}"`);
  return response.data;
}

async function syncCalendarToTasks(auth) {
  console.log('🔄 Starte Synchronisation...\n');

  const events = await getTodayEvents(auth);
  const existingTasks = await getExistingTasks(auth);

  console.log(`📋 ${existingTasks.length} bestehende Task(s) gefunden`);
  console.log('─────────────────────────────────────────\n');

  if (events.length === 0) {
    console.log('ℹ️  Keine Events für heute vorhanden.');
    return {
      success: true,
      eventsFound: 0,
      tasksCreated: 0,
      tasksSkipped: 0
    };
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const event of events) {
    const eventTitle = event.summary || 'Unbenanntes Event';
    console.log(`📌 Verarbeite: "${eventTitle}"`);

    if (taskExists(event, existingTasks)) {
      console.log(`   ⏭️  Übersprungen (Task existiert bereits)\n`);
      skippedCount++;
      continue;
    }

    await createTaskFromEvent(auth, event);
    createdCount++;
    console.log('');

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('─────────────────────────────────────────');
  console.log('✨ Synchronisation abgeschlossen!\n');
  console.log(`📊 Statistik:`);
  console.log(`   • Events gefunden: ${events.length}`);
  console.log(`   • Tasks erstellt: ${createdCount}`);
  console.log(`   • Übersprungen: ${skippedCount}`);

  return {
    success: true,
    eventsFound: events.length,
    tasksCreated: createdCount,
    tasksSkipped: skippedCount
  };
}

// ============================================================================
// NETLIFY FUNCTION HANDLER
// ============================================================================

exports.handler = async (event, context) => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   🌐 Netlify Scheduled Function: Calendar → Tasks Sync');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`⏰ Ausgeführt am: ${new Date().toLocaleString('de-DE')}`);
  console.log(`🔑 Trigger: ${event.headers['x-netlify-event'] || 'manual'}\n`);

  // Validierung der Konfiguration
  const requiredFields = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'TASKS_LIST_ID'
  ];

  const missing = requiredFields.filter(field => !CONFIG[field]);

  if (missing.length > 0) {
    const errorMsg = `❌ Fehler: Folgende Environment Variables fehlen: ${missing.join(', ')}`;
    console.error(errorMsg);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Missing environment variables',
        missing: missing
      })
    };
  }

  try {
    // OAuth2 Client erstellen
    const auth = getOAuth2Client();

    // Synchronisation durchführen
    const result = await syncCalendarToTasks(auth);

    console.log('\n✅ Function erfolgreich ausgeführt!');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Synchronisation erfolgreich',
        timestamp: new Date().toISOString(),
        result: result
      })
    };

  } catch (error) {
    console.error('\n❌ Fehler bei der Ausführung:', error.message);
    console.error('Stack:', error.stack);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
