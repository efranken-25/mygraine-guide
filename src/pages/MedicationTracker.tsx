import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pill, Plus, Clock, Archive, ChevronDown, ChevronUp, X, AlertTriangle, ShieldAlert } from "lucide-react";

// ── Drug-class definitions for duplicate/conflict detection ──────────────────
const DRUG_CLASSES: { class: string; label: string; members: string[] }[] = [
  {
    class: "triptan",
    label: "Triptan (5-HT₁ agonist)",
    members: [
      "sumatriptan", "rizatriptan", "zolmitriptan", "eletriptan",
      "naratriptan", "frovatriptan", "almotriptan", "avitriptan",
    ],
  },
  {
    class: "ergotamine",
    label: "Ergotamine / Ergot alkaloid",
    members: ["ergotamine", "dihydroergotamine", "dhe", "cafergot", "migranal"],
  },
  {
    class: "gepant",
    label: "CGRP Receptor Antagonist (Gepant)",
    members: ["ubrogepant", "rimegepant", "atogepant", "zavegepant"],
  },
  {
    class: "nsaid",
    label: "NSAID",
    members: ["ibuprofen", "naproxen", "aspirin", "diclofenac", "ketorolac", "indomethacin", "celecoxib"],
  },
  {
    class: "opioid",
    label: "Opioid",
    members: ["codeine", "tramadol", "hydrocodone", "oxycodone", "morphine", "fentanyl", "butorphanol"],
  },
];

function getDrugClass(name: string) {
  const lower = name.toLowerCase();
  return DRUG_CLASSES.find((dc) => dc.members.some((m) => lower.includes(m)));
}

// Returns conflicts: other active meds in the same drug class
function findClassConflicts(targetName: string, allMeds: { name: string; active: boolean }[]) {
  const dc = getDrugClass(targetName);
  if (!dc) return null;
  const conflicts = allMeds.filter(
    (m) => m.active && m.name.toLowerCase() !== targetName.toLowerCase() && getDrugClass(m.name)?.class === dc.class
  );
  return conflicts.length > 0 ? { drugClass: dc, conflicts } : null;
}

// Detect if multiple same-class rescue meds have been logged (trend warning)
function detectSameClassTrend(meds: { name: string; classification: string; logs: { time: string }[] }[]) {
  const warnings: string[] = [];
  for (const dc of DRUG_CLASSES) {
    const logsWithClass = meds.filter(
      (m) => (m.classification === "Acute/Rescue" || m.classification === "Pain Relief") &&
        getDrugClass(m.name)?.class === dc.class && m.logs.length > 0
    );
    if (logsWithClass.length > 1) {
      warnings.push(
        `Multiple ${dc.label} medications logged today: ${logsWithClass.map((m) => m.name).join(" & ")}. ` +
        `Taking two medications from the same class within 24 hours is not recommended and may increase side effects. ` +
        `Please contact your prescriber.`
      );
    }
  }
  return warnings;
}

const CLASSIFICATIONS = [
  "Migraine Prevention",
  "Acute/Rescue",
  "Pain Relief",
  "Anti-Nausea",
  "Blood Pressure",
  "Antidepressant",
  "Anti-Seizure",
  "Muscle Relaxant",
  "Supplement",
  "Other",
];

// Supplement subtypes — shown only when Classification = Supplement
const SUPPLEMENT_SUBTYPES: Record<string, string[]> = {
  Magnesium: [
    "Magnesium Glycinate",
    "Magnesium Oxide",
    "Magnesium Citrate",
    "Magnesium Malate",
    "Magnesium Threonate",
    "Magnesium Taurate",
    "Magnesium Chloride",
    "Magnesium Sulfate (Epsom)",
  ],
  "Vitamin B2 (Riboflavin)": ["Riboflavin 400mg"],
  "Coenzyme Q10": ["CoQ10 – Ubiquinol", "CoQ10 – Ubiquinone"],
  "Omega-3": ["Fish Oil", "Algal Oil (Vegan)"],
  Melatonin: ["Melatonin 0.5mg", "Melatonin 1mg", "Melatonin 3mg", "Melatonin 5mg", "Melatonin 10mg"],
  "Vitamin D": ["Vitamin D3", "Vitamin D2"],
  Other: ["Other Supplement"],
};

const SUPPLEMENT_BASE_NAMES = Object.keys(SUPPLEMENT_SUBTYPES);

type Medication = {
  id: number;
  name: string;
  dosage: string;
  classification: string;
  frequency: string;
  active: boolean;
  logs: { time: string }[];
};

