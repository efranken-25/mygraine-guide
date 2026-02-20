import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, XCircle, AlertTriangle, Lightbulb,
  Activity, FileText, ChevronRight, Info, Database,
} from "lucide-react";
import { lookupPA, PA_DRUGS, type PALookupEntry } from "@/lib/paLookup";

/* ─── Types ──────────────────────────────────────────── */
interface PAFormData {
  drugName: string;
  migraineDaysPerMonth: string;
  insurancePlanType: string;
  stepTherapyComplete: boolean;
  previousDrugsTried: string[];
  priorPAHistory: string;
  clinicalNotes: string;
}

interface ScoreFactor {
  label: string;
  impact: number;
  description: string;
  positive: boolean;
}

interface PAResult {
  score: number;
  baseRate: number;
  lookup: PALookupEntry;
  factors: ScoreFactor[];
  recommendations: string[];
  requirementsMet: RequirementCheck[];
}

interface RequirementCheck {
  label: string;
  required: string;
  userValue: string;
  met: boolean;
}

/* ─── Previous drugs (for checkboxes) ───────────────── */
const PREVIOUS_DRUGS = {
  "OTC / First-line": [
    { id: "ibuprofen",      label: "Ibuprofen (Advil)" },
    { id: "naproxen",       label: "Naproxen (Aleve)" },
    { id: "aspirin",        label: "Aspirin / Excedrin" },
    { id: "acetaminophen",  label: "Acetaminophen (Tylenol)" },
  ],
  "Triptans": [
    { id: "Sumatriptan",  label: "Sumatriptan (Imitrex)" },
    { id: "Rizatriptan",  label: "Rizatriptan (Maxalt)" },
    { id: "Zolmitriptan", label: "Zolmitriptan (Zomig)" },
    { id: "Eletriptan",   label: "Eletriptan (Relpax)" },
  ],
  "Preventive": [
    { id: "Topiramate",    label: "Topiramate (Topamax)" },
    { id: "Propranolol",   label: "Propranolol (Inderal)" },
    { id: "Amitriptyline", label: "Amitriptyline (Elavil)" },
    { id: "Venlafaxine",   label: "Venlafaxine (Effexor)" },
  ],
};

