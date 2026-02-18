import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, FlaskConical, AlertTriangle, Zap, TrendingUp, TrendingDown,
  Minus, Brain, Pill, ChevronDown, ChevronUp, RefreshCw, Info
} from "lucide-react";

// Mock data matching what would come from the DB
const PATIENT_MEDS = [
  { name: "Topiramate", dosage: "50mg", type: "preventive", active: true, frequency: "Daily", startedWeeksAgo: 8 },
  { name: "Propranolol", dosage: "80mg", type: "preventive", active: false, frequency: "Daily", startedWeeksAgo: 20 },
  { name: "Sumatriptan", dosage: "100mg", type: "rescue", active: true, frequency: "PRN", startedWeeksAgo: 52 },
  { name: "Magnesium", dosage: "400mg", type: "supplement", active: true, frequency: "Daily", startedWeeksAgo: 12 },
  { name: "Amitriptyline", dosage: "25mg", type: "preventive", active: false, frequency: "Nightly", startedWeeksAgo: 32 },
];

const MOCK_MIGRAINE_ENTRIES = [
  { date: "Feb 16", severity: 8, duration: "4h 20m", meds: ["Sumatriptan", "Ibuprofen"] },
  { date: "Feb 14", severity: 5, duration: "2h 10m", meds: ["Naproxen"] },
  { date: "Feb 11", severity: 9, duration: "6h 45m", meds: ["Sumatriptan", "Ondansetron"] },
  { date: "Feb 8", severity: 3, duration: "1h 15m", meds: [] },
  { date: "Feb 5", severity: 7, duration: "3h 30m", meds: ["Sumatriptan"] },
];

type DrugInfo = {
  name: string;
  genericName: string;
  brandName: string;
  drugClass: string;
  adverseReactions: string[];
  warnings: string[];
  drugInteractions: string[];
  description: string[];
  indications: string[];
};

type Insight = {
  type: "improvement" | "concern" | "neutral";
  medication: string;
  finding: string;
  confidence: "high" | "moderate" | "low";
};

type CorrelationResult = {
  insights: Insight[];
  summary: string;
};

