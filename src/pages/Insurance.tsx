import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, Search, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, Phone, Building2, Globe,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
interface FormularyDrug {
  name: string;
  tier: number;
  covered: boolean;
  paRequired: boolean;
  stepTherapy: boolean;
  quantityLimit: boolean;
  copay: string;
  alternatives?: string[];
}

interface Plan {
  id: string;
  carrier: string;
  planName: string;
  planType: string;
  memberId?: string;
  groupNumber?: string;
  rxBin?: string;
  rxPcn?: string;
  tier1: string;
  tier2: string;
  tier3: string;
  formularyYear: string;
  lastUpdated: string;
  pharmacyHelpdesk: string;
  pharmacyHelpdeskHours: string;
  pharmacyWebsite: string;
  formulary: FormularyDrug[];
}

/* ─── Shared formulary drugs ─────────────────────────── */
const MIGRAINE_DRUGS: FormularyDrug[] = [
  { name: "Sumatriptan", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$35" },
  { name: "Rizatriptan", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$35" },
  { name: "Ubrogepant (Ubrelvy)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Sumatriptan", "Rizatriptan"] },
  { name: "Rimegepant (Nurtec)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Sumatriptan", "Rizatriptan"] },
  { name: "Lasmiditan (Reyvow)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Sumatriptan"] },
  { name: "Topiramate", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
  { name: "Propranolol", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
  { name: "Amitriptyline", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
  { name: "Erenumab (Aimovig)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Topiramate", "Propranolol"] },
  { name: "Fremanezumab (Ajovy)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Topiramate"] },
  { name: "Galcanezumab (Emgality)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Topiramate"] },
  { name: "Ibuprofen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
  { name: "Naproxen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
  { name: "Ondansetron", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$35" },
  { name: "Eptinezumab (Vyepti)", tier: 3, covered: false, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "Not covered", alternatives: ["Erenumab (Aimovig)", "Topiramate"] },
];

/* ─── Plans data ─────────────────────────────────────── */
const MY_PLAN: Plan = {
  id: "bcbs-ppo-gold",
  carrier: "Blue Cross Blue Shield",
  planName: "PPO Gold 1000",
  planType: "PPO",
  memberId: "XYZ123456789",
  groupNumber: "GRP-98765",
  rxBin: "610014",
  rxPcn: "BCBSIL",
  tier1: "$10", tier2: "$35", tier3: "$65",
  formularyYear: "2026",
  lastUpdated: "Jan 1, 2026",
  pharmacyHelpdesk: "1-800-624-2356",
  pharmacyHelpdeskHours: "Mon–Fri 8am–8pm · Sat 8am–5pm CT",
  pharmacyWebsite: "bcbsil.com/pharmacy",
  formulary: MIGRAINE_DRUGS,
};

const OTHER_PLANS: Plan[] = [
  {
    id: "aetna-hmo",
    carrier: "Aetna",
    planName: "HMO Silver 2500",
    planType: "HMO",
    tier1: "$15", tier2: "$40", tier3: "$80",
    formularyYear: "2026",
    lastUpdated: "Jan 1, 2026",
    pharmacyHelpdesk: "1-888-792-3862",
    pharmacyHelpdeskHours: "24/7",
    pharmacyWebsite: "aetna.com/pharmacy",
    formulary: [
      { name: "Sumatriptan", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$15" },
      { name: "Rizatriptan", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$15" },
      { name: "Ubrogepant (Ubrelvy)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$80", alternatives: ["Sumatriptan"] },
      { name: "Rimegepant (Nurtec)", tier: 3, covered: false, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "Not covered", alternatives: ["Sumatriptan", "Rizatriptan"] },
      { name: "Lasmiditan (Reyvow)", tier: 3, covered: false, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "Not covered", alternatives: ["Sumatriptan"] },
      { name: "Topiramate", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$15" },
      { name: "Propranolol", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$15" },
      { name: "Erenumab (Aimovig)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$80", alternatives: ["Topiramate"] },
      { name: "Fremanezumab (Ajovy)", tier: 3, covered: false, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "Not covered", alternatives: ["Topiramate"] },
      { name: "Galcanezumab (Emgality)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$80", alternatives: ["Topiramate"] },
      { name: "Ibuprofen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$15" },
      { name: "Naproxen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$15" },
      { name: "Ondansetron", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$40" },
      { name: "Eptinezumab (Vyepti)", tier: 3, covered: false, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "Not covered", alternatives: ["Erenumab (Aimovig)"] },
    ],
  },
  {
    id: "cigna-ppo",
    carrier: "Cigna",
    planName: "PPO Platinum 500",
    planType: "PPO",
    tier1: "$10", tier2: "$30", tier3: "$55",
    formularyYear: "2026",
    lastUpdated: "Jan 1, 2026",
    pharmacyHelpdesk: "1-800-244-6224",
    pharmacyHelpdeskHours: "24/7",
    pharmacyWebsite: "cigna.com/pharmacy",
    formulary: [
      { name: "Sumatriptan", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$10" },
      { name: "Rizatriptan", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$10" },
      { name: "Ubrogepant (Ubrelvy)", tier: 2, covered: true, paRequired: true, stepTherapy: false, quantityLimit: true, copay: "$30", alternatives: ["Sumatriptan"] },
      { name: "Rimegepant (Nurtec)", tier: 2, covered: true, paRequired: true, stepTherapy: false, quantityLimit: true, copay: "$30", alternatives: ["Sumatriptan"] },
      { name: "Lasmiditan (Reyvow)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$55", alternatives: ["Sumatriptan"] },
      { name: "Topiramate", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Propranolol", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Amitriptyline", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Erenumab (Aimovig)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$55", alternatives: ["Topiramate"] },
      { name: "Fremanezumab (Ajovy)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$55", alternatives: ["Topiramate"] },
      { name: "Galcanezumab (Emgality)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$55", alternatives: ["Topiramate"] },
      { name: "Ibuprofen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Naproxen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Ondansetron", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$30" },
      { name: "Eptinezumab (Vyepti)", tier: 2, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$30", alternatives: ["Erenumab (Aimovig)"] },
    ],
  },
  {
    id: "uhc-choice",
    carrier: "UnitedHealthcare",
    planName: "Choice Plus Gold",
    planType: "PPO",
    tier1: "$10", tier2: "$35", tier3: "$70",
    formularyYear: "2026",
    lastUpdated: "Jan 1, 2026",
    pharmacyHelpdesk: "1-866-606-8612",
    pharmacyHelpdeskHours: "24/7",
    pharmacyWebsite: "uhc.com/pharmacy",
    formulary: [
      { name: "Sumatriptan", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$35" },
      { name: "Rizatriptan", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$35" },
      { name: "Ubrogepant (Ubrelvy)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$70", alternatives: ["Sumatriptan", "Rizatriptan"] },
      { name: "Rimegepant (Nurtec)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$70", alternatives: ["Sumatriptan"] },
      { name: "Lasmiditan (Reyvow)", tier: 3, covered: false, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "Not covered", alternatives: ["Sumatriptan"] },
      { name: "Topiramate", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Propranolol", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Amitriptyline", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Erenumab (Aimovig)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$70", alternatives: ["Topiramate"] },
      { name: "Fremanezumab (Ajovy)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$70", alternatives: ["Topiramate"] },
      { name: "Galcanezumab (Emgality)", tier: 3, covered: false, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "Not covered", alternatives: ["Topiramate"] },
      { name: "Ibuprofen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Naproxen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10" },
      { name: "Ondansetron", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$35" },
      { name: "Eptinezumab (Vyepti)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$70", alternatives: ["Erenumab (Aimovig)"] },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────── */
const tierColor: Record<number, string> = {
  1: "bg-[hsl(var(--severity-low))]/15 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/30",
  2: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  3: "bg-destructive/15 text-destructive border-destructive/30",
};

/* ─── Sub-components ─────────────────────────────────── */
function PharmacyHelpdeskCard({ plan, isMine = false }: { plan: Plan; isMine?: boolean }) {
  return (
    <Card className={isMine ? "border-primary/20 bg-primary/5" : ""}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className={`h-4 w-4 ${isMine ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm font-semibold">Pharmacy Helpdesk</span>
          </div>
          {isMine && <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">Your Plan</Badge>}
        </div>
        <a
          href={`tel:${plan.pharmacyHelpdesk.replace(/-/g, "")}`}
          className={`block text-lg font-mono font-bold ${isMine ? "text-primary" : "text-foreground"}`}
        >
          {plan.pharmacyHelpdesk}
        </a>
        <p className="text-xs text-muted-foreground">{plan.pharmacyHelpdeskHours}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          <span>{plan.pharmacyWebsite}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function FormularyList({ plan }: { plan: Plan }) {
  const [search, setSearch] = useState("");
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = plan.formulary.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Formulary Drugs</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{plan.formularyYear} · {plan.lastUpdated}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1200); }}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search medications…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map((drug) => {
          const isExpanded = expandedDrug === drug.name;
          return (
            <Card
              key={drug.name}
              className={`cursor-pointer transition-all ${!drug.covered ? "opacity-70" : ""}`}
              onClick={() => setExpandedDrug(isExpanded ? null : drug.name)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {drug.covered
                      ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--severity-low))] shrink-0" />
                      : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                    <span className="font-medium text-sm">{drug.name}</span>
                    {drug.paRequired && <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {drug.covered
                      ? <Badge variant="outline" className={`text-xs ${tierColor[drug.tier]}`}>Tier {drug.tier} · {drug.copay}</Badge>
                      : <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Not covered</Badge>}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div className={`rounded p-1.5 ${drug.paRequired ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" : "bg-muted text-muted-foreground"}`}>
                        PA {drug.paRequired ? "Required" : "Not needed"}
                      </div>
                      <div className={`rounded p-1.5 ${drug.stepTherapy ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" : "bg-muted text-muted-foreground"}`}>
                        Step therapy {drug.stepTherapy ? "Yes" : "No"}
                      </div>
                      <div className="rounded p-1.5 bg-muted text-muted-foreground">
                        Qty limit {drug.quantityLimit ? "Yes" : "No"}
                      </div>
                    </div>
                    {drug.alternatives && drug.alternatives.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Covered alternatives:</p>
                        <div className="flex flex-wrap gap-1">
                          {drug.alternatives.map((alt) => (
                            <Badge key={alt} variant="secondary" className="text-xs">{alt}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No formulary results for "{search}"
          </div>
        )}
      </div>
    </div>
  );
}

function MyPlanTab() {
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  return (
    <div className="space-y-4">
      {/* Insurance Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{MY_PLAN.carrier}</p>
                <p className="text-sm text-muted-foreground">{MY_PLAN.planName}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">Active</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Member ID</p>
              <p className="font-mono font-medium">{MY_PLAN.memberId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Group #</p>
              <p className="font-mono font-medium">{MY_PLAN.groupNumber}</p>
            </div>
          </div>

          <button className="text-xs text-primary flex items-center gap-1" onClick={() => setShowPlanDetails(!showPlanDetails)}>
            {showPlanDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showPlanDetails ? "Hide" : "Show"} RX & copay details
          </button>

          {showPlanDetails && (
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">RX BIN</p>
                  <p className="font-mono font-medium">{MY_PLAN.rxBin}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">RX PCN</p>
                  <p className="font-mono font-medium">{MY_PLAN.rxPcn}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-center pt-1">
                <div className="rounded-lg bg-[hsl(var(--severity-low))]/10 p-2 border border-[hsl(var(--severity-low))]/20">
                  <p className="text-xs text-muted-foreground">Tier 1</p>
                  <p className="font-bold text-[hsl(var(--severity-low))]">{MY_PLAN.tier1}</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-2 border border-[hsl(var(--warning))]/20">
                  <p className="text-xs text-muted-foreground">Tier 2</p>
                  <p className="font-bold text-[hsl(var(--warning))]">{MY_PLAN.tier2}</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-2 border border-destructive/20">
                  <p className="text-xs text-muted-foreground">Tier 3</p>
                  <p className="font-bold text-destructive">{MY_PLAN.tier3}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pharmacy Helpdesk */}
      <PharmacyHelpdeskCard plan={MY_PLAN} isMine />

      {/* Formulary */}
      <FormularyList plan={MY_PLAN} />
    </div>
  );
}

function ComparePlansTab() {
  const [planSearch, setPlanSearch] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const filteredPlans = OTHER_PLANS.filter(
    (p) =>
      p.carrier.toLowerCase().includes(planSearch.toLowerCase()) ||
      p.planName.toLowerCase().includes(planSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Search other insurance plans to compare formulary coverage and pharmacy support numbers.</p>
      </div>

      {/* Plan search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by carrier or plan name…"
          value={planSearch}
          onChange={(e) => setPlanSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Plan cards */}
      {!selectedPlan && (
        <div className="space-y-2">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelectedPlan(plan)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{plan.carrier}</p>
                      <p className="text-xs text-muted-foreground">{plan.planName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{plan.planType}</Badge>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="rounded bg-[hsl(var(--severity-low))]/10 p-1 text-[hsl(var(--severity-low))]">T1 {plan.tier1}</div>
                  <div className="rounded bg-[hsl(var(--warning))]/10 p-1 text-[hsl(var(--warning))]">T2 {plan.tier2}</div>
                  <div className="rounded bg-destructive/10 p-1 text-destructive">T3 {plan.tier3}</div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredPlans.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No plans found for "{planSearch}"</div>
          )}
        </div>
      )}

      {/* Selected plan detail */}
      {selectedPlan && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-primary flex items-center gap-1"
              onClick={() => setSelectedPlan(null)}
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-90" /> Back to plans
            </button>
          </div>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{selectedPlan.carrier}</p>
                  <p className="text-sm text-muted-foreground">{selectedPlan.planName} · {selectedPlan.planType}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-center">
                <div className="rounded-lg bg-[hsl(var(--severity-low))]/10 p-2 border border-[hsl(var(--severity-low))]/20">
                  <p className="text-xs text-muted-foreground">Tier 1</p>
                  <p className="font-bold text-[hsl(var(--severity-low))]">{selectedPlan.tier1}</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-2 border border-[hsl(var(--warning))]/20">
                  <p className="text-xs text-muted-foreground">Tier 2</p>
                  <p className="font-bold text-[hsl(var(--warning))]">{selectedPlan.tier2}</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-2 border border-destructive/20">
                  <p className="text-xs text-muted-foreground">Tier 3</p>
                  <p className="font-bold text-destructive">{selectedPlan.tier3}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <PharmacyHelpdeskCard plan={selectedPlan} />
          <FormularyList plan={selectedPlan} />
        </div>
      )}
    </div>
  );
}

/* ─── Main export ────────────────────────────────────── */
export default function Insurance() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insurance</h1>
        <p className="text-muted-foreground">Your plan, formulary & pharmacy support</p>
      </div>

      <Tabs defaultValue="myplan" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="myplan" className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> My Plan
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Compare Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="myplan" className="mt-4">
          <MyPlanTab />
        </TabsContent>
        <TabsContent value="compare" className="mt-4">
          <ComparePlansTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