/* ─── Scoring engine (data-driven) ──────────────────── */
function calculatePAScore(form: PAFormData, lookup: PALookupEntry): PAResult {
  const req = lookup.typicalRequirements;
  const userDays = parseInt(form.migraineDaysPerMonth) || 0;
  const userTried = form.previousDrugsTried.length;

  // Base rate comes directly from the real data
  let score = lookup.avgApprovalRate;
  const baseRate = lookup.avgApprovalRate;
  const factors: ScoreFactor[] = [];

  // ── 1. Migraine frequency vs. requirement ──
  if (userDays >= req.minMigraineDays) {
    const surplus = userDays - req.minMigraineDays;
    const bonus = surplus >= 7 ? 8 : surplus >= 3 ? 5 : 2;
    score += bonus;
    factors.push({
      label: `Migraine frequency meets threshold`,
      impact: bonus,
      description: `You have ${userDays} days/month — plan typically requires ${req.minMigraineDays}+`,
      positive: true,
    });
  } else if (userDays > 0) {
    const gap = req.minMigraineDays - userDays;
    const penalty = gap >= 6 ? -18 : gap >= 3 ? -12 : -6;
    score += penalty;
    factors.push({
      label: `Below migraine frequency threshold`,
      impact: penalty,
      description: `You have ${userDays} days/month — plan requires ${req.minMigraineDays}+. Gap of ${gap} days.`,
      positive: false,
    });
  }

  // ── 2. Failed preventives vs. requirement ──
  if (userTried >= req.failedPreventivesCount) {
    const bonus = userTried > req.failedPreventivesCount ? 8 : 5;
    score += bonus;
    factors.push({
      label: `Failed medications documented`,
      impact: bonus,
      description: `You tried ${userTried} prior medication(s) — plan requires ${req.failedPreventivesLabel}`,
      positive: true,
    });
  } else {
    const gap = req.failedPreventivesCount - userTried;
    const penalty = gap >= 2 ? -18 : -10;
    score += penalty;
    factors.push({
      label: `Insufficient failed medications documented`,
      impact: penalty,
      description: `You tried ${userTried} — plan requires ${req.failedPreventivesLabel}. Need ${gap} more.`,
      positive: false,
    });
  }

  // ── 3. Step therapy ──
  if (req.stepTherapyRequired && form.stepTherapyComplete) {
    score += 7;
    factors.push({
      label: "Step therapy completed",
      impact: 7,
      description: "You've satisfied the step therapy requirement for this plan",
      positive: true,
    });
  } else if (req.stepTherapyRequired && !form.stepTherapyComplete) {
    score -= 14;
    factors.push({
      label: "Step therapy not completed",
      impact: -14,
      description: "This plan requires documented step therapy before approving this drug",
      positive: false,
    });
  }

  // ── 4. Prior PA history ──
  if (form.priorPAHistory === "approved") {
    score += 10;
    factors.push({
      label: "Prior PA approved for this drug",
      impact: 10,
      description: "Prior approval for the same drug significantly improves chances",
      positive: true,
    });
  } else if (form.priorPAHistory === "denied") {
    score -= 14;
    factors.push({
      label: "Prior PA was denied",
      impact: -14,
      description: "Previous denial requires directly addressing the reason for refusal",
      positive: false,
    });
  }

  // ── 5. Plan type adjustment ──
  if (form.insurancePlanType === "medicaid") {
    score -= 4;
    factors.push({
      label: "Medicaid plan",
      impact: -4,
      description: "State Medicaid programs typically enforce stricter step therapy requirements",
      positive: false,
    });
  } else if (form.insurancePlanType === "commercial") {
    score += 2;
    factors.push({
      label: "Commercial insurance",
      impact: 2,
      description: "Commercial plans generally have slightly more flexible PA criteria",
      positive: true,
    });
  }

  // ── 6. Clinical notes ──
  if (form.clinicalNotes.trim().length > 50) {
    score += 3;
    factors.push({
      label: "Clinical notes provided",
      impact: 3,
      description: "Supporting clinical context strengthens the medical necessity case",
      positive: true,
    });
  }

  score = Math.max(5, Math.min(95, Math.round(score * 10) / 10));

  // ── Requirements checklist ──
  const requirementsMet: RequirementCheck[] = [
    {
      label: "Migraine frequency",
      required: `${req.minMigraineDays}+ days/month`,
      userValue: userDays > 0 ? `${userDays} days/month` : "Not entered",
      met: userDays >= req.minMigraineDays,
    },
    {
      label: "Failed medications",
      required: req.failedPreventivesLabel,
      userValue: userTried > 0 ? `${userTried} documented` : "None documented",
      met: userTried >= req.failedPreventivesCount,
    },
    {
      label: "Step therapy",
      required: "Completed",
      userValue: form.stepTherapyComplete ? "Completed" : "Not completed",
      met: form.stepTherapyComplete,
    },
  ];

  // ── Recommendations ──
  const recommendations: string[] = [];

  if (userDays < req.minMigraineDays && userDays > 0) {
    recommendations.push(
      `Track migraines daily for 30+ days and document ${req.minMigraineDays}+ migraine days per month — your current ${userDays} days/month falls below the threshold for this drug.`
    );
  }
  if (userTried < req.failedPreventivesCount) {
    const needed = req.failedPreventivesCount - userTried;
    recommendations.push(
      `Document ${needed} more failed medication(s) with dates, dosages, and reasons for failure or intolerance. This plan requires ${req.failedPreventivesLabel}.`
    );
  }
  if (req.stepTherapyRequired && !form.stepTherapyComplete) {
    recommendations.push(
      `Complete the required step therapy. Try a first-line triptan (e.g., Sumatriptan or Rizatriptan) for at least ${req.trialDurationWeeks} weeks and document the outcome before resubmitting.`
    );
  }
  if (form.priorPAHistory === "denied") {
    recommendations.push(
      "Request a peer-to-peer review between your neurologist and the insurer's medical director — this reverses approximately 40% of initial denials."
    );
    recommendations.push(
      "File a formal appeal citing AHS/AAN clinical practice guidelines that support this medication for your diagnosis."
    );
  }

  // Denial-reason-specific recommendations
  const topDenial = Object.entries(lookup.denialReasons)
    .sort((a, b) => b[1] - a[1])[0][0];
  if (topDenial === "missingDocs") {
    recommendations.push(
      `The #1 denial reason for this drug (${lookup.denialReasons.missingDocs}% of denials) is missing documentation. Ensure all records — diagnosis, treatment history, and clinical notes — are submitted together.`
    );
  } else if (topDenial === "insufficientTrial") {
    recommendations.push(
      `The #1 denial reason for this drug (${lookup.denialReasons.insufficientTrial}% of denials) is insufficient trial duration. Prior medications must have been tried for at least ${req.trialDurationWeeks} weeks.`
    );
  }

  if (score < 60) {
    recommendations.push(
      "Ask your prescriber to include a detailed letter of medical necessity explaining why alternatives failed or are contraindicated for you specifically."
    );
    recommendations.push(
      "Contact the drug manufacturer's patient support hub — Aimovig, Nurtec, Ubrelvy, and other specialty drugs all have PA assistance programs that can help."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Your profile looks strong. Ensure all documentation is complete and submitted together to avoid administrative delays."
    );
  }

  return { score, baseRate, lookup, factors, recommendations, requirementsMet };
}

