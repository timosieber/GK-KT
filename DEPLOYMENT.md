# 🚀 Deployment Guide - Schnellstart

Dieser Guide zeigt Ihnen die **schnellsten Wege**, um Ihren Calendar-to-Tasks Sync zu deployen.

## 🎯 Empfohlene Plattformen (nach Einfachheit sortiert)

### 1. 🥇 Vercel - Am einfachsten!

**Warum Vercel?**
- ✅ Native Cron Jobs im Free Tier
- ✅ 1-Klick Deployment von GitHub
- ✅ Automatische Environment Variable Verwaltung

**Deployment in 3 Schritten:**

```bash
# 1. Vercel CLI installieren
npm i -g vercel

# 2. In Vercel einloggen und deployen
vercel

# 3. Environment Variables setzen
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REFRESH_TOKEN
vercel env add TASKS_LIST_ID

# Production deployment
vercel --prod
```

**Oder über die Weboberfläche:**
1. [vercel.com](https://vercel.com/) öffnen
2. "New Project" > GitHub Repository auswählen
3. Environment Variables setzen
4. Deploy!

Die `vercel.json` ist bereits konfiguriert für tägliche Ausführung um 5:00 UTC.

---

### 2. 🥈 Render - Sehr einfach!

**Warum Render?**
- ✅ Native Cron Jobs im Free Tier
- ✅ Sehr gutes Dashboard
- ✅ Blueprint-Datei bereits vorhanden

**Deployment in 2 Schritten:**

1. [render.com](https://render.com/) öffnen
2. "New" > "Cron Job" > Repository verbinden
3. Render erkennt automatisch die `render.yaml`!
4. Environment Variables im Dashboard setzen
5. Deploy!

Die `render.yaml` ist bereits konfiguriert.

---

### 3. 🥉 Netlify + GitHub Actions - Kostenlos!

**Warum diese Kombination?**
- ✅ Komplett kostenlos
- ✅ Bereits vorkonfiguriert in diesem Repo
- ✅ Keine externen Cron-Services nötig

**Deployment:**

1. [netlify.com](https://netlify.com/) öffnen
2. "New site from Git" > Repository verbinden
3. Environment Variables setzen
4. Deploy!

**GitHub Actions einrichten:**
1. GitHub Repository > Settings > Secrets
2. Neues Secret: `NETLIFY_FUNCTION_URL` = `https://ihre-site.netlify.app/sync`
3. Fertig! Läuft täglich um 5:00 UTC

Die `.github/workflows/daily-sync.yml` und `netlify.toml` sind bereits konfiguriert.

---

## 📋 Environment Variables Checkliste

Alle Plattformen benötigen diese Variables:

```
✅ GOOGLE_CLIENT_ID         - Von Google Cloud Console
✅ GOOGLE_CLIENT_SECRET     - Von Google Cloud Console
✅ GOOGLE_REFRESH_TOKEN     - Von OAuth Playground
✅ CALENDAR_ID              - "primary" oder spezifische ID
✅ TASKS_LIST_ID            - Von Google Tasks API
```

**Wie Sie diese Werte erhalten, steht im Haupt-README.md!**

---

## 🔍 Welche Plattform ist die richtige für mich?

### Anfänger ohne Vorkenntnisse
→ **Vercel** - Am einfachsten, alles automatisch

### Möchte mehr Kontrolle über Logs
→ **Render** - Sehr gutes Dashboard mit detaillierten Logs

### Will 100% kostenlos bleiben ohne Kreditkarte
→ **Netlify + GitHub Actions** - Komplett ohne Zahlungsinformationen

### Fortgeschrittene mit AWS-Erfahrung
→ **AWS Lambda + EventBridge** - Maximale Flexibilität

### Möchte maximale Free Tier Limits
→ **Google Cloud Run** - 2M Requests/Monat kostenlos

---

## ⚡ Quick Commands Übersicht

### Vercel
```bash
vercel                    # Deployen
vercel logs               # Logs ansehen
vercel env ls             # Environment Variables auflisten
```

### Netlify
```bash
netlify deploy --prod     # Deployen
netlify logs              # Logs ansehen
netlify env:list          # Environment Variables auflisten
```

### Render
Alles über das Dashboard: [dashboard.render.com](https://dashboard.render.com/)

---

## 🧪 Testing nach Deployment

Testen Sie Ihre Deployment mit:

**Vercel:**
```bash
curl https://ihre-app.vercel.app/api/sync
```

**Netlify:**
```bash
curl https://ihre-site.netlify.app/.netlify/functions/sync-calendar
# oder
curl https://ihre-site.netlify.app/sync
```

**Render:**
Render führt den Cron Job automatisch aus. Logs im Dashboard ansehen.

---

## 🆘 Troubleshooting

### "Missing environment variables"
→ Prüfen Sie, ob alle 5 Required Variables gesetzt sind

### "Invalid credentials"
→ Generieren Sie einen neuen Refresh Token

### "Function timeout"
→ Reduzieren Sie die Anzahl der abgerufenen Events oder erhöhen Sie das Timeout

### Logs ansehen:
- **Vercel**: `vercel logs` oder Dashboard > Functions > Logs
- **Netlify**: Dashboard > Functions > sync-calendar > Logs
- **Render**: Dashboard > Service > Logs Tab

---

## 📚 Weitere Informationen

Detaillierte Anleitungen für alle Plattformen finden Sie im **README.md**

- Google Cloud Console Setup
- OAuth Token Generierung
- Tasks Liste ID finden
- Erweiterte Konfigurationen
- Alle 9 Hosting-Optionen im Detail

---

**Viel Erfolg mit Ihrem Deployment! 🎉**
