import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, Search, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, XCircle, Phone, Building2, Globe, Loader2, AlertCircle,
  Pill, X, Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─────────────────────────────────────────── */
interface FormularyDrug {
  name: string;
  brandNames?: string[];
  drugClass?: string;
  tier: number;
  covered: boolean;
  paRequired: boolean;
  stepTherapy: boolean;
  quantityLimit: boolean;
  copayHint?: string;
  copay?: string;
  notes?: string;
  alternatives?: string[];
}

interface Plan {
  id: string;
  carrier: string;
  planName: string;
  planType: string;
  state?: string;
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
  formulary?: FormularyDrug[];
}

/* ─── My Plan (user's own plan) ─────────────────────── */
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
};

/* ─── Helpers ────────────────────────────────────────── */
const tierColor: Record<number, string> = {
  1: "bg-[hsl(var(--severity-low))]/15 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/30",
  2: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  3: "bg-destructive/15 text-destructive border-destructive/30",
};

/* ─── Pharmacy helpdesk card ─────────────────────────── */
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
          href={`tel:${plan.pharmacyHelpdesk.replace(/[-\s]/g, "")}`}
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

/* ─── Formulary drug row ─────────────────────────────── */
function DrugRow({ drug }: { drug: FormularyDrug }) {
  const [expanded, setExpanded] = useState(false);
  const copay = drug.copay ?? drug.copayHint ?? "See plan";
  return (
    <Card
      className={`cursor-pointer transition-all ${!drug.covered ? "opacity-70" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {drug.covered
              ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--severity-low))] shrink-0" />
              : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
            <div>
              <span className="font-medium text-sm">{drug.name}</span>
              {drug.brandNames?.length ? (
                <span className="text-[10px] text-muted-foreground ml-1.5">({drug.brandNames[0]})</span>
              ) : null}
            </div>
            {drug.paRequired && <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />}
          </div>
          <div className="flex items-center gap-2">
            {drug.covered
              ? <Badge variant="outline" className={`text-xs ${tierColor[drug.tier] ?? tierColor[3]}`}>Tier {drug.tier} · {copay}</Badge>
              : <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Not covered</Badge>}
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            {drug.drugClass && (
              <p className="text-[10px] text-muted-foreground">Class: {drug.drugClass}</p>
            )}
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
            {drug.notes && <p className="text-xs text-muted-foreground leading-relaxed">{drug.notes}</p>}
            {drug.alternatives?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Covered alternatives:</p>
                <div className="flex flex-wrap gap-1">
                  {drug.alternatives.map((alt) => (
                    <Badge key={alt} variant="secondary" className="text-xs">{alt}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Live formulary lookup for a plan ───────────────── */
function FormularyPanel({ plan }: { plan: Plan }) {
  const [drugQuery, setDrugQuery] = useState("");
  const [drugs, setDrugs] = useState<FormularyDrug[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const loadFormulary = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("insurance-lookup", {
        body: { action: "plan_formulary", planId: plan.id, search: search || "" },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (!data?.success) throw new Error(data?.error || "Failed to load formulary");
      setDrugs(data.drugs || []);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [plan.id]);

  const handleToggle = () => {
    if (!open && !loaded) loadFormulary();
    setOpen(!open);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFormulary(drugQuery);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          View Formulary Drugs
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="space-y-3">
          {/* Drug search within formulary */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search any drug (e.g. Ubrogepant, Topiramate)…"
                value={drugQuery}
                onChange={(e) => setDrugQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
            {drugQuery && (
              <Button type="button" variant="ghost" size="icon" onClick={() => { setDrugQuery(""); loadFormulary(""); }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>

          {loading && (
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading formulary…
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {!loading && loaded && drugs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No drugs found. Try a different search term.</p>
          )}

          {!loading && drugs.length > 0 && (
            <div className="space-y-2">
              {drugs.map((drug) => (
                <DrugRow key={drug.name} drug={drug} />
              ))}
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 px-1 pt-1">
                <Info className="h-3 w-3 shrink-0" />
                Formulary data is a reference guide. Verify with your plan for precise copay/coverage details.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── My Plan Tab ────────────────────────────────────── */
function MyPlanTab() {
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  return (
    <div className="space-y-4">
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

      <PharmacyHelpdeskCard plan={MY_PLAN} isMine />
      <FormularyPanel plan={MY_PLAN} />
    </div>
  );
}

/* ─── Compare Plans Tab ──────────────────────────────── */
function ComparePlansTab() {
  const [query, setQuery] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const searchPlans = async () => {
    setLoading(true);
    setError(null);
    setSelectedPlan(null);
    setSearched(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("insurance-lookup", {
        body: { action: "search_plans", query, zipCode },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (!data?.success) throw new Error(data?.error || "Search failed");
      setPlans(data.plans || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlans();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Search any insurance plan — commercial, Medicare, Medicaid — and view drug formulary coverage.
      </p>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Carrier or plan name (e.g. Aetna, Cigna, Medicare)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="ZIP code (optional)"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="w-36 shrink-0"
            maxLength={5}
          />
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Searching…</> : "Search Plans"}
          </Button>
        </div>
      </form>

      {/* Quick carrier chips */}
      {!searched && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Browse by carrier:</p>
          <div className="flex flex-wrap gap-1.5">
            {["Blue Cross Blue Shield", "Aetna", "Cigna", "UnitedHealthcare", "Humana", "Kaiser Permanente", "Medicaid", "Medicare"].map((c) => (
              <button
                key={c}
                onClick={() => { setQuery(c); searchPlans(); }}
                className="text-xs rounded-full border border-border bg-card px-3 py-1.5 hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Plan list */}
      {!selectedPlan && searched && !loading && (
        <div className="space-y-2">
          {plans.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No plans found. Try a broader search.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{plans.length} plan{plans.length !== 1 ? "s" : ""} found</p>
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setSelectedPlan(plan)}
                >
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
                        {plan.state && <span className="text-xs text-muted-foreground">{plan.state}</span>}
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
            </>
          )}
        </div>
      )}

      {/* Selected plan detail */}
      {selectedPlan && (
        <div className="space-y-4">
          <button
            className="text-xs text-primary flex items-center gap-1"
            onClick={() => setSelectedPlan(null)}
          >
            <ChevronDown className="h-3.5 w-3.5 rotate-90" /> Back to results
          </button>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{selectedPlan.carrier}</p>
                    <p className="text-sm text-muted-foreground">{selectedPlan.planName} · {selectedPlan.planType}</p>
                    {selectedPlan.state && (
                      <p className="text-xs text-muted-foreground">{selectedPlan.state}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{selectedPlan.planType}</Badge>
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

          {/* Live formulary lookup */}
          <FormularyPanel plan={selectedPlan} />
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
