import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface InsurancePlan {
  id: number;
  carrier: string;
  planName: string;
  memberId: string;
  groupNumber: string;
  rxBin: string;
  rxPcn: string;
  tier1: string;
  tier2: string;
  tier3: string;
  formularyYear: string;
  lastUpdated: string;
}

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

const MOCK_PLAN: InsurancePlan = {
  id: 1,
  carrier: "Blue Cross Blue Shield",
  planName: "PPO Gold 1000",
  memberId: "XYZ123456789",
  groupNumber: "GRP-98765",
  rxBin: "610014",
  rxPcn: "BCBSIL",
  tier1: "$10",
  tier2: "$35",
  tier3: "$65",
  formularyYear: "2026",
  lastUpdated: "Jan 1, 2026",
};

const FORMULARY_DATA: FormularyDrug[] = [
  { name: "Sumatriptan", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$35", alternatives: [] },
  { name: "Rizatriptan", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: true, copay: "$35", alternatives: [] },
  { name: "Ubrogepant (Ubrelvy)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Sumatriptan", "Rizatriptan"] },
  { name: "Rimegepant (Nurtec)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Sumatriptan", "Rizatriptan"] },
  { name: "Lasmiditan (Reyvow)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Sumatriptan"] },
  { name: "Topiramate", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10", alternatives: [] },
  { name: "Propranolol", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10", alternatives: [] },
  { name: "Amitriptyline", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10", alternatives: [] },
  { name: "Erenumab (Aimovig)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Topiramate", "Propranolol"] },
  { name: "Fremanezumab (Ajovy)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Topiramate"] },
  { name: "Galcanezumab (Emgality)", tier: 3, covered: true, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "$65", alternatives: ["Topiramate"] },
  { name: "Ibuprofen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10", alternatives: [] },
  { name: "Naproxen", tier: 1, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$10", alternatives: [] },
  { name: "Ondansetron", tier: 2, covered: true, paRequired: false, stepTherapy: false, quantityLimit: false, copay: "$35", alternatives: [] },
  { name: "Eptinezumab (Vyepti)", tier: 3, covered: false, paRequired: true, stepTherapy: true, quantityLimit: true, copay: "Not covered", alternatives: ["Erenumab (Aimovig)", "Topiramate"] },
];

const tierColor: Record<number, string> = {
  1: "bg-[hsl(var(--severity-low))]/15 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/30",
  2: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  3: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Insurance() {
  const [search, setSearch] = useState("");
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  const filtered = FORMULARY_DATA.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insurance</h1>
        <p className="text-muted-foreground">Your plan & formulary coverage</p>
      </div>

      {/* Insurance Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{MOCK_PLAN.carrier}</p>
                <p className="text-sm text-muted-foreground">{MOCK_PLAN.planName}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">Active</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Member ID</p>
              <p className="font-mono font-medium">{MOCK_PLAN.memberId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Group #</p>
              <p className="font-mono font-medium">{MOCK_PLAN.groupNumber}</p>
            </div>
          </div>

          <button
            className="text-xs text-primary flex items-center gap-1"
            onClick={() => setShowPlanDetails(!showPlanDetails)}
          >
            {showPlanDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showPlanDetails ? "Hide" : "Show"} RX & copay details
          </button>

          {showPlanDetails && (
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">RX BIN</p>
                  <p className="font-mono font-medium">{MOCK_PLAN.rxBin}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">RX PCN</p>
                  <p className="font-mono font-medium">{MOCK_PLAN.rxPcn}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-center pt-1">
                <div className="rounded-lg bg-[hsl(var(--severity-low))]/10 p-2 border border-[hsl(var(--severity-low))]/20">
                  <p className="text-xs text-muted-foreground">Tier 1</p>
                  <p className="font-bold text-[hsl(var(--severity-low))]">{MOCK_PLAN.tier1}</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-2 border border-[hsl(var(--warning))]/20">
                  <p className="text-xs text-muted-foreground">Tier 2</p>
                  <p className="font-bold text-[hsl(var(--warning))]">{MOCK_PLAN.tier2}</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-2 border border-destructive/20">
                  <p className="text-xs text-muted-foreground">Tier 3</p>
                  <p className="font-bold text-destructive">{MOCK_PLAN.tier3}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulary Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Formulary Drugs</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{MOCK_PLAN.formularyYear} · {MOCK_PLAN.lastUpdated}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh}>
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
                        : <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      }
                      <span className="font-medium text-sm">{drug.name}</span>
                      {drug.paRequired && (
                        <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {drug.covered && (
                        <Badge variant="outline" className={`text-xs ${tierColor[drug.tier]}`}>
                          Tier {drug.tier} · {drug.copay}
                        </Badge>
                      )}
                      {!drug.covered && (
                        <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Not covered</Badge>
                      )}
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
                        <div className={`rounded p-1.5 ${drug.quantityLimit ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"}`}>
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
    </div>
  );
}
