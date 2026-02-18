import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, AlertTriangle, Activity, Brain, CheckCircle2,
  ChevronDown, ChevronUp, Info, GitCompareArrows, X,
} from "lucide-react";
import { MED_DB, type MedProfile } from "@/lib/medDb";

const ALL_MEDS = Object.values(MED_DB);

const ratingColor = (r: MedProfile["migraineRating"]) => {
  if (r === "first-line") return "bg-[hsl(var(--severity-low))]/15 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/30";
  if (r === "second-line") return "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30";
  if (r === "adjunct") return "bg-primary/10 text-primary border-primary/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
};

const typeColor = (t: MedProfile["type"]) => {
  if (t === "rescue") return "bg-destructive/10 text-destructive border-destructive/20";
  if (t === "preventive") return "bg-primary/10 text-primary border-primary/20";
  return "bg-muted text-muted-foreground";
};

function searchMeds(query: string): MedProfile[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_MEDS;
  return ALL_MEDS.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.brandNames.some((b) => b.toLowerCase().includes(q)) ||
      m.drugClass.toLowerCase().includes(q) ||
      (m.genericName?.toLowerCase().includes(q) ?? false)
  );
}


function lookupMed(name: string): MedProfile | null {
  const key = name.toLowerCase().replace(/\s+/g, "");
  return MED_DB[key] ?? Object.values(MED_DB).find(
    (m) => m.name.toLowerCase() === name.toLowerCase() ||
           m.brandNames.some((b) => b.toLowerCase() === name.toLowerCase())
  ) ?? null;
}


function sharedInteractions(a: MedProfile, b: MedProfile): string[] {
  const aLower = a.interactsWith.map((x) => x.toLowerCase());
  const bLower = b.interactsWith.map((x) => x.toLowerCase());

  const direct: string[] = [];
  // Check if a interacts with b's class/name
  if (aLower.some((x) => x.includes(b.name.toLowerCase()) || b.drugClass.toLowerCase().includes(x.split(" ")[0]))) {
    direct.push(`${a.name} lists ${b.name} (${b.drugClass}) in its interaction profile`);
  }
  if (bLower.some((x) => x.includes(a.name.toLowerCase()) || a.drugClass.toLowerCase().includes(x.split(" ")[0]))) {
    direct.push(`${b.name} lists ${a.name} (${a.drugClass}) in its interaction profile`);
  }
  // Both triptans within 24h
  if (a.drugClass.includes("Triptan") && b.drugClass.includes("Triptan")) {
    direct.push("Both are triptans — do NOT take within 24 hours of each other (serotonin risk + no added benefit)");
  }
  return direct;
}