const MOCK_MEDS: Medication[] = [
  { id: 1, name: "Topiramate", dosage: "50mg", classification: "Migraine Prevention", frequency: "Daily", active: true, logs: [{ time: "8:00 AM" }, { time: "8:00 PM" }] },
  { id: 2, name: "Sumatriptan", dosage: "100mg", classification: "Acute/Rescue", frequency: "As needed", active: true, logs: [{ time: "2:30 PM" }] },
  { id: 3, name: "Magnesium Glycinate", dosage: "400mg", classification: "Supplement", frequency: "Daily", active: true, logs: [{ time: "9:00 AM" }] },
  { id: 4, name: "Propranolol", dosage: "80mg", classification: "Migraine Prevention", frequency: "Daily", active: false, logs: [] },
  { id: 5, name: "Amitriptyline", dosage: "25mg", classification: "Migraine Prevention", frequency: "Nightly", active: false, logs: [] },
  { id: 6, name: "Valproate", dosage: "500mg", classification: "Migraine Prevention", frequency: "Daily", active: false, logs: [] },
];

function classColor(c: string) {
  if (c === "Migraine Prevention") return "bg-primary/10 text-primary border-primary/20";
  if (c === "Acute/Rescue") return "bg-destructive/10 text-destructive border-destructive/20";
  if (c === "Supplement") return "bg-[hsl(var(--severity-low))]/10 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/20";
  return "bg-secondary text-secondary-foreground";
}

