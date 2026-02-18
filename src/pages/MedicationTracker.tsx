import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Plus, Trash2, Clock } from "lucide-react";

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

type Medication = {
  id: number;
  name: string;
  dosage: string;
  classification: string;
  frequency: string;
  logs: { time: string }[];
};

const MOCK_MEDS: Medication[] = [
  { id: 1, name: "Topiramate", dosage: "50mg", classification: "Migraine Prevention", frequency: "Daily", logs: [{ time: "8:00 AM" }, { time: "8:00 PM" }] },
  { id: 2, name: "Sumatriptan", dosage: "100mg", classification: "Acute/Rescue", frequency: "As needed", logs: [{ time: "2:30 PM" }] },
  { id: 3, name: "Magnesium", dosage: "400mg", classification: "Supplement", frequency: "Daily", logs: [{ time: "9:00 AM" }] },
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
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [classification, setClassification] = useState("");
  const [frequency, setFrequency] = useState("");

  const addMed = () => {
    if (!name || !classification) return;
    setMeds([...meds, { id: Date.now(), name, dosage, classification, frequency, logs: [] }]);
    setName(""); setDosage(""); setClassification(""); setFrequency("");
    setShowForm(false);
  };

  const removeMed = (id: number) => setMeds(meds.filter((m) => m.id !== id));

  const logDose = (id: number) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMeds(meds.map((m) => m.id === id ? { ...m, logs: [...m.logs, { time: now }] } : m));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
          <p className="text-muted-foreground">Track your medications & doses</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Medication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Medication name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Dosage (e.g. 50mg)" value={dosage} onChange={(e) => setDosage(e.target.value)} />
              <Input placeholder="Frequency (e.g. Daily)" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
            </div>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger>
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                {CLASSIFICATIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={addMed} disabled={!name || !classification} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {meds.map((med) => (
          <Card key={med.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  <span className="font-medium">{med.name}</span>
                  {med.dosage && <span className="text-sm text-muted-foreground">{med.dosage}</span>}
                </div>
                <button onClick={() => removeMed(med.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className={`text-xs ${classColor(med.classification)}`}>{med.classification}</Badge>
                {med.frequency && <Badge variant="secondary" className="text-xs">{med.frequency}</Badge>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {med.logs.length > 0
                    ? <span>Logged: {med.logs.map((l) => l.time).join(", ")}</span>
                    : <span>No doses logged today</span>
                  }
                </div>
                <Button size="sm" variant="outline" onClick={() => logDose(med.id)} className="text-xs h-7">
                  Log Dose
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
