import { useState } from "react";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
  addMonths,
  addDays,
  subDays,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Clock,
  Droplets,
  Wind,
  Pill,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LogMigraineForm, { UserEntry } from "@/components/LogMigraineForm";
import MedicalAlertDialog, { checkMedicalAlert, AlertResult } from "@/components/MedicalAlertDialog";
import { useEntries } from "@/lib/entriesContext";

// ---------- Sample Migraine Data ----------
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

// Drug class map for consecutive day checks
const DRUG_CLASS: Record<string, string> = {
  Sumatriptan: "Triptan",
  Rizatriptan: "Triptan",
  Zolmitriptan: "Triptan",
  Eletriptan: "Triptan",
  Frovatriptan: "Triptan",
  Naratriptan: "Triptan",
  Almotriptan: "Triptan",
  Ibuprofen: "NSAID",
  Naproxen: "NSAID",
  Aspirin: "NSAID",
  Diclofenac: "NSAID",
  Ubrogepant: "Gepant",
  Rimegepant: "Gepant",
  Atogepant: "Gepant",
  Topiramate: "Antiepileptic",
  Valproate: "Antiepileptic",
  Propranolol: "Beta-blocker",
  Metoprolol: "Beta-blocker",
  Amitriptyline: "TCA",
  Nortriptyline: "TCA",
  Erenumab: "Anti-CGRP mAb",
  Fremanezumab: "Anti-CGRP mAb",
  Galcanezumab: "Anti-CGRP mAb",
  Eptinezumab: "Anti-CGRP mAb",
};

// You can keep your MIGRAINE_DATA array here
// Make sure to replace all UserEntry date strings with ISO strings in yyyy-MM-dd

// ---------- Helpers ----------
function minToHm(min: number) {
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

function getMedStrings(m: MigraineDay | UserEntry) {
  if ("medication" in m) return m.medication !== "None" ? [m.medication] : [];
  return m.meds;
}

// ---------- Component ----------
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  // ---------- Get migraine for a day (sample + user entries) ----------
  const getMigraineForDay = (day: Date): MigraineDay | UserEntry | undefined => {
    const iso = format(day, "yyyy-MM-dd");
    if (deletedSampleDates.has(iso)) {
      return userEntries.find((e) => e.date === iso);
    }
    return MIGRAINE_DATA.find((m) => format(m.date, "yyyy-MM-dd") === iso) ?? userEntries.find((e) => e.date === iso);
  };

  // ---------- Same-class warning ----------
  const hasSameClassWarning = (day: Date) => {
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

  // ---------- Delete ----------
  const isUserEntryFn = (m: MigraineDay | UserEntry): m is UserEntry => "isUserEntry" in m;

  const deleteEntry = (entry: MigraineDay | UserEntry) => {
    if (isUserEntryFn(entry)) {
      deleteFromContext(entry.id);
    } else {
      setDeletedSampleDates((prev) => new Set(prev).add(format(entry.date, "yyyy-MM-dd")));
    }
    setSelectedDay(null);
  };

  // ---------- Quick add ----------
  const quickAdd = (day: Date, severity: number) => {
    const iso = format(day, "yyyy-MM-dd");
    const entry: UserEntry = {
      id: Date.now(),
      date: iso,
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
  };

  // ---------- Form ----------
  const openEditForm = (entry: UserEntry) => {
    setEditingEntry(entry);
    setFormDate(entry.date);
    setShowForm(true);
  };

  const handleFormSave = (e: UserEntry) => {
    if (editingEntry) {
      updateEntry(e);
    } else {
      addEntry(e);
    }
    setSelectedDay(null);
    setShowForm(false);
    setEditingEntry(undefined);

    const muted = localStorage.getItem("mute-medical-alerts") === "true";
    if (!muted) {
      const result = checkMedicalAlert(e);
      if (result.triggered) {
        setTimeout(() => setAlertResult(result), 50);
      }
    }
  };

  // ---------- Month stats ----------
  const monthMigraines = MIGRAINE_DATA.filter((m) => m.date >= monthStart && m.date <= monthEnd);
  const avgSeverity = monthMigraines.length
    ? (monthMigraines.reduce((a, m) => a + m.severity, 0) / monthMigraines.length).toFixed(1)
    : "—";

  const selectedMigraine = selectedDay ? getMigraineForDay(selectedDay) : undefined;
  const selectedWarning = selectedDay ? hasSameClassWarning(selectedDay) : null;

  // ---------- Quick getter helpers ----------
  const getWater = (m: MigraineDay | UserEntry) =>
    "waterMl" in m ? `${(m.waterMl / 1000).toFixed(1)}L` : m.water > 0 ? `${m.water} gl` : "—";
  const getStress = (m: MigraineDay | UserEntry) => ("stressLevel" in m ? m.stressLevel : m.stress);
  const getSleep = (m: MigraineDay | UserEntry) => ("sleepHours" in m ? m.sleepHours : m.sleep);
  const getCaffeine = (m: MigraineDay | UserEntry) => ("caffeinesMg" in m ? `${m.caffeinesMg}mg` : `${m.caffeine}mg`);
  const getSkipped = (m: MigraineDay | UserEntry) => ("skippedMeals" in m ? m.skippedMeals : m.skippedMeal);
  const getMeds = (m: MigraineDay | UserEntry) => {
    const meds = getMedStrings(m);
    return meds.length > 0 ? meds.join(", ") : null;
  };

  // ---------- Return JSX ----------
  return (
    <div className="space-y-6">
      {/* ... Keep the rest of your JSX as is ... */}
      {/* Make sure everywhere you used entry.date for comparison, it's ISO strings */}
      {/* e.g., when passing to LogMigraineForm, use ISO string format */}
    </div>
  );
}