export default function MedicationTracker() {
  const [meds, setMeds] = useState<Medication[]>(MOCK_MEDS);
  const [showForm, setShowForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  // Conflict/warning state
  const [activeConflict, setActiveConflict] = useState<{ message: string; conflictingMed: string; targetId: number } | null>(null);
  const [addConflictWarning, setAddConflictWarning] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [classification, setClassification] = useState("");
  const [frequency, setFrequency] = useState("");
  const [supplementBase, setSupplementBase] = useState("");
  const [supplementSubtype, setSupplementSubtype] = useState("");

  const isSupplementClass = classification === "Supplement";
  const subtypeOptions = supplementBase ? SUPPLEMENT_SUBTYPES[supplementBase] ?? [] : [];
  const resolvedName = isSupplementClass
    ? supplementSubtype || supplementBase || name
    : name;

  const activeMeds = meds.filter((m) => m.active);
  const inactiveMeds = meds.filter((m) => !m.active);
  const totalPreventivesTried = meds.filter((m) => m.classification === "Migraine Prevention").length;
  const activePreventives = meds.filter((m) => m.classification === "Migraine Prevention" && m.active).length;
  const discontinuedPreventives = totalPreventivesTried - activePreventives;

  // Detect same-class dose logging trend
  const sameClassTrendWarnings = detectSameClassTrend(meds);

  const resetForm = () => {
    setName(""); setDosage(""); setClassification(""); setFrequency("");
    setSupplementBase(""); setSupplementSubtype("");
    setAddConflictWarning(null);
  };

  const addMed = () => {
    if (!resolvedName || !classification) return;
    // Check for same-class conflict before adding
    const conflict = findClassConflicts(resolvedName, meds);
    if (conflict) {
      setAddConflictWarning(
        `${resolvedName} is a ${conflict.drugClass.label} — the same class as your active medication${conflict.conflicts.length > 1 ? "s" : ""} ` +
        `(${conflict.conflicts.map(c => c.name).join(", ")}). ` +
        `Taking two medications from the same class is generally not recommended. ` +
        `Please consult your prescriber before adding this.`
      );
      return; // block save unless they confirm below
    }
    commitAddMed();
  };

  const commitAddMed = () => {
    setMeds([...meds, { id: Date.now(), name: resolvedName, dosage, classification, frequency, active: true, logs: [] }]);
    resetForm();
    setShowForm(false);
  };

  const toggleActive = (id: number) => {
    const med = meds.find((m) => m.id === id);
    if (!med) return;
    const isActivating = !med.active;
    if (isActivating) {
      // Check if activating creates a same-class conflict
      const conflict = findClassConflicts(med.name, meds.filter((m) => m.id !== id));
      if (conflict) {
        setActiveConflict({
          message:
            `${med.name} is a ${conflict.drugClass.label} — the same class as currently active ` +
            `${conflict.conflicts.map(c => c.name).join(", ")}. ` +
            `Using two ${conflict.drugClass.label}s simultaneously or within 24 hours is not recommended and may increase the risk of side effects. ` +
            `Consider deactivating the other medication first, or consult your prescriber.`,
          conflictingMed: conflict.conflicts.map(c => c.name).join(", "),
          targetId: id,
        });
        return;
      }
    }
    setMeds(meds.map((m) => m.id === id ? { ...m, active: isActivating, logs: isActivating ? m.logs : [] } : m));
  };

  const forceToggleActive = (id: number) => {
    const med = meds.find((m) => m.id === id);
    if (!med) return;
    setMeds(meds.map((m) => m.id === id ? { ...m, active: !med.active, logs: !med.active ? m.logs : [] } : m));
    setActiveConflict(null);
  };

  const logDose = (id: number) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMeds(meds.map((m) => m.id === id ? { ...m, logs: [...m.logs, { time: now }] } : m));
  };

  const removeDose = (medId: number, doseIndex: number) => {
    setMeds(meds.map((m) => m.id === medId ? { ...m, logs: m.logs.filter((_, i) => i !== doseIndex) } : m));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
          <p className="text-muted-foreground">Track your medications & doses</p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* ── Same-class dose trend warnings ── */}
      {sameClassTrendWarnings.map((w, i) => (
        <Alert key={i} className="border-destructive/40 bg-destructive/5">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-sm font-semibold text-destructive">Same-Class Medication Alert</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground leading-relaxed">{w}</AlertDescription>
        </Alert>
      ))}

      {/* ── Activation conflict modal-style alert ── */}
      {activeConflict && (
        <Alert className="border-destructive/40 bg-destructive/5">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-sm font-semibold text-destructive">Same-Class Conflict Detected</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground leading-relaxed mt-1 space-y-2">
            <p>{activeConflict.message}</p>
            <div className="flex gap-2 flex-wrap pt-1">
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => forceToggleActive(activeConflict.targetId)}>
                Activate anyway
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setActiveConflict(null)}>
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Preventives tried counter */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Preventive Medications Tried</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xl font-bold font-serif text-primary">{totalPreventivesTried}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold font-serif text-[hsl(var(--severity-low))]">{activePreventives}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold font-serif text-muted-foreground">{discontinuedPreventives}</p>
                <p className="text-[10px] text-muted-foreground">Stopped</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Medication / Supplement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Classification first so we can show smart fields */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Classification</Label>
              <Select value={classification} onValueChange={(v) => {
                setClassification(v);
                setSupplementBase("");
                setSupplementSubtype("");
                setName("");
              }}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {CLASSIFICATIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplement-specific flow */}
            {isSupplementClass ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Supplement Type</Label>
                  <Select value={supplementBase} onValueChange={(v) => {
                    setSupplementBase(v);
                    setSupplementSubtype("");
                  }}>
                    <SelectTrigger><SelectValue placeholder="e.g. Magnesium, Vitamin B2…" /></SelectTrigger>
                    <SelectContent>
                      {SUPPLEMENT_BASE_NAMES.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {supplementBase && subtypeOptions.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Specific Form{" "}
                      <span className="text-muted-foreground/60">(e.g. Glycinate vs Oxide)</span>
                    </Label>
                    <Select value={supplementSubtype} onValueChange={setSupplementSubtype}>
                      <SelectTrigger><SelectValue placeholder="Select specific form" /></SelectTrigger>
                      <SelectContent>
                        {subtypeOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(supplementSubtype || supplementBase) && (
                  <p className="text-xs text-muted-foreground bg-muted rounded px-2 py-1.5">
                    Will be saved as: <span className="font-medium text-foreground">{supplementSubtype || supplementBase}</span>
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Medication Name</Label>
                <Input placeholder="e.g. Topiramate" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Dosage</Label>
                <Input placeholder="e.g. 400mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Frequency</Label>
                <Input placeholder="e.g. Daily" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
              </div>
            </div>


            {/* Add conflict warning inside the form */}
            {addConflictWarning && (
              <Alert className="border-destructive/40 bg-destructive/5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-xs font-semibold text-destructive">Same-Class Conflict</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground leading-relaxed mt-1 space-y-2">
                  <p>{addConflictWarning}</p>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={commitAddMed}>Add anyway</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddConflictWarning(null)}>Cancel</Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!addConflictWarning && (
              <div className="flex gap-2">
                <Button onClick={addMed} disabled={!resolvedName || !classification} className="flex-1">Save</Button>
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active medications */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Active Medications</h2>
        {activeMeds.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No active medications</p>
        )}
        {activeMeds.map((med) => (
          <Card key={med.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  <span className="font-medium">{med.name}</span>
                  {med.dosage && <span className="text-sm text-muted-foreground">{med.dosage}</span>}
                </div>
                <Switch checked={med.active} onCheckedChange={() => toggleActive(med.id)} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className={`text-xs ${classColor(med.classification)}`}>{med.classification}</Badge>
                {med.frequency && <Badge variant="secondary" className="text-xs">{med.frequency}</Badge>}
                {getDrugClass(med.name) && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60 bg-muted/30">
                    {getDrugClass(med.name)!.label}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {med.logs.length > 0
                    ? med.logs.map((l, i) => (
                        <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">
                          {l.time}
                          <button
                            onClick={() => removeDose(med.id, i)}
                            className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors p-0.5"
                            aria-label={`Remove dose at ${l.time}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    : <span className="text-xs text-muted-foreground">No doses logged today</span>
                  }
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => logDose(med.id)} className="text-xs h-7">
                    Log Dose
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Discontinued medications */}
      {inactiveMeds.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 text-lg font-semibold w-full text-left"
          >
            Discontinued ({inactiveMeds.length})
            {showInactive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showInactive && inactiveMeds.map((med) => (
            <Card key={med.id} className="opacity-60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">{med.name}</span>
                    {med.dosage && <span className="text-sm text-muted-foreground">{med.dosage}</span>}
                  </div>
                  <Switch checked={med.active} onCheckedChange={() => toggleActive(med.id)} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">{med.classification}</Badge>
                  {med.frequency && <Badge variant="secondary" className="text-xs">{med.frequency}</Badge>}
                  <Badge variant="secondary" className="text-xs text-muted-foreground">Discontinued</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
