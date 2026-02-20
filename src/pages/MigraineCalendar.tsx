import { useState } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, subDays, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Brain, Clock, Droplets, Wind, Pill, Plus, Trash2, AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import LogMigraineForm, { UserEntry } from "@/components/LogMigraineForm";
import MedicalAlertDialog, { checkMedicalAlert, AlertResult } from "@/components/MedicalAlertDialog";
import {SAMPLE_MIGRAINE_DATA, SampleEntry} from "@/lib/sampleMigraineData";
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
function getMedStrings(m: SampleEntry | UserEntry): string[] {
  return m.meds ?? [];
}

const MIGRAINE_DATA = SAMPLE_MIGRAINE_DATA;

export default function MigraineCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [userEntries, setUserEntries] = useState<UserEntry[]>([]);
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

  const getMigraineForDay = (day: Date): SampleEntry | UserEntry | undefined => {
    const iso = format(day, "yyyy-MM-dd");
    const sampleEntry = MIGRAINE_DATA.find((m) => m.isoDate === iso);
    if (sampleEntry && deletedSampleDates.has(iso)) return userEntries.find((e) => e.date === format(day, "MMM d"));
    return sampleEntry ?? userEntries.find((e) => e.date === format(day, "MMM d"));
  };

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

  const deleteEntry = (entry: SampleEntry | UserEntry) => {
    if (isUserEntryFn(entry)) {
      setUserEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } else {
      setDeletedSampleDates((prev) => new Set(prev).add(format(entry.date, "yyyy-MM-dd")));
    }
    setSelectedDay(null);
  };


  const monthIsoStart = format(monthStart, "yyyy-MM-dd");
  const monthIsoEnd = format(monthEnd, "yyyy-MM-dd");
  const sampleMigrainesInMonth = MIGRAINE_DATA.filter((m) => m.isoDate >= monthIsoStart && m.isoDate <= monthIsoEnd && !deletedSampleDates.has(m.isoDate));
  // Count user entries that fall in this month by matching their "MMM d" date label to days in month
  const userEntriesInMonth = userEntries.filter((e) => {
    return daysInMonth.some((day) => format(day, "MMM d") === e.date);
  });
  const allMigrainesInMonth = [...sampleMigrainesInMonth, ...userEntriesInMonth];
  const monthMigraineCount = allMigrainesInMonth.length;
  const avgSeverity = monthMigraineCount
    ? (allMigrainesInMonth.reduce((a, m) => a + m.severity, 0) / monthMigraineCount).toFixed(1)
    : "—";

  const selectedMigraine = selectedDay ? getMigraineForDay(selectedDay) : undefined;
  const selectedWarning = selectedDay ? hasSameClassWarning(selectedDay) : null;


  const getWater = (m: SampleEntry | UserEntry) => m.water > 0 ? `${m.water} gl` : "—";
  const getStress = (m: SampleEntry | UserEntry) => m.stress;
  const getSleep = (m: SampleEntry | UserEntry) => m.sleep;
  const getCaffeine = (m: SampleEntry | UserEntry) => `${m.caffeine}mg`;
  const getSkipped = (m: SampleEntry | UserEntry) => m.skippedMeal;
  const getMeds = (m: SampleEntry | UserEntry) => {
    const meds = getMedStrings(m);
    return meds.length > 0 ? meds.join(", ") : null;
  };
  const isUserEntryFn = (m: SampleEntry | UserEntry): m is UserEntry => "isUserEntry" in m;

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
    setUserEntries([entry, ...userEntries]);
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
      setUserEntries([e, ...userEntries]);
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
            <p className="text-2xl font-bold font-serif">{monthMigraineCount}</p>
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
            <p className="text-2xl font-bold font-serif">{daysInMonth.length - monthMigraineCount}</p>
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
          open = {showForm}
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