function MedSelector({
  label,
  value,
  onSelect,
  excluding,
}: {
  label: string;
  value: MedProfile | null;
  onSelect: (m: MedProfile | null) => void;
  excluding?: MedProfile | null;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = searchMeds(query).filter((m) => m.name !== excluding?.name);

  return (
    <div className="flex-1 space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      {value ? (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-1.5 relative">
          <button
            onClick={() => onSelect(null)}
            className="absolute top-2 right-2 rounded-full p-0.5 hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <p className="font-semibold text-sm pr-5">{value.name}</p>
          {value.brandNames.length > 0 && (
            <p className="text-[10px] text-muted-foreground">{value.brandNames.join(", ")}</p>
          )}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColor(value.type)}`}>
              {value.type}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ratingColor(value.migraineRating)}`}>
              {value.migraineRating}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or brand…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="pl-8 text-sm"
          />
          {open && (
            <div className="absolute z-20 top-full mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden max-h-52 overflow-y-auto">
              {results.length === 0 ? (
                <p className="px-3 py-3 text-xs text-muted-foreground text-center">No medications found</p>
              ) : results.map((m) => (
                <button
                  key={m.name}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/30 last:border-0"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(m);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{m.name}</span>
                  {m.brandNames.length > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-1.5">({m.brandNames[0]})</span>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-0.5">{m.drugClass}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, a, b, highlight }: {
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 gap-3 py-3 border-b border-border/50 last:border-0 ${highlight ? "bg-[hsl(var(--warning))]/3 -mx-1 px-1 rounded" : ""}`}>
      <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground -mb-1">{label}</div>
      <div className="text-xs text-foreground leading-relaxed">{a ?? <span className="text-muted-foreground">—</span>}</div>
      <div className="text-xs text-foreground leading-relaxed">{b ?? <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function TagList({ items, color }: { items: string[]; color?: string }) {
  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {items.map((item, i) => (
        <span key={i} className={`text-[10px] rounded-full px-2 py-0.5 border ${color ?? "bg-muted text-muted-foreground border-transparent"}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

/** Single medication detail card shown when only one is selected */
function MedDetailCard({ med }: { med: MedProfile }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-base font-serif">{med.name}</p>
            {med.brandNames.length > 0 && (
              <p className="text-xs text-muted-foreground">{med.brandNames.join(", ")}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{med.drugClass}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={`text-[10px] ${typeColor(med.type)}`}>{med.type}</Badge>
            <Badge variant="outline" className={`text-[10px] ${ratingColor(med.migraineRating)}`}>{med.migraineRating}</Badge>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">How it works</p>
            <p className="leading-relaxed">{med.mechanism}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Migraine use</p>
            <p className="leading-relaxed">{med.migraineUse}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Dosing</p>
              <p className="leading-relaxed">{med.dosing}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Onset</p>
              <p className="font-medium">{med.onset}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Side effects</p>
            <TagList items={med.sideEffects} color="bg-destructive/8 text-destructive/80 border-destructive/15" />
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 pt-2 text-xs text-primary border-t border-border/40"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Hide" : "Show"} warnings, interactions & pregnancy safety
        </button>

        {expanded && (
          <div className="space-y-2 text-xs pt-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Warnings</p>
              <TagList items={med.warnings} color="bg-[hsl(var(--warning))]/8 text-[hsl(var(--warning))]/90 border-[hsl(var(--warning))]/20" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Contraindications</p>
              <TagList items={med.contraindications} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Interacts with</p>
              <TagList items={med.interactsWith} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Pregnancy</p>
              <p className="leading-relaxed">{med.pregnancy}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CompareMedications() {
  const [medA, setMedA] = useState<MedProfile | null>(null);
  const [medB, setMedB] = useState<MedProfile | null>(null);
  const [comparing, setComparing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const interactions = medA && medB ? sharedInteractions(medA, medB) : [];
  const sameClass = medA && medB && medA.drugClass === medB.drugClass;
  const bothSelected = !!medA && !!medB;
  const showComparison = bothSelected && comparing;

  const handleCompare = () => {
    if (bothSelected) setComparing(true);
  };

  const handleReset = () => {
    setMedA(null);
    setMedB(null);
    setComparing(false);
    setShowDetails(false);
  };

  const quickPick = (a: string, b: string) => {
    setMedA(lookupMed(a));
    setMedB(lookupMed(b));
    setComparing(true);
    setShowDetails(false);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Search any medication to view its profile, or select two to compare side-by-side.
      </p>

      {/* Search slots */}
      <div className="flex gap-3 items-start">
        <MedSelector
          label="Medication A"
          value={medA}
          onSelect={(m) => { setMedA(m); setComparing(false); }}
          excluding={medB}
        />
        <div className="pt-7 shrink-0 text-muted-foreground">
          <GitCompareArrows className="h-5 w-5" />
        </div>
        <MedSelector
          label="Medication B (optional)"
          value={medB}
          onSelect={(m) => { setMedB(m); setComparing(false); }}
          excluding={medA}
        />
      </div>

      {/* Action buttons */}
      {medA && (
        <div className="flex gap-2">
          {bothSelected && (
            <Button
              className="flex-1 flex items-center gap-2"
              onClick={handleCompare}
              disabled={showComparison}
            >
              <GitCompareArrows className="h-4 w-4" />
              {showComparison ? "Comparing…" : "Compare"}
            </Button>
          )}
          <Button variant="outline" className="flex items-center gap-2" onClick={handleReset}>
            <X className="h-4 w-4" /> Clear
          </Button>
        </div>
      )}

      {/* Quick compare presets */}
      {!medA && !medB && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Quick compare:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["Sumatriptan", "Rizatriptan"],
              ["Sumatriptan", "Ubrogepant"],
              ["Topiramate", "Propranolol"],
              ["Ibuprofen", "Naproxen"],
              ["Amitriptyline", "Topiramate"],
              ["Rimegepant", "Ubrogepant"],
              ["Erenumab", "Topiramate"],
            ].map(([a, b]) => (
              <button
                key={`${a}-${b}`}
                onClick={() => quickPick(a, b)}
                className="text-xs rounded-full border border-border bg-card px-3 py-1.5 hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                {a} vs {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single medication detail (only A selected, no compare yet) */}
      {medA && !showComparison && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {medB ? "Select both medications, then tap Compare" : "Medication profile"}
          </p>
          <MedDetailCard med={medA} />
          {medB && <MedDetailCard med={medB} />}
        </div>
      )}

      {/* Full comparison */}
      {showComparison && medA && medB && (
        <div className="space-y-4">
          {/* Header card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[medA, medB].map((med) => (
                  <div key={med.name} className="space-y-1.5">
                    <p className="font-semibold text-sm">{med.name}</p>
                    <p className="text-[10px] text-muted-foreground">{med.drugClass}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColor(med.type)}`}>{med.type}</Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ratingColor(med.migraineRating)}`}>{med.migraineRating}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {interactions.length > 0 && (
                <div className="rounded-lg bg-destructive/8 border border-destructive/25 p-3 space-y-1.5">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" /> Interaction Warning
                  </p>
                  {interactions.map((ix, i) => (
                    <p key={i} className="text-xs text-destructive/90 leading-relaxed">• {ix}</p>
                  ))}
                </div>
              )}

              {sameClass && (
                <div className="rounded-lg bg-[hsl(var(--warning))]/8 border border-[hsl(var(--warning))]/25 p-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-[hsl(var(--warning))]">
                    <AlertTriangle className="h-3.5 w-3.5" /> Same Drug Class
                  </p>
                  <p className="text-xs text-[hsl(var(--warning))]/90 mt-0.5 leading-relaxed">
                    Both belong to <strong>{medA.drugClass}</strong>. Discuss with your prescriber before combining or switching.
                  </p>
                </div>
              )}

              {interactions.length === 0 && !sameClass && (
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--severity-low))]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  No direct interaction flagged between these two medications.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side-by-side table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Side-by-Side Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-border mb-1">
                <p className="text-xs font-bold">{medA.name}</p>
                <p className="text-xs font-bold">{medB.name}</p>
              </div>
              <CompareRow label="How it works" a={medA.mechanism} b={medB.mechanism} />
              <CompareRow label="Migraine use" a={medA.migraineUse} b={medB.migraineUse} />
              <CompareRow label="Dosing" a={medA.dosing} b={medB.dosing} />
              <CompareRow label="Onset" a={<span className="font-medium">{medA.onset}</span>} b={<span className="font-medium">{medB.onset}</span>} />
              <CompareRow
                label="Common side effects"
                a={<TagList items={medA.sideEffects} color="bg-destructive/8 text-destructive/80 border-destructive/15" />}
                b={<TagList items={medB.sideEffects} color="bg-destructive/8 text-destructive/80 border-destructive/15" />}
              />

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-primary"
              >
                {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showDetails ? "Hide" : "Show"} warnings, contraindications & pregnancy
              </button>

              {showDetails && (
                <>
                  <CompareRow
                    label="⚠ Key warnings"
                    a={<TagList items={medA.warnings} color="bg-[hsl(var(--warning))]/8 text-[hsl(var(--warning))]/90 border-[hsl(var(--warning))]/20" />}
                    b={<TagList items={medB.warnings} color="bg-[hsl(var(--warning))]/8 text-[hsl(var(--warning))]/90 border-[hsl(var(--warning))]/20" />}
                    highlight
                  />
                  <CompareRow label="Contraindications" a={<TagList items={medA.contraindications} />} b={<TagList items={medB.contraindications} />} />
                  <CompareRow label="Interacts with" a={<TagList items={medA.interactsWith} />} b={<TagList items={medB.interactsWith} />} />
                  <CompareRow label="Pregnancy" a={medA.pregnancy} b={medB.pregnancy} highlight />
                </>
              )}
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-primary" /> Migraine Treatment Rating
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[medA, medB].map((med) => (
                  <div key={med.name} className={`rounded-lg border p-3 ${ratingColor(med.migraineRating)}`}>
                    <p className="text-xs font-semibold">{med.name}</p>
                    <p className="text-[11px] capitalize mt-0.5 font-medium">{med.migraineRating}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 text-[10px] text-muted-foreground px-1">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>For educational purposes only. Always consult your prescriber or pharmacist before starting, stopping, or combining medications.</p>
          </div>
        </div>
      )}
    </div>
  );
}

