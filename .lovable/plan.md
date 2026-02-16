

# Migraine Tracker App

## Overview
A responsive web app for tracking migraines, triggers, and medications — with smart side-effect monitoring and AI-powered predictions that unlock after enough data is collected. Auto-fetches weather data; everything else is manually logged. Syncs across phone and desktop.

---

## Phase 1: Core Logging

### Migraine Entry
- Quick-log button to start a migraine with timestamp
- **Severity** (1-10 scale)
- **Affected area** (head map selector: left, right, front, back, full)
- **Duration** — mark start/end, auto-calculates
- Symptoms checklist (nausea, aura, light/sound sensitivity, etc.)
- Notes field

### Trigger Tracking (Manual)
- **Water intake** — glasses/bottles per day
- **Caffeine** — type and amount
- **Food** — meal log with common trigger foods highlighted (cheese, chocolate, alcohol, etc.)
- **Sleep** — bedtime, wake time, quality rating
- **Stress** — daily 1-5 check-in
- **Blood pressure** — systolic/diastolic entry
- **Period cycle** — start/end dates

### Triggers You Experience
- Onboarding step: select your known triggers from a list (weather, food, stress, sleep, hormonal, etc.)
- App personalizes the logging interface to prioritize your relevant triggers

### Automatic Weather Tracking
- Browser geolocation to auto-detect location
- Fetch temperature, humidity, wind, barometric pressure via weather API
- Auto-attach weather snapshot to each migraine entry
- Track barometric pressure trends (rising/falling)

---

## Phase 2: Medication & Side Effect Monitoring

### Medication Logging
- Add medications with name, dosage, frequency
- Categorize as **preventive** (daily) or **acute/rescue** (as-needed when migraine hits)
- Log each time you take a medication with timestamp

### Clinical Pharma Database Integration
- Link medications to a drug information database (e.g., OpenFDA API)
- Show known side effects for each medication you're taking
- Categorize side effects by severity (common, serious, emergency)

### Side Effect Tracking
- Log side effects you experience: what, severity, duration
- App cross-references with known side effects from the database
- **Smart alerts**: If a side effect is flagged as serious or dangerous (e.g., blood pressure dropping to unsafe levels), the app immediately recommends contacting your prescriber — no waiting 2-4 months for your next appointment
- Tracks side effect patterns over time so you have documented evidence to share with your doctor
- Summary report you can show/send to your prescriber

---

## Phase 3: Dashboard & Patterns

### Dashboard
- Calendar view with migraine days color-coded by severity
- Weekly/monthly frequency stats
- Recent entries list
- Medication adherence overview

### Pattern Detection
- Charts correlating triggers with migraines (pressure drops, sleep, hydration, cycle)
- Highlight top suspected triggers
- Period cycle overlay on migraine calendar
- Medication effectiveness tracking (does med X reduce severity/frequency?)

---

## Phase 4: AI Predictions & Recommendations (Unlockable)

### Unlock after ~15-20 migraine entries with trigger data

### AI Features
- **Risk forecast**: "Barometric pressure dropping + low water intake today → elevated migraine risk"
- **Personalized recommendations**: "Drink more water", "Your migraines correlate with <6 hours sleep", "Consider preventive medication today"
- **Medication insights**: "Since starting Med X, your migraine frequency decreased by 30%" or "Med Y doesn't appear to be reducing your migraines"
- **Chat interface** to ask questions about your patterns

---

## Accounts & Data
- Email/password auth via Supabase — syncs across devices
- Export data as CSV for doctor visits
- Local-first option for privacy if preferred

## Design
- Mobile-first, responsive for desktop
- Calming color palette, easy on eyes during active migraines
- Large tap targets, minimal steps for quick logging
- Dark mode support

