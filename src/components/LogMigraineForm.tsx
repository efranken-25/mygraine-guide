import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import HeadMap, { HEAD_AREAS } from "@/components/HeadMap";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SYMPTOM_DEFINITIONS: Record<string, string> = {
  "Throbbing Pain": "Heartbeat-like pulsing in your head",
  "Nausea": "Feeling like you might throw up",
  "Light Sensitivity": "Bright lights hurt your eyes",
  "Sound Sensitivity": "Sounds feel painfully loud",
  "Aura": "Seeing flashes, zigzags, or blind spots",
  "Eye Pain": "Pain behind or around your eyes",
  "Neck Tension": "Tight, stiff feeling in your neck",
  "Vomiting": "Actually throwing up",
  "Dizziness": "Feeling unsteady or spinning",
  "Severe Head Pain": "Very intense, debilitating head pain",
};

export const SYMPTOM_OPTIONS = ["Throbbing Pain", "Nausea", "Light Sensitivity", "Sound Sensitivity", "Aura", "Eye Pain", "Neck Tension", "Vomiting", "Dizziness", "Severe Head Pain"];
export const TRIGGER_OPTIONS = ["Stress", "Poor Sleep", "Caffeine", "Bright Light", "Skipped Meal", "Hormonal/Menstrual", "Rain/Pressure", "Travel", "Screen Time", "Alcohol"];
export const AREA_OPTIONS = HEAD_AREAS.map(a => a.label);
export const MED_OPTIONS = ["Sumatriptan", "Rizatriptan", "Ubrogepant", "Rimegepant", "Ibuprofen", "Naproxen", "Eletriptan", "Lasmiditan", "None"];

export interface MedEffectiveness {
  helped: "yes" | "partial" | "no" | null;
  timeToReliefMin: number | null;
}

export interface UserEntry {
  id: number;
  date: string;
  severity: number;
  durationMin: number;
  area: string;
  symptoms: string[];
  triggers: string[];
  meds: string[];
  medEffectiveness?: Record<string, MedEffectiveness>;
  hormonalStatus?: string[];
  weather: string;
  sleep: number;
  caffeine: number;
  water: number;
  stress: string;
  skippedMeal: boolean;
  notes: string;
  isUserEntry: true;
}

interface Props {
  onSave: (e: UserEntry) => void;
  onClose: () => void;
  initialDate?: string;
  initialEntry?: UserEntry;
}

