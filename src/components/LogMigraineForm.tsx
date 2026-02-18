import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export const SYMPTOM_OPTIONS = ["Throbbing Pain", "Nausea", "Light Sensitivity", "Sound Sensitivity", "Aura", "Eye Pain", "Neck Tension", "Vomiting", "Dizziness", "Severe Head Pain"];
export const TRIGGER_OPTIONS = ["Stress", "Poor Sleep", "Caffeine", "Bright Light", "Skipped Meal", "Hormonal/Menstrual", "Rain/Pressure", "Travel", "Screen Time", "Alcohol"];
export const AREA_OPTIONS = ["Full Head", "Right Side", "Left Side", "Periorbital", "Occipital", "Right Orbital", "Forehead", "Temple"];
export const MED_OPTIONS = ["Sumatriptan", "Rizatriptan", "Ubrogepant", "Rimegepant", "Ibuprofen", "Naproxen", "Eletriptan", "Lasmiditan", "None"];

export interface UserEntry {
  id: number;
  date: string;
  severity: number;
  durationMin: number;
  area: string;
  symptoms: string[];
  triggers: string[];
  meds: string[];
  weather: string;
  sleep: number;
  caffeine: number;
  stress: string;
  skippedMeal: boolean;
  notes: string;
  isUserEntry: true;
}

interface Props {
  onSave: (e: UserEntry) => void;
  onClose: () => void;
  initialDate?: string;
}

export default function LogMigraineForm({ onSave, onClose, initialDate }: Props) {
  const today = new Date();
  const dateLabel = initialDate ?? today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const [severity, setSeverity] = useState(5);
  const [area, setArea] = useState("Full Head");
  const [durationHours, setDurationHours] = useState(1);
  const [durationMins, setDurationMins] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [meds, setMeds] = useState<string[]>([]);
  const [sleep, setSleep] = useState(7);
  const [caffeine, setCaffeine] = useState(0);
  const [notes, setNotes] = useState("");
  const [skippedMeal, setSkippedMeal] = useState(false);

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleSave = () => {
    onSave({
      id: Date.now(),
      date: dateLabel,
      severity,
      durationMin: durationHours * 60 + durationMins,
      area,
      symptoms,
      triggers,
      meds: meds.filter((m) => m !== "None"),
      weather: "—",
      sleep,
      caffeine,
      stress: severity >= 8 ? "Very High" : severity >= 5 ? "High" : "Moderate",
      skippedMeal,
      notes,
      isUserEntry: true,
    });
    onClose();
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
            <div className="flex flex-wrap gap-1.5">
              {AREA_OPTIONS.map((a) => (
                <button key={a} onClick={() => setArea(a)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all border ${area === a ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Symptoms</Label>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOM_OPTIONS.map((s) => (
                <button key={s} onClick={() => toggle(symptoms, s, setSymptoms)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all border ${symptoms.includes(s) ? "bg-primary/15 text-primary border-primary/40" : "bg-muted text-muted-foreground border-transparent"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Triggers */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Possible triggers</Label>
            <div className="flex flex-wrap gap-1.5">
              {TRIGGER_OPTIONS.map((t) => (
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
              {MED_OPTIONS.map((m) => (
                <button key={m} onClick={() => toggle(meds, m, setMeds)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all border ${meds.includes(m) ? "bg-[hsl(var(--severity-low))]/15 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/40" : "bg-muted text-muted-foreground border-transparent"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep + Caffeine */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Sleep last night (h)</Label>
              <Input type="number" min={0} max={24} step={0.5} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Caffeine (mg)</Label>
              <Input type="number" min={0} max={1000} value={caffeine} onChange={(e) => setCaffeine(Number(e.target.value))} />
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

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Notes (optional)</Label>
            <Input placeholder="Any additional context…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={symptoms.length === 0 && triggers.length === 0}>
            Save Entry
          </Button>
          {symptoms.length === 0 && triggers.length === 0 && (
            <p className="text-[10px] text-center text-muted-foreground -mt-3">Select at least one symptom or trigger to save</p>
          )}
        </div>
      </div>
    </div>
  );
}
