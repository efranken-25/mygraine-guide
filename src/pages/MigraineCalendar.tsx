import { useState } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, addDays, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Brain, Clock, Droplets, Wind, Pill, Plus, Trash2, AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import LogMigraineForm, { UserEntry } from "@/components/LogMigraineForm";
import MedicalAlertDialog, { checkMedicalAlert, AlertResult } from "@/components/MedicalAlertDialog";
import OtcRecommendationDialog from "@/components/OtcRecommendationDialog";

type MigraineDay = {
  date: Date;
  severity: number;
  durationMin: number;
  area: string;
  medication: string;
  weather: string;
  stressLevel: string;
  caffeinesMg: number;
  waterMl: number;
  sleepHours: number;
  skippedMeals: boolean;
  notes: string;
  triggers: string[];
};

// Drug class map for same-class detection
const DRUG_CLASS: Record<string, string> = {
  Sumatriptan: "Triptan", Rizatriptan: "Triptan", Zolmitriptan: "Triptan",
  Eletriptan: "Triptan", Frovatriptan: "Triptan", Naratriptan: "Triptan",
  Almotriptan: "Triptan",
  Ibuprofen: "NSAID", Naproxen: "NSAID", Aspirin: "NSAID", Diclofenac: "NSAID",
  Ubrogepant: "Gepant", Rimegepant: "Gepant", Atogepant: "Gepant",
  Topiramate: "Antiepileptic", Valproate: "Antiepileptic",
  Propranolol: "Beta-blocker", Metoprolol: "Beta-blocker",
  Amitriptyline: "TCA", Nortriptyline: "TCA",
  Erenumab: "Anti-CGRP mAb", Fremanezumab: "Anti-CGRP mAb",
  Galcanezumab: "Anti-CGRP mAb", Eptinezumab: "Anti-CGRP mAb",
};