/* ─── Gauge SVG ──────────────────────────────────────── */
function ScoreGauge({ score }: { score: number }) {
  const angle = (1 - score / 100) * Math.PI;
  const ex = 100 + 80 * Math.cos(angle);
  const ey = 100 - 80 * Math.sin(angle);
  const nx = 100 + 62 * Math.cos(angle);
  const ny = 100 - 62 * Math.sin(angle);
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Likely Approved" : score >= 50 ? "Uncertain" : "Likely Denied";
  const arcPath = score > 2 ? `M 20 100 A 80 80 0 0 0 ${ex.toFixed(2)} ${ey.toFixed(2)}` : "";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 200 112" className="w-52">
        <path d="M 20 100 A 80 80 0 0 0 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
        {arcPath && <path d={arcPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />}
        <line x1="100" y1="100" x2={nx.toFixed(2)} y2={ny.toFixed(2)} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="100" r="5" fill={color} />
        <text x="16" y="115" fontSize="9" fill="hsl(var(--muted-foreground))">0%</text>
        <text x="172" y="115" fontSize="9" fill="hsl(var(--muted-foreground))">100%</text>
        <text x="100" y="86" textAnchor="middle" fontSize="26" fontWeight="700" fill={color}>{score}%</text>
      </svg>
      <Badge style={{ backgroundColor: color, color: "#fff", borderColor: color }} className="text-sm font-semibold px-3 py-1">
        {label}
      </Badge>
    </div>
  );
}

/* ─── Denial Reason Bar ──────────────────────────────── */
function DenialBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ─── Drug Select grouped ────────────────────────────── */
const DRUG_GROUPS = PA_DRUGS.reduce<Record<string, typeof PA_DRUGS[number][]>>((acc, d) => {
  if (!acc[d.group]) acc[d.group] = [];
  acc[d.group].push(d);
  return acc;
}, {});

/* ─── Main Component ─────────────────────────────────── */
const DEFAULT_FORM: PAFormData = {
  drugName: "",
  migraineDaysPerMonth: "",
  insurancePlanType: "",
  stepTherapyComplete: false,
  previousDrugsTried: [],
  priorPAHistory: "never",
  clinicalNotes: "",
};

