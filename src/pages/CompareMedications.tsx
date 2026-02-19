import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, AlertTriangle, Activity, Brain, CheckCircle2,
  ChevronDown, ChevronUp, Info, GitCompareArrows, X, Loader2, AlertCircle, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */
interface DrugInfo {
  name: string;
  genericName: string;
  brandName: string;
  drugClass: string;
  adverseReactions: string[];
  warnings: string[];
  drugInteractions: string[];
  description: string[];
  indications: string[];
  aiSummary?: {
    whatItDoes: string;
    commonSideEffects: string[];
    importantWarnings: string[];
    interactions: string[];
    bottomLine: string;
  } | null;
}

const QUICK_PAIRS = [
  ["Sumatriptan", "Rizatriptan"],
  ["Sumatriptan", "Ubrogepant"],
  ["Topiramate", "Propranolol"],
  ["Ibuprofen", "Naproxen"],
  ["Amitriptyline", "Topiramate"],
  ["Rimegepant", "Ubrogepant"],
  ["Erenumab", "Topiramate"],
];

/* ─── Helpers ─── */
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

function detectInteractions(a: DrugInfo, b: DrugInfo): string[] {
  const flags: string[] = [];
  const aClass = a.drugClass.toLowerCase();
  const bClass = b.drugClass.toLowerCase();

  // Same class
  if (a.drugClass && b.drugClass && a.drugClass === b.drugClass) {
    flags.push(`Both are ${a.drugClass} — discuss with your prescriber before combining or switching.`);
  }

  // Triptan-specific
  if (aClass.includes("triptan") && bClass.includes("triptan")) {
    flags.push("Both are triptans — do NOT take within 24 hours of each other (serotonin risk).");
  }

  // Check if one drug's interaction text mentions the other
  const checkMentions = (src: DrugInfo, target: DrugInfo) => {
    const haystack = [...src.drugInteractions, ...src.warnings].join(" ").toLowerCase();
    if (
      haystack.includes(target.name.toLowerCase()) ||
      haystack.includes(target.genericName.toLowerCase()) ||
      haystack.includes(target.brandName.toLowerCase())
    ) {
      flags.push(`${src.name}'s FDA label mentions ${target.name} as a potential interaction.`);
    }
  };
  checkMentions(a, b);
  checkMentions(b, a);

  return [...new Set(flags)];
}