export default function LogMigraineForm({ onSave, onClose, initialDate, initialEntry }: Props) {
  const today = new Date();
  const dateLabel = initialDate ?? initialEntry?.date ?? today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const [severity, setSeverity] = useState(initialEntry?.severity ?? 5);
  const [areas, setAreas] = useState<string[]>(initialEntry ? [initialEntry.area] : ["full"]);
  const [durationHours, setDurationHours] = useState(initialEntry ? Math.floor(initialEntry.durationMin / 60) : 1);
  const [durationMins, setDurationMins] = useState(initialEntry ? initialEntry.durationMin % 60 : 0);
  const [symptoms, setSymptoms] = useState<string[]>(initialEntry?.symptoms ?? []);
  const [triggers, setTriggers] = useState<string[]>(initialEntry?.triggers ?? []);
  const [meds, setMeds] = useState<string[]>(initialEntry?.meds ?? []);
  const [caffeine, setCaffeine] = useState(initialEntry?.caffeine ?? 0);
  const [water, setWater] = useState(initialEntry?.water ?? 0);
  const [notes, setNotes] = useState(initialEntry?.notes ?? "");
  const [caffeineUnknown, setCaffeineUnknown] = useState(false);
  const [waterUnknown, setWaterUnknown] = useState(false);
  const [skippedMeal, setSkippedMeal] = useState(initialEntry?.skippedMeal ?? false);
  const [hormonalStatus, setHormonalStatus] = useState<string[]>(initialEntry?.hormonalStatus ?? []);
  const [medEffectiveness, setMedEffectiveness] = useState<Record<string, MedEffectiveness>>(initialEntry?.medEffectiveness ?? {});

  const activeMeds = meds.filter((m) => m !== "None");

  const setMedHelped = (med: string, helped: "yes" | "partial" | "no") => {
    setMedEffectiveness((prev) => ({
      ...prev,
      [med]: { ...prev[med], helped, timeToReliefMin: prev[med]?.timeToReliefMin ?? null },
    }));
  };

  const setMedTime = (med: string, val: number | null) => {
    setMedEffectiveness((prev) => ({
      ...prev,
      [med]: { ...prev[med], helped: prev[med]?.helped ?? null, timeToReliefMin: val },
    }));
  };

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleSave = () => {
    const areaLabel = areas.map(id => HEAD_AREAS.find(a => a.id === id)?.label ?? id).join(", ") || "Full Head";
    const filteredMeds = meds.filter((m) => m !== "None");
    const filteredEffectiveness: Record<string, MedEffectiveness> = {};
    filteredMeds.forEach((m) => {
      if (medEffectiveness[m]) filteredEffectiveness[m] = medEffectiveness[m];
    });
    onSave({
      id: initialEntry?.id ?? Date.now(),
      date: dateLabel,
      severity,
      durationMin: durationHours * 60 + durationMins,
      area: areaLabel,
      symptoms,
      triggers,
      meds: filteredMeds,
      medEffectiveness: Object.keys(filteredEffectiveness).length ? filteredEffectiveness : undefined,
      weather: initialEntry?.weather ?? "—",
      sleep: initialEntry?.sleep ?? 0,
      caffeine,
      water,
      stress: severity >= 8 ? "Very High" : severity >= 5 ? "High" : "Moderate",
      skippedMeal,
      hormonalStatus: hormonalStatus.length > 0 ? hormonalStatus : undefined,
      notes,
      isUserEntry: true,
    });
    // onClose is handled by the parent after processing the entry
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div
        className="bg-background rounded-t-2xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-serif">Log a Migraine</h2>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pain severity: <span className="font-bold text-destructive">{severity} / 10</span></Label>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button
                  key={n}
                  onClick={() => setSeverity(n)}
                  className={`flex-1 h-8 rounded text-xs font-bold transition-all ${
                    n <= severity
                      ? n <= 3 ? "bg-[hsl(var(--severity-low))] text-white" : n <= 6 ? "bg-[hsl(var(--severity-mid))] text-white" : "bg-destructive text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Duration</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input type="number" min={0} max={72} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="text-center" />
                <p className="text-[10px] text-muted-foreground text-center mt-1">hours</p>
              </div>
              <span className="text-muted-foreground pb-4">:</span>
              <div className="flex-1">
                <Input type="number" min={0} max={59} value={durationMins} onChange={(e) => setDurationMins(Number(e.target.value))} className="text-center" />
                <p className="text-[10px] text-muted-foreground text-center mt-1">minutes</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Location</Label>
            <HeadMap value={areas} onChange={setAreas} multi />
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Symptoms</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  if (symptoms.includes("Unknown")) {
                    setSymptoms([]);
                  } else {
                    setSymptoms(["Unknown"]);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                  symptoms.includes("Unknown")
                    ? "bg-muted-foreground/20 text-foreground border-muted-foreground/40"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                I don't know
              </button>
              {!symptoms.includes("Unknown") && (
                <TooltipProvider delayDuration={300}>
                  {SYMPTOM_OPTIONS.map((s) => (
                    <Tooltip key={s}>
                      <TooltipTrigger asChild>
                        <button onClick={() => toggle(symptoms, s, setSymptoms)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all border ${symptoms.includes(s) ? "bg-primary/15 text-primary border-primary/40" : "bg-muted text-muted-foreground border-transparent"}`}>
                          {s}
                        </button>
                      </TooltipTrigger>
                      {SYMPTOM_DEFINITIONS[s] && (
                        <TooltipContent side="top">
                          <p>{SYMPTOM_DEFINITIONS[s]}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Triggers */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Possible triggers</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  if (triggers.includes("Unknown")) {
                    setTriggers([]);
                  } else {
                    setTriggers(["Unknown"]);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                  triggers.includes("Unknown")
                    ? "bg-muted-foreground/20 text-foreground border-muted-foreground/40"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                I don't know
              </button>
              {!triggers.includes("Unknown") && TRIGGER_OPTIONS.map((t) => (
                <button key={t} onClick={() => toggle(triggers, t, setTriggers)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all border ${triggers.includes(t) ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/40" : "bg-muted text-muted-foreground border-transparent"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rescue meds taken */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Rescue medications taken</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  if (meds.includes("Unknown")) {
                    setMeds([]);
                  } else {
                    setMeds(["Unknown"]);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                  meds.includes("Unknown")
                    ? "bg-muted-foreground/20 text-foreground border-muted-foreground/40"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                I don't know
              </button>
              {!meds.includes("Unknown") && MED_OPTIONS.map((m) => (
                <button key={m} onClick={() => toggle(meds, m, setMeds)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all border ${meds.includes(m) ? "bg-[hsl(var(--severity-low))]/15 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/40" : "bg-muted text-muted-foreground border-transparent"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Medication effectiveness — shown when meds selected */}
          {activeMeds.length > 0 && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <Label className="text-sm font-semibold">Medication effectiveness</Label>
              {activeMeds.map((med) => {
                const eff = medEffectiveness[med];
                return (
                  <div key={med} className="space-y-2 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs font-medium text-foreground">{med}</p>

                    {/* Did it help? */}
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground">Did this medication help?</p>
                      <div className="flex gap-2">
                        {(["yes", "partial", "no"] as const).map((opt) => {
                          const labels = { yes: "✓ Yes", partial: "〜 Partial", no: "✗ No" };
                          const colors = {
                            yes: eff?.helped === "yes" ? "bg-[hsl(var(--severity-low))]/20 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/50" : "bg-muted text-muted-foreground border-transparent",
                            partial: eff?.helped === "partial" ? "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/50" : "bg-muted text-muted-foreground border-transparent",
                            no: eff?.helped === "no" ? "bg-destructive/15 text-destructive border-destructive/40" : "bg-muted text-muted-foreground border-transparent",
                          };
                          return (
                            <button
                              key={opt}
                              onClick={() => setMedHelped(med, opt)}
                              className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${colors[opt]}`}
                            >
                              {labels[opt]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time to relief — only if helped */}
                    {(eff?.helped === "yes" || eff?.helped === "partial") && (
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">Time to relief (minutes)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[15, 30, 45, 60, 90, 120].map((t) => (
                            <button
                              key={t}
                              onClick={() => setMedTime(med, eff?.timeToReliefMin === t ? null : t)}
                              className={`px-3 py-1 rounded-full text-[11px] border transition-all ${
                                eff?.timeToReliefMin === t
                                  ? "bg-primary/15 text-primary border-primary/40"
                                  : "bg-muted text-muted-foreground border-transparent"
                              }`}
                            >
                              {t}m
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Caffeine + Water */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Caffeine (mg)</Label>
              {caffeineUnknown ? (
                <button
                  onClick={() => setCaffeineUnknown(false)}
                  className="w-full px-2 py-2 rounded-md text-[10px] bg-muted-foreground/20 text-foreground border border-muted-foreground/40 text-center"
                >
                  Unknown ✕
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <Input type="number" min={0} max={1000} value={caffeine} onChange={(e) => setCaffeine(Number(e.target.value))} className="flex-1" />
                  <button onClick={() => setCaffeineUnknown(true)} className="px-1.5 py-1 rounded-md text-[10px] bg-muted text-muted-foreground border border-transparent hover:border-muted-foreground/30 shrink-0">?</button>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Water (glasses)</Label>
              {waterUnknown ? (
                <button
                  onClick={() => setWaterUnknown(false)}
                  className="w-full px-2 py-2 rounded-md text-[10px] bg-muted-foreground/20 text-foreground border border-muted-foreground/40 text-center"
                >
                  Unknown ✕
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <Input type="number" min={0} max={20} value={water} onChange={(e) => setWater(Number(e.target.value))} className="flex-1" />
                  <button onClick={() => setWaterUnknown(true)} className="px-1.5 py-1 rounded-md text-[10px] bg-muted text-muted-foreground border border-transparent hover:border-muted-foreground/30 shrink-0">?</button>
                </div>
              )}
            </div>
          </div>

          {/* Skipped meal */}
          <button
            onClick={() => setSkippedMeal(!skippedMeal)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${skippedMeal ? "bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/30 text-[hsl(var(--warning))]" : "bg-muted border-transparent text-muted-foreground"}`}
          >
            <span>Skipped a meal today?</span>
            <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${skippedMeal ? "bg-[hsl(var(--warning))] border-[hsl(var(--warning))]" : "border-muted-foreground"}`}>
              {skippedMeal && <span className="text-white text-[10px]">✓</span>}
            </span>
          </button>

          {/* Hormonal status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Hormonal status</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  if (hormonalStatus.includes("N/A")) {
                    setHormonalStatus([]);
                  } else {
                    setHormonalStatus(["N/A"]);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                  hormonalStatus.includes("N/A")
                    ? "bg-muted-foreground/20 text-foreground border-muted-foreground/40"
                    : "bg-muted text-muted-foreground border-transparent"
                }`}
              >
                Not applicable
              </button>
              {!hormonalStatus.includes("N/A") && ["Menstruating", "Ovulating", "Luteal", "Pregnant", "Breastfeeding", "Menopausal"].map((status) => (
                <button
                  key={status}
                  onClick={() => toggle(hormonalStatus, status, setHormonalStatus)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                    hormonalStatus.includes(status)
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "bg-muted text-muted-foreground border-transparent"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            {hormonalStatus.includes("N/A") && (
              <p className="text-[10px] text-muted-foreground">Hormonal tracking disabled for this entry</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Notes (optional)</Label>
            <Input placeholder="Any additional context…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleSave}>
            Save Entry
          </Button>
        </div>
      </div>
    </div>
  );
}