export default function PAInsurance() {
  const [form, setForm] = useState<PAFormData>(DEFAULT_FORM);
  const [result, setResult] = useState<PAResult | null>(null);

  const activeLookup = form.drugName && form.insurancePlanType
    ? lookupPA(form.drugName, form.insurancePlanType)
    : null;

  const handleDrugToggle = (drugId: string, checked: boolean) => {
    setForm(f => ({
      ...f,
      previousDrugsTried: checked
        ? [...f.previousDrugsTried, drugId]
        : f.previousDrugsTried.filter(d => d !== drugId),
    }));
  };

  const handleEstimate = () => {
    // Fall back to commercial data for plan types not in dataset (medicare, marketplace)
    const lookup = activeLookup ?? lookupPA(form.drugName, "commercial");
    if (!lookup) return;
    const r = calculatePAScore(form, lookup);
    setResult(r);
    setTimeout(() => document.getElementById("pa-result")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const canEstimate = !!(form.drugName && form.insurancePlanType && form.migraineDaysPerMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">PA Approval Estimator</h2>
          <p className="text-sm text-muted-foreground">
            Estimate your prior authorization chances before your doctor submits. Powered by real PA outcome data.
          </p>
        </div>
        <Badge variant="outline" className="ml-auto text-xs shrink-0 gap-1 flex items-center">
          <Database className="h-3 w-3" /> Real Data
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ══ FORM ══ */}
        <div className="space-y-4">

          {/* Step 1 — Drug + Frequency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Requested Medication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Drug being requested</Label>
                <Select value={form.drugName} onValueChange={v => setForm(f => ({ ...f, drugName: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select medication…" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DRUG_GROUPS).map(([group, drugs]) => (
                      <div key={group}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group}</div>
                        {drugs.map(d => (
                          <SelectItem key={d.value} value={d.value} className="text-sm">{d.label}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Migraine days per month</Label>
                <Input
                  type="number" min="1" max="31" placeholder="e.g. 8"
                  value={form.migraineDaysPerMonth}
                  onChange={e => setForm(f => ({ ...f, migraineDaysPerMonth: e.target.value }))}
                  className="text-sm"
                />
                {activeLookup && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0" />
                    This plan typically requires <strong className="mx-0.5">{activeLookup.typicalRequirements.minMigraineDays}+</strong> days/month
                  </p>
                )}
              </div>

              {/* Live requirements preview */}
              {activeLookup && (
                <div className="rounded-md border bg-muted/40 p-3 space-y-1.5 text-xs">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">Typical plan requirements</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">Min. migraine days</span><span className="font-medium">{activeLookup.typicalRequirements.minMigraineDays}/month</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Failed preventives needed</span><span className="font-medium">{activeLookup.typicalRequirements.failedPreventivesLabel}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Required trial duration</span><span className="font-medium">{activeLookup.typicalRequirements.trialDurationWeeks} weeks</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Historical approval rate</span><span className="font-semibold text-primary">{activeLookup.avgApprovalRate}%</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2 — Insurance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                Insurance Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label className="text-xs">Plan type</Label>
                <Select value={form.insurancePlanType} onValueChange={v => setForm(f => ({ ...f, insurancePlanType: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select plan type…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial / Employer</SelectItem>
                    <SelectItem value="marketplace">Marketplace / ACA</SelectItem>
                    <SelectItem value="medicare">Medicare Part D</SelectItem>
                    <SelectItem value="medicaid">Medicaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 — Treatment History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                Treatment History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Medications already tried (check all)</Label>
                {Object.entries(PREVIOUS_DRUGS).map(([group, drugs]) => (
                  <div key={group} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground mt-2">{group}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {drugs.map(drug => (
                        <label key={drug.id} className="flex items-center gap-2 text-xs cursor-pointer rounded-md border p-2 hover:bg-muted/50 transition-colors">
                          <Checkbox
                            checked={form.previousDrugsTried.includes(drug.id)}
                            onCheckedChange={c => handleDrugToggle(drug.id, !!c)}
                          />
                          <span>{drug.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {activeLookup && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Info className="h-3 w-3 shrink-0" />
                    Plan requires <strong className="mx-0.5">{activeLookup.typicalRequirements.failedPreventivesLabel}</strong> to be documented
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="step-done"
                  checked={form.stepTherapyComplete}
                  onCheckedChange={c => setForm(f => ({ ...f, stepTherapyComplete: !!c }))}
                />
                <Label htmlFor="step-done" className="text-sm cursor-pointer">
                  I have completed the required step therapy
                </Label>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs">Prior PA for this drug</Label>
                <Select value={form.priorPAHistory} onValueChange={v => setForm(f => ({ ...f, priorPAHistory: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never submitted</SelectItem>
                    <SelectItem value="approved">Previously approved</SelectItem>
                    <SelectItem value="denied">Previously denied</SelectItem>
                    <SelectItem value="pending">Currently pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Step 4 — Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                Additional Context
                <Badge variant="outline" className="text-xs font-normal ml-auto">Optional</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe why other treatments failed, any contraindications, or relevant medical history…"
                value={form.clinicalNotes}
                onChange={e => setForm(f => ({ ...f, clinicalNotes: e.target.value }))}
                className="text-sm min-h-[72px] resize-none"
              />
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" disabled={!canEstimate} onClick={handleEstimate}>
            <Activity className="h-4 w-4 mr-2" />
            Estimate My Approval Chances
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          {!canEstimate && (
            <p className="text-xs text-center text-muted-foreground">
              Required to enable:{" "}
              {[
                !form.drugName && "drug name",
                !form.insurancePlanType && "plan type",
                !form.migraineDaysPerMonth && "migraine days/month",
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>

        {/* ══ RESULTS ══ */}
        <div id="pa-result" className="space-y-4 lg:sticky lg:top-4">
          {result ? (
            <>
              {/* Gauge */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>Approval Estimate</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Base rate: {result.baseRate}% (from {result.lookup.totalRequests.toLocaleString()} PA requests)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 pb-5">
                  <ScoreGauge score={result.score} />
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Adjusted from the {result.baseRate}% historical base rate using your specific inputs.
                  </p>
                </CardContent>
              </Card>

              {/* Requirements checklist */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Requirements Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.requirementsMet.map((req, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {req.met
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">{req.label}</p>
                          <Badge variant="outline" className={`text-xs shrink-0 ${req.met ? "text-green-600 border-green-300 bg-green-50" : "text-red-600 border-red-300 bg-red-50"}`}>
                            {req.met ? "Met" : "Not met"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Required: {req.required} · Yours: {req.userValue}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Score factors */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Score Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <p className="text-xs text-muted-foreground">Starting from {result.baseRate}% historical base rate:</p>
                  {result.factors.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {f.positive
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium leading-tight">{f.label}</p>
                          <Badge variant="outline" className={`text-xs shrink-0 font-semibold ${f.positive ? "text-green-600 border-green-300 bg-green-50" : "text-red-600 border-red-300 bg-red-50"}`}>
                            {f.positive ? "+" : ""}{f.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Denial reasons from data */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">
                    Why This Drug Gets Denied
                    <span className="font-normal text-muted-foreground ml-1">(historical data)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <DenialBar label="Missing documentation" pct={result.lookup.denialReasons.missingDocs} color="#f59e0b" />
                  <DenialBar label="Insufficient trial duration" pct={result.lookup.denialReasons.insufficientTrial} color="#ef4444" />
                  <DenialBar label="Step therapy not met" pct={result.lookup.denialReasons.stepTherapyNotMet} color="#8b5cf6" />
                  <DenialBar label="Other reasons" pct={result.lookup.denialReasons.other} color="#6b7280" />
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className={result.score < 70 ? "border-amber-200 bg-amber-50/30" : "border-green-200 bg-green-50/30"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {result.score < 70
                      ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                      : <Lightbulb className="h-4 w-4 text-green-600" />}
                    {result.score < 70 ? "How to Improve Your Chances" : "Next Steps"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <div className="flex gap-2 p-3 rounded-lg bg-muted/50 border">
                <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Estimates are based on aggregated PA outcome data (2023–2026). Actual decisions depend on your specific plan's criteria, submitted documentation, and medical reviewer judgment.
                </p>
              </div>

              <Button variant="outline" className="w-full text-sm" onClick={() => { setResult(null); setForm(DEFAULT_FORM); }}>
                Start New Estimate
              </Button>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="p-4 rounded-full bg-muted/50">
                  <Activity className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your estimate will appear here</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Powered by {(28_600_000).toLocaleString()}+ real PA records</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
