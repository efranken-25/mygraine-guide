import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, AlertTriangle, Zap, Activity, Brain, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Info, GitCompareArrows, X,
} from "lucide-react";

/* ─── Static medication database ──────────────────────────── */
interface MedProfile {
  name: string;
  genericName?: string;
  brandNames: string[];
  drugClass: string;
  type: "rescue" | "preventive" | "supplement" | "other";
  mechanism: string;
  migraineUse: string;
  dosing: string;
  onset: string;
  sideEffects: string[];
  warnings: string[];
  contraindications: string[];
  interactsWith: string[];
  pregnancy: string;
  migraineRating: "first-line" | "second-line" | "adjunct" | "not-recommended";
}

const MED_DB: Record<string, MedProfile> = {
  sumatriptan: {
    name: "Sumatriptan",
    brandNames: ["Imitrex", "Tosymra"],
    drugClass: "Triptan (5-HT₁B/₁D agonist)",
    type: "rescue",
    mechanism: "Selectively activates serotonin 5-HT₁B/₁D receptors, causing vasoconstriction of dilated intracranial vessels and inhibiting nociceptive neurotransmission.",
    migraineUse: "Acute treatment of migraine with or without aura. Most effective when taken early in attack.",
    dosing: "50–100mg oral; 6mg subcutaneous; 5–20mg nasal spray. Max 200mg/day.",
    onset: "30–60 min oral; ~15 min subcutaneous",
    sideEffects: ["Chest tightness/pressure", "Tingling/flushing", "Dizziness", "Fatigue", "Nausea", "Injection site reactions (SC)"],
    warnings: ["Cardiovascular risk — avoid with CAD, uncontrolled hypertension", "Medication overuse headache (>10 days/month)", "Serotonin syndrome risk with SSRIs/SNRIs"],
    contraindications: ["Hemiplegic/basilar migraine", "Ischemic heart disease", "Uncontrolled HTN", "Within 24h of another triptan or ergot"],
    interactsWith: ["MAOIs", "SSRIs/SNRIs (serotonin syndrome)", "Ergotamines", "Other triptans"],
    pregnancy: "Pregnancy Category C — limited data; use only if clearly needed.",
    migraineRating: "first-line",
  },
  rizatriptan: {
    name: "Rizatriptan",
    brandNames: ["Maxalt", "Maxalt-MLT"],
    drugClass: "Triptan (5-HT₁B/₁D agonist)",
    type: "rescue",
    mechanism: "Same mechanism as sumatriptan; higher oral bioavailability (~45%) and faster CNS penetration.",
    migraineUse: "Acute migraine treatment. Faster onset than oral sumatriptan, useful for rapid relief.",
    dosing: "5–10mg oral or ODT. Max 30mg/day. Reduce to 5mg if on propranolol.",
    onset: "~30 min (faster than sumatriptan oral)",
    sideEffects: ["Somnolence", "Dizziness", "Nausea", "Chest/throat tightness", "Dry mouth"],
    warnings: ["Same cardiovascular precautions as sumatriptan", "Dose reduction needed with propranolol (CYP interaction)", "Medication overuse headache"],
    contraindications: ["Same as sumatriptan", "Within 24h of another triptan"],
    interactsWith: ["Propranolol (increases rizatriptan exposure ~70%)", "MAOIs", "SSRIs/SNRIs", "Ergotamines"],
    pregnancy: "Pregnancy Category C.",
    migraineRating: "first-line",
  },
  ubrogepant: {
    name: "Ubrogepant",
    brandNames: ["Ubrelvy"],
    drugClass: "CGRP receptor antagonist (gepant)",
    type: "rescue",
    mechanism: "Blocks the calcitonin gene-related peptide (CGRP) receptor, interrupting the pain-signaling cascade in migraine without vasoconstriction.",
    migraineUse: "Acute migraine. Safe in patients with cardiovascular contraindications to triptans. Can be used same day as preventive CGRP inhibitors.",
    dosing: "50–100mg oral. Second dose (50–100mg) after ≥2h if needed. Max 200mg/24h.",
    onset: "~60 min",
    sideEffects: ["Nausea", "Somnolence", "Dry mouth"],
    warnings: ["CYP3A4 interactions — avoid strong CYP3A4 inducers/inhibitors", "Hepatic impairment may require dose adjustment"],
    contraindications: ["Strong CYP3A4 inhibitors (e.g., clarithromycin, ketoconazole)"],
    interactsWith: ["CYP3A4 inhibitors (increase exposure)", "CYP3A4 inducers (reduce efficacy)", "Lecanemab"],
    pregnancy: "No adequate human data; animal studies show embryotoxicity at high doses.",
    migraineRating: "second-line",
  },
  rimegepant: {
    name: "Rimegepant",
    brandNames: ["Nurtec ODT"],
    drugClass: "CGRP receptor antagonist (gepant)",
    type: "rescue",
    mechanism: "CGRP receptor blockade. Unique among gepants — approved for BOTH acute and preventive migraine use (every-other-day dosing for prevention).",
    migraineUse: "Acute migraine AND preventive therapy (75mg every other day). Only drug FDA-approved for both indications.",
    dosing: "75mg ODT. For acute: single dose. For prevention: 75mg every other day.",
    onset: "~60 min",
    sideEffects: ["Nausea", "Abdominal pain (rare)", "Hypersensitivity reactions"],
    warnings: ["CYP3A4/P-gp substrate — multiple drug interactions", "Hepatic impairment: avoid in severe cases"],
    contraindications: ["Strong CYP3A4 inhibitors", "Severe hepatic impairment"],
    interactsWith: ["CYP3A4 inhibitors/inducers", "P-glycoprotein inhibitors"],
    pregnancy: "No adequate human data.",
    migraineRating: "second-line",
  },
  topiramate: {
    name: "Topiramate",
    brandNames: ["Topamax", "Trokendi XR", "Qudexy XR"],
    drugClass: "Antiepileptic (sulfamate-substituted monosaccharide)",
    type: "preventive",
    mechanism: "Multiple mechanisms: Na⁺/Ca²⁺ channel blockade, GABA-A potentiation, AMPA/kainate antagonism, carbonic anhydrase inhibition.",
    migraineUse: "First-line preventive therapy. Reduces migraine frequency by ~50% in responders. Takes 2–3 months for full effect.",
    dosing: "25mg nightly, titrate slowly to 50–100mg/day in divided doses. Slow titration reduces side effects.",
    onset: "Preventive effect: 6–12 weeks",
    sideEffects: ["Cognitive slowing/word-finding difficulty ('Dopamax')", "Paresthesias (toes/fingers)", "Weight loss", "Kidney stones", "Fatigue", "Nausea", "Mood changes"],
    warnings: ["Teratogenic — avoid in pregnancy (neural tube defects)", "Metabolic acidosis", "Acute myopia/glaucoma (rare but serious)", "Cognitive impairment"],
    contraindications: ["Pregnancy (Category D)", "Recent metabolic acidosis"],
    interactsWith: ["Oral contraceptives (reduces efficacy)", "Lithium", "Carbonic anhydrase inhibitors (kidney stone risk)", "Valproate (encephalopathy risk)"],
    pregnancy: "Category D — significant teratogen; strongly avoid.",
    migraineRating: "first-line",
  },
  propranolol: {
    name: "Propranolol",
    brandNames: ["Inderal", "Inderal LA", "InnoPran XL"],
    drugClass: "Non-selective beta-blocker",
    type: "preventive",
    mechanism: "Non-selective β₁/β₂ blockade reduces sympathetic tone; may stabilize cortical spreading depression and reduce vasoreactivity.",
    migraineUse: "First-line preventive therapy. Also treats comorbid hypertension, angina, anxiety, and essential tremor.",
    dosing: "40–240mg/day (IR in 2–3 divided doses; LA once daily). Start 40mg BID, titrate monthly.",
    onset: "Preventive effect: 4–8 weeks",
    sideEffects: ["Fatigue/lethargy", "Cold extremities", "Bradycardia", "Depression/mood changes", "Vivid dreams", "Exercise intolerance", "Weight gain"],
    warnings: ["Abrupt discontinuation → rebound angina/hypertension", "Masks hypoglycemia symptoms in diabetics", "Bronchospasm in asthma/COPD"],
    contraindications: ["Asthma/reactive airway disease", "Heart block > 1st degree", "Severe bradycardia", "Decompensated HF", "Raynaud's syndrome"],
    interactsWith: ["Rizatriptan (increases rizatriptan exposure 70%)", "Calcium channel blockers", "Antidiabetics", "MAOIs", "Digoxin"],
    pregnancy: "Category C — crosses placenta; neonatal bradycardia/hypoglycemia possible.",
    migraineRating: "first-line",
  },
  amitriptyline: {
    name: "Amitriptyline",
    brandNames: ["Elavil"],
    drugClass: "Tricyclic antidepressant (TCA)",
    type: "preventive",
    mechanism: "Inhibits norepinephrine and serotonin reuptake; strong anticholinergic and antihistamine activity. Central pain-modulation via descending pathways.",
    migraineUse: "Preventive migraine therapy (off-label). Particularly useful in patients with comorbid insomnia, depression, or chronic daily headache.",
    dosing: "10–25mg nightly; titrate to 75–150mg/night as tolerated. Low doses effective for migraine.",
    onset: "4–8 weeks for preventive effect",
    sideEffects: ["Sedation/morning grogginess", "Dry mouth", "Constipation", "Weight gain", "Urinary retention", "Blurred vision", "Orthostatic hypotension", "Cardiac arrhythmias (at high doses)"],
    warnings: ["QTc prolongation at high doses — ECG monitoring advised", "Anticholinergic toxicity in elderly", "Serotonin syndrome risk"],
    contraindications: ["Recent MI", "Heart block", "Narrow-angle glaucoma", "Within 14 days of MAOIs"],
    interactsWith: ["MAOIs (serotonin syndrome/hypertensive crisis)", "SSRIs/SNRIs", "Anticholinergics", "CNS depressants", "QT-prolonging drugs"],
    pregnancy: "Category C — neonatal withdrawal reported.",
    migraineRating: "second-line",
  },
  erenumab: {
    name: "Erenumab",
    brandNames: ["Aimovig"],
    drugClass: "Anti-CGRP receptor monoclonal antibody",
    type: "preventive",
    mechanism: "Humanized IgG2 monoclonal antibody that blocks the CGRP receptor. Monthly subcutaneous injection. Highly specific with minimal systemic drug interactions.",
    migraineUse: "Preventive therapy for episodic and chronic migraine. First FDA-approved CGRP antibody. Reduces migraine days/month.",
    dosing: "70mg SC monthly (may increase to 140mg monthly if inadequate response).",
    onset: "Response often seen within 1 month; full assessment at 3–6 months",
    sideEffects: ["Injection site reactions", "Constipation (dose-dependent, can be severe)", "Hypertension (rare)", "Muscle spasm"],
    warnings: ["Serious constipation — may require treatment", "Limited long-term safety data in cardiovascular disease"],
    contraindications: ["Known hypersensitivity to erenumab"],
    interactsWith: ["Minimal — biological with few cytochrome interactions"],
    pregnancy: "No adequate data — IgG antibodies cross placenta in 2nd/3rd trimester; generally avoided.",
    migraineRating: "second-line",
  },
  ibuprofen: {
    name: "Ibuprofen",
    brandNames: ["Advil", "Motrin"],
    drugClass: "NSAID (non-selective COX inhibitor)",
    type: "rescue",
    mechanism: "Non-selective inhibition of COX-1 and COX-2 reduces prostaglandin synthesis, decreasing neuroinflammation and sensitization.",
    migraineUse: "Effective for mild-to-moderate migraine. Often first-line in patients with infrequent attacks. Lower risk of MOH vs. triptans.",
    dosing: "400–800mg at onset. Repeat 400mg after 6h if needed. Max 1200mg/day for OTC use.",
    onset: "~30–60 min",
    sideEffects: ["GI irritation/ulcers", "Renal impairment", "Fluid retention", "Hypertension", "Cardiovascular risk with chronic use", "Headache rebound with overuse"],
    warnings: ["GI bleeding risk — take with food", "Avoid in renal impairment", "Increased CV risk with chronic use", "Medication overuse headache >15 days/month"],
    contraindications: ["Active GI bleeding/ulcer", "Severe renal/hepatic impairment", "Late pregnancy (Category D after 30 weeks)"],
    interactsWith: ["Anticoagulants (bleeding risk)", "Lithium (increases levels)", "ACE inhibitors", "Corticosteroids", "Other NSAIDs"],
    pregnancy: "Category C (Category D after 30 weeks) — avoid in 3rd trimester.",
    migraineRating: "first-line",
  },
  naproxen: {
    name: "Naproxen",
    brandNames: ["Aleve", "Naprosyn", "Anaprox"],
    drugClass: "NSAID (non-selective COX inhibitor)",
    type: "rescue",
    mechanism: "COX-1/COX-2 inhibition; longer half-life (~12–17h) than ibuprofen allows twice-daily dosing.",
    migraineUse: "Acute migraine; also used preventively (naproxen sodium 550mg BID for menstrual migraine prevention).",
    dosing: "500–550mg at onset; may repeat 500mg after 1h. Max 1000mg/day acute use.",
    onset: "~1–2h (slower than ibuprofen but longer duration)",
    sideEffects: ["GI effects (similar to ibuprofen)", "Headache rebound", "Fluid retention", "Dizziness"],
    warnings: ["Same GI/CV/renal precautions as ibuprofen", "Longer half-life increases accumulation risk"],
    contraindications: ["Same as ibuprofen"],
    interactsWith: ["Same as ibuprofen"],
    pregnancy: "Category C/D (3rd trimester).",
    migraineRating: "first-line",
  },
};