const insightIcon = (type: Insight["type"]) => {
  if (type === "improvement") return <TrendingDown className="h-4 w-4 text-[hsl(var(--severity-low))]" />;
  if (type === "concern") return <TrendingUp className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const insightStyle = (type: Insight["type"]) => {
  if (type === "improvement") return "border-[hsl(var(--severity-low))]/30 bg-[hsl(var(--severity-low))]/5";
  if (type === "concern") return "border-destructive/30 bg-destructive/5";
  return "border-border bg-muted/30";
};

const confidenceBadge = (c: Insight["confidence"]) => {
  if (c === "high") return "bg-primary/10 text-primary border-primary/20";
  if (c === "moderate") return "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20";
  return "bg-muted text-muted-foreground";
};

export default function Pharmacology() {
  const [search, setSearch] = useState("");
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null);
  const [drugLoading, setDrugLoading] = useState(false);
  const [drugError, setDrugError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("adverse");

  const [correlations, setCorrelations] = useState<CorrelationResult | null>(null);
  const [corrLoading, setCorrLoading] = useState(false);
  const [corrError, setCorrError] = useState<string | null>(null);

  const searchDrug = async (name: string) => {
    if (!name.trim()) return;
    setDrugLoading(true);
    setDrugError(null);
    setDrugInfo(null);
    setExpandedSection("adverse");

    const { data, error } = await supabase.functions.invoke("drug-lookup", {
      body: { drugName: name.trim() },
    });

    setDrugLoading(false);
    if (error || !data?.success) {
      setDrugError(data?.error || error?.message || "Lookup failed");
    } else {
      setDrugInfo(data.data);
    }
  };

  const runCorrelationAnalysis = async () => {
    setCorrLoading(true);
    setCorrError(null);

    const { data, error } = await supabase.functions.invoke("analyze-correlations", {
      body: {
        medications: PATIENT_MEDS,
        migraineEntries: MOCK_MIGRAINE_ENTRIES,
      },
    });

    setCorrLoading(false);
    if (error || !data?.success) {
      setCorrError(data?.error || error?.message || "Analysis failed");
    } else {
      setCorrelations(data.data);
    }
  };

  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Drug Analysis</h1>
        <p className="text-muted-foreground">Clinical pharmacology, interactions & migraine correlations</p>
      </div>

      {/* AI Correlation Analysis */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              AI Correlation Analysis
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={runCorrelationAnalysis}
              disabled={corrLoading}
              className="h-7 text-xs gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${corrLoading ? "animate-spin" : ""}`} />
              {corrLoading ? "Analyzing…" : correlations ? "Re-analyze" : "Run Analysis"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Analyzes your current medications against migraine history to find patterns
          </p>
        </CardHeader>

        {corrLoading && (
          <CardContent className="pt-0 space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </CardContent>
        )}

        {corrError && (
          <CardContent className="pt-0">
            <p className="text-xs text-destructive">{corrError}</p>
          </CardContent>
        )}

        {correlations && !corrLoading && (
          <CardContent className="pt-0 space-y-3">
            {correlations.insights.map((insight, i) => (
              <div key={i} className={`rounded-lg border p-3 space-y-1 ${insightStyle(insight.type)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {insightIcon(insight.type)}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{insight.medication}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${confidenceBadge(insight.confidence)}`}>
                          {insight.confidence} confidence
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.finding}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {correlations.summary && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Summary: </span>
                  {correlations.summary}
                </p>
              </div>
            )}
          </CardContent>
        )}

        {!correlations && !corrLoading && !corrError && (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground py-2 text-center">
              Tap "Run Analysis" to detect medication–migraine patterns using AI
            </p>
          </CardContent>
        )}
      </Card>

      {/* Drug Lookup */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" /> Drug Lookup
        </h2>

        {/* Quick select from patient's meds */}
        <div className="flex flex-wrap gap-1.5">
          {PATIENT_MEDS.map((m) => (
            <button
              key={m.name}
              onClick={() => { setSearch(m.name); searchDrug(m.name); }}
              className="text-xs rounded-full border px-2.5 py-1 transition-colors hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-muted-foreground border-border"
            >
              {m.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search any medication…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchDrug(search)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => searchDrug(search)} disabled={drugLoading || !search.trim()}>
            {drugLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Look up"}
          </Button>
        </div>

        {drugLoading && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </CardContent>
          </Card>
        )}

        {drugError && (
          <Card className="border-destructive/20">
            <CardContent className="p-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{drugError}</p>
            </CardContent>
          </Card>
        )}

        {drugInfo && !drugLoading && (
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-base">{drugInfo.name}</h3>
                    {drugInfo.brandName && drugInfo.brandName !== drugInfo.name && (
                      <p className="text-xs text-muted-foreground">Brand: {drugInfo.brandName}</p>
                    )}
                    {drugInfo.genericName && drugInfo.genericName.toLowerCase() !== drugInfo.name.toLowerCase() && (
                      <p className="text-xs text-muted-foreground">Generic: {drugInfo.genericName}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 bg-primary/5 text-primary border-primary/20">
                    FDA Data
                  </Badge>
                </div>
                {drugInfo.drugClass && (
                  <p className="text-xs mt-1 text-muted-foreground">
                    <span className="font-medium">Class:</span> {drugInfo.drugClass}
                  </p>
                )}
              </div>

              {/* Adverse Reactions */}
              {drugInfo.adverseReactions.length > 0 && (
                <Section
                  id="adverse"
                  label="Side Effects & Adverse Reactions"
                  icon={<Zap className="h-4 w-4 text-destructive" />}
                  expanded={expandedSection === "adverse"}
                  onToggle={() => toggle("adverse")}
                >
                  <ul className="space-y-1">
                    {drugInfo.adverseReactions.slice(0, 5).map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                        <span className="text-destructive/60 shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Drug Interactions */}
              {drugInfo.drugInteractions.length > 0 && (
                <Section
                  id="interactions"
                  label="Drug Interactions"
                  icon={<AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />}
                  expanded={expandedSection === "interactions"}
                  onToggle={() => toggle("interactions")}
                >
                  <ul className="space-y-1">
                    {drugInfo.drugInteractions.slice(0, 5).map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                        <span className="text-[hsl(var(--warning))]/60 shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Warnings */}
              {drugInfo.warnings.length > 0 && (
                <Section
                  id="warnings"
                  label="Warnings"
                  icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
                  expanded={expandedSection === "warnings"}
                  onToggle={() => toggle("warnings")}
                >
                  <ul className="space-y-1">
                    {drugInfo.warnings.slice(0, 4).map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                        <span className="text-destructive/60 shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Indications */}
              {drugInfo.indications.length > 0 && (
                <Section
                  id="indications"
                  label="Indications"
                  icon={<Pill className="h-4 w-4 text-primary" />}
                  expanded={expandedSection === "indications"}
                  onToggle={() => toggle("indications")}
                >
                  <ul className="space-y-1">
                    {drugInfo.indications.slice(0, 4).map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                        <span className="text-primary/60 shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <div className="flex items-start gap-1.5 pt-1 border-t border-border/50">
                <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Data sourced from FDA drug label database (openFDA). For informational purposes only — always consult your prescriber or pharmacist.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Section({
  id, label, icon, expanded, onToggle, children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 bg-muted/20">
          {children}
        </div>
      )}
    </div>
  );
}
