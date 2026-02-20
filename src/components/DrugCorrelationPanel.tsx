import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, AlertTriangle, ArrowRight, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { subDays } from "date-fns";

interface DrugInfo {
  drugClass: string;
  adverseReactions: string[];
  warnings: string[];
  drugInteractions: string[];
}

interface Interaction {
  drug: string;
  severity: "major" | "moderate" | "minor";
  mechanism: string;
  clinicalEffect: string;
}

interface SideEffectOverlap {
  sideEffect: string;
  relevance: string;
  action: string;
}

interface MigraineRelevance {
  role: "beneficial" | "neutral" | "potentially harmful";
  explanation: string;
}

interface CorrelationData {
  interactions: Interaction[];
  sideEffectOverlaps: SideEffectOverlap[];
  migraineRelevance: MigraineRelevance;
  overallRisk: "low" | "moderate" | "high";
  summary: string;
}

const riskConfig = {
  low: { icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Low Risk" },
  moderate: { icon: ShieldQuestion, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Moderate Risk" },
  high: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", label: "High Risk" },
};

const severityColor: Record<string, string> = {
  major: "bg-destructive/10 text-destructive border-destructive/20",
  moderate: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  minor: "bg-muted text-muted-foreground border-border",
};

const roleConfig: Record<string, { color: string; label: string }> = {
  beneficial: { color: "text-emerald-600 dark:text-emerald-400", label: "May help migraines" },
  neutral: { color: "text-muted-foreground", label: "Neutral for migraines" },
  "potentially harmful": { color: "text-destructive", label: "May worsen migraines" },
};

export default function DrugCorrelationPanel({
  drugName,
  drugInfo,
  localMedications,
}: {
  drugName: string;
  drugInfo: DrugInfo;
  localMedications?: { name: string; dosage: string; classification: string; frequency: string; active: boolean }[];
}) {
  const { user } = useAuth();
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMeds, setHasMeds] = useState<boolean | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    setHasMeds(null);
  }, [drugName]);

  const analyze = async () => {
    setLoading(true);
    setError(null);

    try {
      let meds: any[] = [];
      let entries: any[] = [];

      if (user) {
        const [medsRes, entriesRes] = await Promise.all([
          supabase.from("medications").select("*").eq("user_id", user.id),
          supabase
            .from("migraine_entries")
            .select("*")
            .eq("user_id", user.id)
            .gte("started_at", subDays(new Date(), 30).toISOString())
            .order("started_at", { ascending: false }),
        ]);
        meds = medsRes.data || [];
        entries = entriesRes.data || [];
      }

      // Fall back to local med list if no DB meds
      if (meds.length === 0 && localMedications && localMedications.length > 0) {
        meds = localMedications.filter(m => m.active).map(m => ({
          name: m.name,
          dosage: m.dosage,
          med_type: m.classification === "Acute/Rescue" ? "acute" : "preventive",
          frequency: m.frequency,
          active: m.active,
        }));
      }

      if (meds.length === 0) {
        setHasMeds(false);
        return;
      }
      setHasMeds(true);

      const { data: result, error: fnError } = await supabase.functions.invoke("drug-correlate", {
        body: {
          lookedUpDrug: drugName,
          lookedUpDrugInfo: drugInfo,
          currentMedications: meds,
          migraineEntries: entries || [],
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!result?.success) throw new Error(result?.error || "Analysis failed");

      setData(result.data as CorrelationData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // Not yet analyzed — show CTA
  if (!data && !loading && !error && hasMeds === null) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Check interactions with your meds</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cross-reference <span className="font-medium text-foreground">{drugName}</span> against your current medication list and recent migraine history to check for interactions and headache risk.
              </p>
            </div>
          </div>
          <Button onClick={analyze} size="sm" className="w-full">
            <Brain className="mr-1.5 h-3.5 w-3.5" /> Analyze Interactions
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No meds saved
  if (hasMeds === false) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Add medications to your <span className="font-medium text-foreground">My Meds</span> list first to check interactions.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Analyzing interactions…</p>
            <p className="text-xs text-muted-foreground mt-0.5">Comparing {drugName} with your medication list</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error
  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 text-center space-y-2">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={analyze}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const risk = riskConfig[data.overallRisk] || riskConfig.low;
  const RiskIcon = risk.icon;
  const relevance = roleConfig[data.migraineRelevance?.role] || roleConfig.neutral;

  return (
    <div className="space-y-3">
      {/* Overall risk banner */}
      <Card className={`border ${risk.bg}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <RiskIcon className={`h-6 w-6 shrink-0 ${risk.color}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-bold ${risk.color}`}>{risk.label}</p>
                <Badge variant="outline" className={`text-[10px] ${relevance.color} border-current/20`}>
                  {relevance.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{data.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migraine relevance */}
      {data.migraineRelevance?.explanation && (
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Migraine / Headache Impact</p>
            <p className="text-xs leading-relaxed">{data.migraineRelevance.explanation}</p>
          </CardContent>
        </Card>
      )}

      {/* Drug interactions */}
      {data.interactions && data.interactions.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Drug Interactions ({data.interactions.length})
            </p>
            {data.interactions.map((ix, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{drugName}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-semibold">{ix.drug}</span>
                  <Badge variant="outline" className={`text-[10px] ml-auto ${severityColor[ix.severity]}`}>
                    {ix.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ix.clinicalEffect}</p>
                {ix.mechanism && (
                  <p className="text-[10px] text-muted-foreground/70 italic">Mechanism: {ix.mechanism}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Side effect overlaps */}
      {data.sideEffectOverlaps && data.sideEffectOverlaps.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Side Effect Overlaps
            </p>
            {data.sideEffectOverlaps.map((se, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-1">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> {se.sideEffect}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{se.relevance}</p>
                <p className="text-[10px] text-primary font-medium">{se.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-muted-foreground px-1">
        AI-generated clinical analysis — always consult your prescriber before making medication changes.
      </p>
    </div>
  );
}