const ALL_MED_NAMES = Object.values(MED_DB).map((m) => m.name);

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

function MedSelector({ label, value, onSelect }: {
  label: string;
  value: MedProfile | null;
  onSelect: (m: MedProfile | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = query.length > 1
    ? ALL_MED_NAMES.filter((n) => n.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="flex-1 space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      {value ? (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-1.5 relative">
          <button
            onClick={() => onSelect(null)}
            className="absolute top-2 right-2 rounded-full p-0.5 hover:bg-muted"
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
            placeholder="Search medication…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="pl-8 text-sm"
          />
          {open && results.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full rounded-lg border border-border bg-card shadow-md overflow-hidden">
              {results.map((name) => (
                <button
                  key={name}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const m = lookupMed(name);
                    if (m) { onSelect(m); setQuery(""); setOpen(false); }
                  }}
                >
                  {name}
                  <span className="text-[10px] text-muted-foreground ml-1.5">
                    {lookupMed(name)?.drugClass}
                  </span>
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
    <div className={`grid grid-cols-[1fr_1fr] gap-3 py-3 border-b border-border/50 ${highlight ? "bg-[hsl(var(--warning))]/3" : ""}`}>
      <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground -mb-1">{label}</div>
      <div className="text-xs text-foreground leading-relaxed">{a}</div>
      <div className="text-xs text-foreground leading-relaxed">{b}</div>
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

export default function CompareMedications() {
  const [medA, setMedA] = useState<MedProfile | null>(null);
  const [medB, setMedB] = useState<MedProfile | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const interactions = medA && medB ? sharedInteractions(medA, medB) : [];
  const sameClass = medA && medB && medA.drugClass === medB.drugClass;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Select two medications to compare their profiles, side effects, and interactions side-by-side.
      </p>

      {/* Selectors */}
      <div className="flex gap-3 items-start">
        <MedSelector label="Medication A" value={medA} onSelect={setMedA} />
        <div className="pt-7 shrink-0">
          <GitCompareArrows className="h-5 w-5 text-muted-foreground" />
        </div>
        <MedSelector label="Medication B" value={medB} onSelect={setMedB} />
      </div>

      {/* Quick picks */}
      {(!medA || !medB) && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Quick compare:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["Sumatriptan", "Rizatriptan"],
              ["Sumatriptan", "Ubrogepant"],
              ["Topiramate", "Propranolol"],
              ["Ibuprofen", "Naproxen"],
              ["Amitriptyline", "Topiramate"],
            ].map(([a, b]) => (
              <button
                key={`${a}-${b}`}
                onClick={() => { setMedA(lookupMed(a)); setMedB(lookupMed(b)); }}
                className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-muted transition-colors"
              >
                {a} vs {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison output */}
      {medA && medB && (
        <div className="space-y-4">
          {/* Header comparison */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
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

              {/* Interaction alert */}
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
                <div className="rounded-lg bg-[hsl(var(--warning))]/8 border border-[hsl(var(--warning))]/25 p-3 mt-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-[hsl(var(--warning))]">
                    <AlertTriangle className="h-3.5 w-3.5" /> Same Drug Class
                  </p>
                  <p className="text-xs text-[hsl(var(--warning))]/90 mt-0.5 leading-relaxed">
                    Both belong to the <strong>{medA.drugClass}</strong> class. Generally should not be combined — discuss with your prescriber before switching or adding one to the other.
                  </p>
                </div>
              )}

              {interactions.length === 0 && !sameClass && (
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--severity-low))] mt-1">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  No direct interaction flagged between these two medications in our database.
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
            <CardContent className="p-4 pt-0 space-y-0">
              {/* Column headers */}
              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-border mb-1">
                <p className="text-xs font-bold">{medA.name}</p>
                <p className="text-xs font-bold">{medB.name}</p>
              </div>

              <CompareRow
                label="How it works"
                a={medA.mechanism}
                b={medB.mechanism}
              />
              <CompareRow
                label="Migraine use"
                a={medA.migraineUse}
                b={medB.migraineUse}
              />
              <CompareRow
                label="Dosing"
                a={medA.dosing}
                b={medB.dosing}
              />
              <CompareRow
                label="Onset of action"
                a={<span className="font-medium">{medA.onset}</span>}
                b={<span className="font-medium">{medB.onset}</span>}
              />
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
                  <CompareRow
                    label="Contraindications"
                    a={<TagList items={medA.contraindications} />}
                    b={<TagList items={medB.contraindications} />}
                  />
                  <CompareRow
                    label="Interacts with"
                    a={<TagList items={medA.interactsWith} />}
                    b={<TagList items={medB.interactsWith} />}
                  />
                  <CompareRow
                    label="Pregnancy"
                    a={medA.pregnancy}
                    b={medB.pregnancy}
                    highlight
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Migraine rating */}
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

          {/* Disclaimer */}
          <div className="flex items-start gap-2 text-[10px] text-muted-foreground px-1">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>This comparison is for educational purposes only and is not a substitute for advice from your prescriber or pharmacist. Always consult a healthcare professional before starting, stopping, or combining medications.</p>
          </div>
        </div>
      )}
    </div>
  );
}