/* ─── Drug lookup ─── */
async function fetchDrug(name: string): Promise<DrugInfo> {
  const { data, error } = await supabase.functions.invoke("drug-lookup", {
    body: { drugName: name.trim() },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || "Drug not found in FDA database");
  return data.data as DrugInfo;
}

/* ─── Selector ─── */
function DrugSlot({
  label,
  drug,
  loading,
  error,
  onSearch,
  onClear,
  excluding,
}: {
  label: string;
  drug: DrugInfo | null;
  loading: boolean;
  error: string | null;
  onSearch: (name: string) => void;
  onClear: () => void;
  excluding?: DrugInfo | null;
}) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  if (drug) {
    return (
      <div className="flex-1 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 space-y-1.5 relative">
          <button
            onClick={onClear}
            className="absolute top-2 right-2 rounded-full p-0.5 hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <p className="font-semibold text-sm pr-5">{drug.name}</p>
          {drug.genericName && drug.genericName !== drug.name && (
            <p className="text-[10px] text-muted-foreground">{drug.genericName}</p>
          )}
          {drug.brandName && (
            <p className="text-[10px] text-muted-foreground">Brand: {drug.brandName}</p>
          )}
          {drug.drugClass && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
              {drug.drugClass}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search FDA…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 text-sm h-9"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading || !query.trim()} className="shrink-0 h-9 px-3">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
        </Button>
      </form>
      {error && (
        <p className="text-[10px] text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Compare row ─── */
function CompareRow({ label, a, b, highlight }: {
  label: string; a: React.ReactNode; b: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 gap-3 py-3 border-b border-border/50 last:border-0 ${highlight ? "bg-[hsl(var(--warning))]/3 -mx-1 px-1 rounded" : ""}`}>
      <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground -mb-1">{label}</div>
      <div className="text-xs text-foreground leading-relaxed">{a ?? <span className="text-muted-foreground">—</span>}</div>
      <div className="text-xs text-foreground leading-relaxed">{b ?? <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

/* ─── AI summary (compact, for compare view) ─── */
function AISummaryCompact({ summary, name }: { summary: NonNullable<DrugInfo["aiSummary"]>; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-medium text-primary"
      >
        <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> {name} AI Summary</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="space-y-2 pt-1">
          <p className="text-xs leading-relaxed">{summary.whatItDoes}</p>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Side effects</p>
            <TagList items={summary.commonSideEffects} color="bg-destructive/8 text-destructive/80 border-destructive/15" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Warnings</p>
            <TagList items={summary.importantWarnings} color="bg-[hsl(var(--warning))]/8 text-[hsl(var(--warning))]/90 border-[hsl(var(--warning))]/20" />
          </div>
          <div className="rounded bg-primary/8 border border-primary/15 px-2 py-1.5">
            <p className="text-[10px] italic text-primary/80">{summary.bottomLine}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */
export default function CompareMedications() {
  const [drugA, setDrugA] = useState<DrugInfo | null>(null);
  const [drugB, setDrugB] = useState<DrugInfo | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const searchA = async (name: string) => {
    setLoadingA(true); setErrorA(null); setDrugA(null);
    try { setDrugA(await fetchDrug(name)); }
    catch (e) { setErrorA(e instanceof Error ? e.message : "Not found"); }
    finally { setLoadingA(false); }
  };

  const searchB = async (name: string) => {
    setLoadingB(true); setErrorB(null); setDrugB(null);
    try { setDrugB(await fetchDrug(name)); }
    catch (e) { setErrorB(e instanceof Error ? e.message : "Not found"); }
    finally { setLoadingB(false); }
  };

  const quickPick = (a: string, b: string) => {
    searchA(a);
    searchB(b);
    setShowDetails(false);
  };

  const reset = () => {
    setDrugA(null); setDrugB(null);
    setErrorA(null); setErrorB(null);
    setShowDetails(false);
  };

  const interactions = drugA && drugB ? detectInteractions(drugA, drugB) : [];
  const bothLoaded = !!drugA && !!drugB;
  const anyLoading = loadingA || loadingB;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Search any medication in the FDA database to view its profile, or load two to compare side-by-side.
      </p>

      {/* Search slots */}
      <div className="flex gap-3 items-start">
        <DrugSlot
          label="Medication A"
          drug={drugA}
          loading={loadingA}
          error={errorA}
          onSearch={searchA}
          onClear={() => { setDrugA(null); setErrorA(null); }}
          excluding={drugB}
        />
        <div className="pt-7 shrink-0 text-muted-foreground">
          <GitCompareArrows className="h-5 w-5" />
        </div>
        <DrugSlot
          label="Medication B (optional)"
          drug={drugB}
          loading={loadingB}
          error={errorB}
          onSearch={searchB}
          onClear={() => { setDrugB(null); setErrorB(null); }}
          excluding={drugA}
        />
      </div>

      {/* Clear button */}
      {(drugA || drugB) && (
        <Button variant="outline" size="sm" onClick={reset} className="flex items-center gap-2">
          <X className="h-3.5 w-3.5" /> Clear all
        </Button>
      )}

      {/* Loading indicator */}
      {anyLoading && (
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Looking up in FDA database…</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fetching clinical data + generating AI summary</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick pairs */}
      {!drugA && !drugB && !anyLoading && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Quick compare:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PAIRS.map(([a, b]) => (
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

      {/* Single drug profile */}
      {drugA && !drugB && !anyLoading && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Medication profile</p>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-bold text-base font-serif">{drugA.name}</p>
                {drugA.genericName && drugA.genericName !== drugA.name && (
                  <p className="text-xs text-muted-foreground">Generic: {drugA.genericName}</p>
                )}
                {drugA.brandName && <p className="text-xs text-muted-foreground">Brand: {drugA.brandName}</p>}
                {drugA.drugClass && (
                  <Badge variant="outline" className="mt-1 text-[10px] bg-primary/10 text-primary border-primary/20">
                    {drugA.drugClass}
                  </Badge>
                )}
              </div>
              {drugA.indications.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Indications</p>
                  <p className="text-xs leading-relaxed">{drugA.indications[0]}</p>
                </div>
              )}
              {drugA.description.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Description</p>
                  <p className="text-xs leading-relaxed">{drugA.description[0]}</p>
                </div>
              )}
              {drugA.aiSummary && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Common side effects</p>
                  <TagList items={drugA.aiSummary.commonSideEffects} color="bg-destructive/8 text-destructive/80 border-destructive/15" />
                </div>
              )}
            </CardContent>
          </Card>
          {drugA.aiSummary && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                <Sparkles className="h-3.5 w-3.5" /> AI Plain-Language Summary
              </p>
              <p className="text-xs leading-relaxed">{drugA.aiSummary.whatItDoes}</p>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Important warnings</p>
                <TagList items={drugA.aiSummary.importantWarnings} color="bg-[hsl(var(--warning))]/8 text-[hsl(var(--warning))]/90 border-[hsl(var(--warning))]/20" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Key interactions</p>
                <TagList items={drugA.aiSummary.interactions} />
              </div>
              <div className="rounded-lg bg-primary/8 border border-primary/15 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-0.5">Bottom line</p>
                <p className="text-xs leading-relaxed italic">{drugA.aiSummary.bottomLine}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">Search Medication B to compare side-by-side →</p>
        </div>
      )}

      {/* Full comparison */}
      {bothLoaded && !anyLoading && drugA && drugB && (
        <div className="space-y-4">
          {/* Interaction banner */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[drugA, drugB].map((drug) => (
                  <div key={drug.name} className="space-y-1">
                    <p className="font-semibold text-sm">{drug.name}</p>
                    <p className="text-[10px] text-muted-foreground">{drug.genericName}</p>
                    {drug.drugClass && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {drug.drugClass}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {interactions.length > 0 ? (
                <div className="rounded-lg bg-destructive/8 border border-destructive/25 p-3 space-y-1.5">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" /> Interaction Warning
                  </p>
                  {interactions.map((ix, i) => (
                    <p key={i} className="text-xs text-destructive/90 leading-relaxed">• {ix}</p>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--severity-low))]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  No direct interaction flagged between these two medications in FDA data.
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI summaries */}
          <div className="space-y-2">
            {drugA.aiSummary && <AISummaryCompact summary={drugA.aiSummary} name={drugA.name} />}
            {drugB.aiSummary && <AISummaryCompact summary={drugB.aiSummary} name={drugB.name} />}
          </div>

          {/* Side-by-side table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Side-by-Side (FDA Data)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-border mb-1">
                <p className="text-xs font-bold">{drugA.name}</p>
                <p className="text-xs font-bold">{drugB.name}</p>
              </div>

              <CompareRow
                label="Indications"
                a={drugA.indications[0] || "—"}
                b={drugB.indications[0] || "—"}
              />
              <CompareRow
                label="Description"
                a={drugA.description[0] || "—"}
                b={drugB.description[0] || "—"}
              />
              <CompareRow
                label="Common side effects (AI)"
                a={drugA.aiSummary ? <TagList items={drugA.aiSummary.commonSideEffects} color="bg-destructive/8 text-destructive/80 border-destructive/15" /> : "—"}
                b={drugB.aiSummary ? <TagList items={drugB.aiSummary.commonSideEffects} color="bg-destructive/8 text-destructive/80 border-destructive/15" /> : "—"}
              />

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-primary"
              >
                {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showDetails ? "Hide" : "Show"} FDA warnings, adverse reactions & interactions
              </button>

              {showDetails && (
                <>
                  <CompareRow
                    label="⚠ Key warnings (AI)"
                    a={drugA.aiSummary ? <TagList items={drugA.aiSummary.importantWarnings} color="bg-[hsl(var(--warning))]/8 text-[hsl(var(--warning))]/90 border-[hsl(var(--warning))]/20" /> : "—"}
                    b={drugB.aiSummary ? <TagList items={drugB.aiSummary.importantWarnings} color="bg-[hsl(var(--warning))]/8 text-[hsl(var(--warning))]/90 border-[hsl(var(--warning))]/20" /> : "—"}
                    highlight
                  />
                  <CompareRow
                    label="Adverse reactions (FDA)"
                    a={<TagList items={drugA.adverseReactions.slice(0, 4)} />}
                    b={<TagList items={drugB.adverseReactions.slice(0, 4)} />}
                  />
                  <CompareRow
                    label="Drug interactions (FDA)"
                    a={<TagList items={drugA.drugInteractions.slice(0, 3)} />}
                    b={<TagList items={drugB.drugInteractions.slice(0, 3)} />}
                  />
                  <CompareRow
                    label="Warnings (FDA raw)"
                    a={drugA.warnings[0] || "—"}
                    b={drugB.warnings[0] || "—"}
                    highlight
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Drug class card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-primary" /> Drug Class
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[drugA, drugB].map((drug) => (
                  <div key={drug.name} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-semibold">{drug.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{drug.drugClass || "Class not available"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 text-[10px] text-muted-foreground px-1">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>Data sourced from the FDA drug label database. For educational purposes only. Always consult your prescriber or pharmacist.</p>
          </div>
        </div>
      )}
    </div>
  );
}