// Migraine dummy data
const MIGRAINE_DATA: MigraineDay[] = [
  { date: new Date(2026, 1, 1),  severity: 7,  durationMin: 165, area: "Right Temporal",    medication: "Sumatriptan",   weather: "Cloudy",       stressLevel: "High",      caffeinesMg: 120, waterMl: 1800, sleepHours: 6.0, skippedMeals: false, notes: "Woke up tired; late coffee",          triggers: ["Poor Sleep", "Caffeine", "Stress"] },
  { date: new Date(2026, 1, 2),  severity: 9,  durationMin: 135, area: "Left Orbital",      medication: "Ibuprofen",     weather: "Rain",         stressLevel: "Very High", caffeinesMg: 0,   waterMl: 1000, sleepHours: 4.5, skippedMeals: true,  notes: "Skipped breakfast; long screen time", triggers: ["Skipped Meal", "Dehydration", "Poor Sleep", "Screen Time", "Rain/Pressure"] },
  { date: new Date(2026, 1, 4),  severity: 5,  durationMin: 165, area: "Bifrontal",         medication: "None",          weather: "Overcast",     stressLevel: "Moderate",  caffeinesMg: 80,  waterMl: 1600, sleepHours: 5.0, skippedMeals: false, notes: "Woke early for work; mild stress",    triggers: ["Poor Sleep", "Stress"] },
  { date: new Date(2026, 1, 5),  severity: 8,  durationMin: 165, area: "Occipital",         medication: "Sumatriptan",   weather: "Storm",        stressLevel: "High",      caffeinesMg: 150, waterMl: 1400, sleepHours: 5.5, skippedMeals: true,  notes: "Loud office; storm outside",          triggers: ["Weather/Storm", "Skipped Meal", "Noise", "Caffeine"] },
  { date: new Date(2026, 1, 7),  severity: 6,  durationMin: 100, area: "Fronto-Temporal",   medication: "Acetaminophen", weather: "Cloudy",       stressLevel: "Moderate",  caffeinesMg: 90,  waterMl: 1500, sleepHours: 6.5, skippedMeals: false, notes: "Headache after late night coding",    triggers: ["Screen Time", "Stress"] },
  { date: new Date(2026, 1, 9),  severity: 4,  durationMin: 90,  area: "Vertex",            medication: "None",          weather: "Rain",         stressLevel: "High",      caffeinesMg: 50,  waterMl: 1700, sleepHours: 5.0, skippedMeals: false, notes: "Work deadline; light nausea",         triggers: ["Stress", "Rain/Pressure", "Poor Sleep"] },
  { date: new Date(2026, 1, 10), severity: 8,  durationMin: 90,  area: "Right Occipital",   medication: "Sumatriptan",   weather: "Storm",        stressLevel: "Very High", caffeinesMg: 200, waterMl: 1400, sleepHours: 4.0, skippedMeals: true,  notes: "Major stress at work; loud environment", triggers: ["Stress", "Weather/Storm", "Skipped Meal", "Caffeine", "Poor Sleep", "Noise"] },
  { date: new Date(2026, 1, 12), severity: 5,  durationMin: 140, area: "Bifrontal",         medication: "Ibuprofen",     weather: "Overcast",     stressLevel: "Moderate",  caffeinesMg: 80,  waterMl: 1600, sleepHours: 5.5, skippedMeals: false, notes: "Early meeting; mild cramps",          triggers: ["Poor Sleep", "Hormonal/Menstrual"] },
  { date: new Date(2026, 1, 13), severity: 7,  durationMin: 155, area: "Left Temporal",     medication: "Sumatriptan",   weather: "Rain",         stressLevel: "High",      caffeinesMg: 160, waterMl: 1300, sleepHours: 5.0, skippedMeals: true,  notes: "Skipped lunch; high screen time",     triggers: ["Skipped Meal", "Rain/Pressure", "Screen Time", "Caffeine", "Hormonal/Menstrual"] },
  { date: new Date(2026, 1, 15), severity: 6,  durationMin: 140, area: "Frontal",           medication: "None",          weather: "Cloudy",       stressLevel: "Moderate",  caffeinesMg: 110, waterMl: 1700, sleepHours: 6.0, skippedMeals: false, notes: "Headache after long meeting",         triggers: ["Stress", "Screen Time"] },
  { date: new Date(2026, 1, 16), severity: 5,  durationMin: 90,  area: "Temporal Band",     medication: "Acetaminophen", weather: "Clear",        stressLevel: "Moderate",  caffeinesMg: 180, waterMl: 1500, sleepHours: 6.5, skippedMeals: false, notes: "Evening screen time; bright room",    triggers: ["Screen Time", "Bright Light", "Caffeine"] },
  { date: new Date(2026, 1, 18), severity: 8,  durationMin: 150, area: "Right Periorbital", medication: "Sumatriptan",   weather: "Rain",         stressLevel: "Very High", caffeinesMg: 70,  waterMl: 1500, sleepHours: 4.5, skippedMeals: true,  notes: "Severe stress; skipped breakfast",    triggers: ["Stress", "Skipped Meal", "Rain/Pressure", "Poor Sleep", "Hormonal/Menstrual"] },
  { date: new Date(2026, 1, 19), severity: 3,  durationMin: 90,  area: "Bifrontal",         medication: "None",          weather: "Overcast",     stressLevel: "Mild",      caffeinesMg: 90,  waterMl: 1800, sleepHours: 7.0, skippedMeals: false, notes: "Mild headache; resolved with rest",   triggers: ["Hormonal/Menstrual"] },
  { date: new Date(2026, 2, 2),  severity: 6,  durationMin: 51,  area: "Periorbital",       medication: "Frovatriptan",  weather: "Light Rain",   stressLevel: "Mild",      caffeinesMg: 139, waterMl: 2115, sleepHours: 8.6, skippedMeals: false, notes: "Busy day but felt okay",              triggers: ["Hormonal/Menstrual", "Caffeine"] },
  { date: new Date(2026, 2, 3),  severity: 4,  durationMin: 193, area: "Left Temporal",     medication: "Topiramate",    weather: "Overcast",     stressLevel: "High",      caffeinesMg: 88,  waterMl: 2353, sleepHours: 6.5, skippedMeals: false, notes: "Household chores most of day",        triggers: ["Stress"] },
  { date: new Date(2026, 2, 4),  severity: 10, durationMin: 219, area: "Frontal",           medication: "Ibuprofen",     weather: "Cloudy",       stressLevel: "Mild",      caffeinesMg: 6,   waterMl: 1505, sleepHours: 8.4, skippedMeals: false, notes: "Slept late; early alarm disrupted",  triggers: ["Disrupted Sleep", "Dehydration"] },
  { date: new Date(2026, 2, 6),  severity: 3,  durationMin: 81,  area: "Bifrontal",         medication: "Excedrin",      weather: "Snow",         stressLevel: "Moderate",  caffeinesMg: 116, waterMl: 2269, sleepHours: 5.9, skippedMeals: false, notes: "Meetings in bright room",             triggers: ["Bright Light", "Stress"] },
  { date: new Date(2026, 2, 7),  severity: 7,  durationMin: 135, area: "Right Orbital",     medication: "Naproxen",      weather: "Foggy",        stressLevel: "Very High", caffeinesMg: 249, waterMl: 2473, sleepHours: 4.2, skippedMeals: false, notes: "Long coding session; forgot breaks",  triggers: ["Screen Time", "Caffeine", "Poor Sleep"] },
  { date: new Date(2026, 2, 8),  severity: 9,  durationMin: 51,  area: "Vertex",            medication: "Ibuprofen",     weather: "Snow",         stressLevel: "Very High", caffeinesMg: 260, waterMl: 1620, sleepHours: 5.9, skippedMeals: false, notes: "Travel day; irregular meals",         triggers: ["Travel", "Caffeine", "Stress", "Weather/Storm"] },
  { date: new Date(2026, 2, 9),  severity: 8,  durationMin: 173, area: "Left Temporal",     medication: "Naproxen",      weather: "Foggy",        stressLevel: "Moderate",  caffeinesMg: 168, waterMl: 2741, sleepHours: 6.9, skippedMeals: false, notes: "Outdoor walk; low phone use",         triggers: ["Barometric Pressure", "Caffeine"] },
  { date: new Date(2026, 2, 12), severity: 5,  durationMin: 136, area: "Occipital",         medication: "Sumatriptan",   weather: "Partly Cloudy",stressLevel: "Moderate",  caffeinesMg: 24,  waterMl: 1797, sleepHours: 5.1, skippedMeals: false, notes: "Gym in morning; hydrated well",       triggers: ["Poor Sleep", "Hormonal/Menstrual"] },
  { date: new Date(2026, 2, 13), severity: 9,  durationMin: 82,  area: "Frontal",           medication: "Rizatriptan",   weather: "Thunderstorm", stressLevel: "Very High", caffeinesMg: 13,  waterMl: 1756, sleepHours: 4.4, skippedMeals: true,  notes: "Argued with colleague; thunderstorm", triggers: ["Stress", "Weather/Storm", "Skipped Meal", "Poor Sleep", "Hormonal/Menstrual"] },
  { date: new Date(2026, 2, 15), severity: 3,  durationMin: 61,  area: "Right Parietal",    medication: "Acetaminophen", weather: "Light Rain",   stressLevel: "Moderate",  caffeinesMg: 177, waterMl: 2054, sleepHours: 4.6, skippedMeals: true,  notes: "Travel day; irregular meals",         triggers: ["Travel", "Skipped Meal", "Poor Sleep", "Hormonal/Menstrual"] },
  { date: new Date(2026, 2, 17), severity: 5,  durationMin: 49,  area: "Right Temporal",    medication: "Topiramate",    weather: "Light Rain",   stressLevel: "Mild",      caffeinesMg: 201, waterMl: 1967, sleepHours: 7.3, skippedMeals: false, notes: "Busy day but felt okay",              triggers: ["Caffeine", "Rain/Pressure"] },
  { date: new Date(2026, 2, 18), severity: 9,  durationMin: 129, area: "Bilateral Temporal",medication: "Zolmitriptan",  weather: "Storm",        stressLevel: "Very High", caffeinesMg: 235, waterMl: 2669, sleepHours: 7.6, skippedMeals: true,  notes: "Travel day; irregular meals",         triggers: ["Weather/Storm", "Travel", "Skipped Meal", "Caffeine", "Stress"] },
  { date: new Date(2026, 2, 20), severity: 6,  durationMin: 151, area: "Periorbital",       medication: "Rizatriptan",   weather: "Snow",         stressLevel: "Moderate",  caffeinesMg: 225, waterMl: 2274, sleepHours: 8.1, skippedMeals: true,  notes: "Travel day; irregular meals",         triggers: ["Travel", "Skipped Meal", "Caffeine"] },
  { date: new Date(2026, 2, 21), severity: 7,  durationMin: 149, area: "Right Orbital",     medication: "Ibuprofen",     weather: "Clear",        stressLevel: "High",      caffeinesMg: 94,  waterMl: 1710, sleepHours: 7.3, skippedMeals: true,  notes: "Lots of meetings in bright room",     triggers: ["Bright Light", "Skipped Meal", "Hormonal/Menstrual"] },
  { date: new Date(2026, 2, 23), severity: 7,  durationMin: 193, area: "Left Orbital",      medication: "Ibuprofen",     weather: "Cloudy",       stressLevel: "Moderate",  caffeinesMg: 160, waterMl: 1641, sleepHours: 6.0, skippedMeals: false, notes: "Long coding session; forgot breaks",  triggers: ["Screen Time", "Caffeine", "Hormonal/Menstrual"] },
  { date: new Date(2026, 2, 24), severity: 8,  durationMin: 66,  area: "Occipital",         medication: "Rizatriptan",   weather: "Light Rain",   stressLevel: "Very High", caffeinesMg: 224, waterMl: 1453, sleepHours: 4.4, skippedMeals: false, notes: "Travel day; irregular meals",         triggers: ["Travel", "Caffeine", "Poor Sleep", "Rain/Pressure"] },
  { date: new Date(2026, 2, 26), severity: 10, durationMin: 213, area: "Periorbital",       medication: "Eletriptan",    weather: "Cloudy",       stressLevel: "Very High", caffeinesMg: 151, waterMl: 2467, sleepHours: 6.7, skippedMeals: false, notes: "Travel day; irregular meals",         triggers: ["Travel", "Stress", "Caffeine"] },
  { date: new Date(2026, 2, 27), severity: 3,  durationMin: 48,  area: "Left Temporal",     medication: "Naproxen",      weather: "Light Rain",   stressLevel: "High",      caffeinesMg: 243, waterMl: 2064, sleepHours: 5.1, skippedMeals: true,  notes: "Long coding session; forgot breaks",  triggers: ["Caffeine", "Skipped Meal", "Poor Sleep", "Screen Time"] },
];

function minToHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function severityDot(s: number) {
  if (s <= 3) return "bg-[hsl(var(--severity-low))]";
  if (s <= 6) return "bg-[hsl(var(--severity-mid))]";
  return "bg-[hsl(var(--severity-high))]";
}

function severityLabel(s: number) {
  if (s <= 3) return "Mild";
  if (s <= 6) return "Moderate";
  return "Severe";
}

function severityTextColor(s: number) {
  if (s <= 3) return "text-[hsl(var(--severity-low))]";
  if (s <= 6) return "text-[hsl(var(--severity-mid))]";
  return "text-[hsl(var(--severity-high))]";
}

/** Get medication string(s) from either entry type */
function getMedStrings(m: MigraineDay | UserEntry): string[] {
  if ("medication" in m) return m.medication !== "None" ? [m.medication] : [];
  return m.meds;
}

export default function MigraineCalendar() {
  const { entries: userEntries, addEntry, updateEntry, deleteEntry: deleteFromContext } = useEntries();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState<string | undefined>(undefined);
  const [editingEntry, setEditingEntry] = useState<UserEntry | undefined>(undefined);
  const [alertResult, setAlertResult] = useState<AlertResult | null>(null);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [deletedSampleDates, setDeletedSampleDates] = useState<Set<string>>(new Set());
  const [quickAddDay, setQuickAddDay] = useState<Date | null>(null);
  const [showOtcDialog, setShowOtcDialog] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getMigraineForDay = (day: Date): MigraineDay | UserEntry | undefined => {
    const sampleEntry = MIGRAINE_DATA.find((m) => isSameDay(m.date, day));
    if (sampleEntry && deletedSampleDates.has(format(day, "yyyy-MM-dd"))) return userEntries.find((e) => e.date === format(day, "MMM d"));
    return sampleEntry ?? userEntries.find((e) => e.date === format(day, "MMM d"));
  };

  /** Check if this day + the previous day both have different drugs of the same class */
  const hasSameClassWarning = (day: Date): { drugA: string; drugB: string; cls: string } | null => {
    const iso = format(day, "yyyy-MM-dd");
    if (dismissedWarnings.has(iso)) return null;

    const today = getMigraineForDay(day);
    const yesterday = getMigraineForDay(subDays(day, 1));
    if (!today || !yesterday) return null;

    const medsToday = getMedStrings(today);
    const medsYesterday = getMedStrings(yesterday);

    for (const a of medsToday) {
      for (const b of medsYesterday) {
        const clsA = DRUG_CLASS[a];
        const clsB = DRUG_CLASS[b];
        if (clsA && clsB && clsA === clsB && a !== b) {
          return { drugA: a, drugB: b, cls: clsA };
        }
      }
    }
    return null;
  };

  const deleteEntry = (entry: MigraineDay | UserEntry) => {
    if (isUserEntryFn(entry)) {
      deleteFromContext(entry.id);
    } else {
      setDeletedSampleDates((prev) => new Set(prev).add(format(entry.date, "yyyy-MM-dd")));
    }
    setSelectedDay(null);
  };

  // Calculate month migraines from both MIGRAINE_DATA and userEntries
  const allMonthEntries = [
    ...MIGRAINE_DATA.filter((m) => m.date >= monthStart && m.date <= monthEnd && !deletedSampleDates.has(format(m.date, "yyyy-MM-dd"))),
    ...userEntries.filter((e) => {
      try {
        const entryDate = e.date.includes("/") ? new Date(e.date) : new Date();
        const parsed = e.date.includes("-") ? new Date(e.date) : new Date(new Date().getFullYear(), new Date().getMonth(), parseInt(e.date.split(" ")[1]));
        return parsed >= monthStart && parsed <= monthEnd;
      } catch {
        return false;
      }
    })
  ];
  
  const monthMigraines = allMonthEntries;
  const avgSeverity = monthMigraines.length
    ? (monthMigraines.reduce((a, m) => a + m.severity, 0) / monthMigraines.length).toFixed(1)
    : "—";

  const selectedMigraine = selectedDay ? getMigraineForDay(selectedDay) : undefined;
  const selectedWarning = selectedDay ? hasSameClassWarning(selectedDay) : null;

  const getWater = (m: MigraineDay | UserEntry) => "waterMl" in m ? `${(m.waterMl / 1000).toFixed(1)}L` : m.water > 0 ? `${m.water} gl` : "—";
  const getStress = (m: MigraineDay | UserEntry) => "stressLevel" in m ? m.stressLevel : m.stress;
  const getSleep = (m: MigraineDay | UserEntry) => "sleepHours" in m ? m.sleepHours : m.sleep;
  const getCaffeine = (m: MigraineDay | UserEntry) => "caffeinesMg" in m ? `${m.caffeinesMg}mg` : `${m.caffeine}mg`;
  const getSkipped = (m: MigraineDay | UserEntry) => "skippedMeals" in m ? m.skippedMeals : m.skippedMeal;
  const getMeds = (m: MigraineDay | UserEntry) => {
    const meds = getMedStrings(m);
    return meds.length > 0 ? meds.join(", ") : null;
  };
  const isUserEntryFn = (m: MigraineDay | UserEntry): m is UserEntry => "isUserEntry" in m;

  const quickAdd = (day: Date, severity: number) => {
    const dateLabel = format(day, "MMM d");
    const entry: UserEntry = {
      id: Date.now(),
      date: dateLabel,
      severity,
      durationMin: 60,
      area: "Full Head",
      symptoms: [],
      triggers: [],
      meds: [],
      weather: "—",
      sleep: 0,
      caffeine: 0,
      water: 0,
      stress: severity >= 8 ? "Very High" : severity >= 5 ? "High" : "Moderate",
      skippedMeal: false,
      notes: "",
      isUserEntry: true,
    };
    addEntry(entry);
    setQuickAddDay(null);
    setSelectedDay(day);
    // Quick add has no meds, show OTC dialog
    setTimeout(() => setShowOtcDialog(true), 100);
  };

  const openEditForm = (entry: UserEntry) => {
    setEditingEntry(entry);
    setFormDate(entry.date);
    setShowForm(true);
  };

  const handleFormSave = (e: UserEntry) => {
    if (editingEntry) {
      setUserEntries((prev) => prev.map((existing) => existing.id === editingEntry.id ? e : existing));
    } else {
      addEntry(e);
    }
    setSelectedDay(null);
    setShowForm(false);
    setEditingEntry(undefined);

    // Check if no rescue meds were logged
    const hasRescueMeds = e.meds && e.meds.length > 0 && !e.meds.every(m => m === "None" || m === "Unknown");
    if (!hasRescueMeds) {
      setTimeout(() => setShowOtcDialog(true), 100);
    }

    const muted = localStorage.getItem("mute-medical-alerts") === "true";
    if (!muted) {
      const result = checkMedicalAlert(e);
      if (result.triggered) {
        setTimeout(() => setAlertResult(result), hasRescueMeds ? 50 : 600);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Migraine Calendar</h1>
        <p className="text-muted-foreground">Tap a day to view details</p>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold font-serif">{monthMigraines.length}</p>
            <p className="text-xs text-muted-foreground">Migraine days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold font-serif">{avgSeverity}</p>
            <p className="text-xs text-muted-foreground">Avg severity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold font-serif">{daysInMonth.length - monthMigraines.length}</p>
            <p className="text-xs text-muted-foreground">Clear days</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <button className="rounded-full p-1.5 hover:bg-muted transition-colors" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <CardTitle className="text-base">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <button className="rounded-full p-1.5 hover:bg-muted transition-colors" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {daysInMonth.map((day) => {
              const migraine = getMigraineForDay(day);
              const isSelected = selectedDay && isSameDay(selectedDay, day);
              const isToday = isSameDay(day, new Date());
              const warning = hasSameClassWarning(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg py-2 text-sm transition-all",
                    isSelected && "ring-2 ring-primary",
                    isToday && !migraine && "bg-muted font-bold",
                    migraine ? "bg-destructive/10 hover:bg-destructive/20 cursor-pointer" : "hover:bg-muted/50",
                  )}
                >
                  <span className={cn("leading-none text-xs", migraine && "font-semibold")}>
                    {format(day, "d")}
                  </span>
                  {migraine && !warning && (
                    <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", severityDot(migraine.severity))} />
                  )}
                  {warning && (
                    <span className="mt-0.5 text-[10px] leading-none">⚠️</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--severity-low))]" /> Mild
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--severity-mid))]" /> Moderate
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--severity-high))]" /> Severe
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              ⚠️ Drug warning
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Same-class drug warning banner (shown when day is selected) */}
      {selectedDay && selectedWarning && (
        <div className="rounded-2xl border border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/8 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(var(--warning))]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[hsl(var(--warning))]">Same-class medication on consecutive days</p>
              <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                <span className="font-medium">{selectedWarning.drugB}</span> was taken the day before and{" "}
                <span className="font-medium">{selectedWarning.drugA}</span> was taken today — both are <span className="font-medium">{selectedWarning.cls}s</span>.
                Taking two drugs from the same class on consecutive days may increase the risk of medication overuse headache and interaction effects.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full border-[hsl(var(--warning))]/40 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/10"
            onClick={() => {
              setDismissedWarnings((prev) => new Set([...prev, format(selectedDay, "yyyy-MM-dd")]));
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            I'm aware — confirmed with my provider
          </Button>
        </div>
      )}

      {/* Selected day detail */}
      {selectedMigraine && selectedDay && (
        <Card className="border-destructive/20">
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-destructive" />
                <span className="font-semibold">{format(selectedDay, "EEEE, MMM d")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{severityLabel(selectedMigraine.severity)}</Badge>
                <span className={cn("inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold text-white", severityDot(selectedMigraine.severity))}>
                  {selectedMigraine.severity}
                </span>
                {/* Edit button for user entries */}
                {isUserEntryFn(selectedMigraine) && (
                  <button
                    onClick={() => openEditForm(selectedMigraine)}
                    className="ml-1 rounded-full p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    title="Edit this entry"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {/* Delete button */}
                <button
                    onClick={() => deleteEntry(selectedMigraine)}
                    className="ml-1 rounded-full p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete this entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                <p className="font-medium">{minToHm(selectedMigraine.durationMin)}</p>
                <p className="text-muted-foreground text-[10px]">Duration</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <Droplets className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                <p className="font-medium">{getWater(selectedMigraine)}</p>
                <p className="text-muted-foreground text-[10px]">Water</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2 text-center">
                <Wind className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                <p className="font-medium">{"weather" in selectedMigraine ? selectedMigraine.weather : "—"}</p>
                <p className="text-muted-foreground text-[10px]">Weather</p>
              </div>
            </div>

            {/* Location & stats */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Badge variant="secondary">{selectedMigraine.area}</Badge>
              <Badge variant="secondary" className={`capitalize ${getStress(selectedMigraine) === "Very High" || getStress(selectedMigraine) === "High" ? "bg-destructive/10 text-destructive border-destructive/20" : ""}`}>
                Stress: {getStress(selectedMigraine)}
              </Badge>
              <Badge variant="secondary">Sleep: {getSleep(selectedMigraine)}h</Badge>
              <Badge variant="secondary">Caffeine: {getCaffeine(selectedMigraine)}</Badge>
              {getSkipped(selectedMigraine) && (
                <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10">Skipped Meal</Badge>
              )}
              {isUserEntryFn(selectedMigraine) && (
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">You</Badge>
              )}
            </div>

            {/* Triggers */}
            {selectedMigraine.triggers.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Identified Triggers</p>
                <div className="flex flex-wrap gap-1">
                  {selectedMigraine.triggers.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs text-destructive border-destructive/30 bg-destructive/5">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Medication */}
            {getMeds(selectedMigraine) && (
              <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                <Pill className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Took <span className="font-medium text-foreground">{getMeds(selectedMigraine)}</span></span>
              </div>
            )}

            {/* Notes */}
            {selectedMigraine.notes && (
              <p className="text-xs text-muted-foreground italic">"{selectedMigraine.notes}"</p>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedDay && (
        <p className="text-xs text-muted-foreground text-center">
          Tap a highlighted day to view details, or tap any clear day to log a new migraine.
        </p>
      )}

      {selectedDay && !selectedMigraine && (
        <Card className="border-dashed border-border">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">{format(selectedDay, "EEEE, MMM d")} — no migraine recorded.</p>
            
            {quickAddDay && isSameDay(quickAddDay, selectedDay) ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-center">How severe? Tap to log instantly</p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button
                      key={n}
                      onClick={() => quickAdd(selectedDay, n)}
                      className={`flex-1 h-9 rounded text-xs font-bold transition-all ${
                        n <= 3 ? "bg-[hsl(var(--severity-low))] text-white" : n <= 6 ? "bg-[hsl(var(--severity-mid))] text-white" : "bg-destructive text-white"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <button onClick={() => setQuickAddDay(null)} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 flex items-center gap-2"
                  onClick={() => setQuickAddDay(selectedDay)}
                >
                  <Plus className="h-4 w-4" /> Quick Log
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setEditingEntry(undefined);
                    setFormDate(format(selectedDay, "MMM d"));
                    setShowForm(true);
                  }}
                >
                  Full Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Global log button */}
      <Button
        variant="outline"
        className="w-full flex items-center gap-2"
        onClick={() => { setEditingEntry(undefined); setFormDate(undefined); setShowForm(true); }}
      >
        <Plus className="h-4 w-4" /> Log a Migraine Today
      </Button>

      {alertResult && (
        <MedicalAlertDialog
          open={true}
          onClose={() => setAlertResult(null)}
          result={alertResult}
        />
      )}

      {showForm && (
        <LogMigraineForm
          initialDate={formDate}
          initialEntry={editingEntry}
          onSave={handleFormSave}
          onClose={() => { setShowForm(false); setEditingEntry(undefined); }}
        />
      )}

      <OtcRecommendationDialog open={showOtcDialog} onClose={() => setShowOtcDialog(false)} />
    </div>
  );
}
