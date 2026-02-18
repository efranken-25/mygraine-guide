import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp, Loader2, AlertCircle, Sparkles, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types from drug-lookup edge function ─── */
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

/* ─── Suggested common migraine drugs for quick search ─── */
const QUICK_SEARCHES = [
  "Sumatriptan", "Rizatriptan", "Ubrogepant", "Rimegepant",
  "Topiramate", "Propranolol", "Amitriptyline", "Erenumab",
  "Ibuprofen", "Naproxen", "Metoprolol", "Valproate",
  "Venlafaxine", "Nortriptyline", "Candesartan", "Zolmitriptan",
];

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

function AISummaryCard({ summary }: { summary: NonNullable<DrugInfo["aiSummary"]> }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <p className="text-xs font-semibold flex items-center gap-1.5 text-primary">
        <Sparkles className="h-3.5 w-3.5" /> AI Plain-Language Summary
      </p>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">What it does</p>
        <p className="text-xs leading-relaxed">{summary.whatItDoes}</p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Common side effects</p>
        <TagList items={summary.commonSideEffects} color="bg-destructive/8 text-destructive/80 border-destructive/15" />
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Important warnings</p>
        <TagList items={summary.importantWarnings} color="bg-[hsl(var(--warning))]/8 text-[hsl(var(--warning))]/90 border-[hsl(var(--warning))]/20" />
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Key interactions</p>
        <TagList items={summary.interactions} />
      </div>

      <div className="rounded-lg bg-primary/8 border border-primary/15 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-0.5">Bottom line</p>
        <p className="text-xs leading-relaxed italic">{summary.bottomLine}</p>
      </div>
    </div>
  );
}

function DrugResultCard({ drug }: { drug: DrugInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-base font-serif">{drug.name}</p>
              {drug.genericName && drug.genericName !== drug.name && (
                <p className="text-xs text-muted-foreground">Generic: {drug.genericName}</p>
              )}
              {drug.brandName && (
                <p className="text-xs text-muted-foreground">Brand: {drug.brandName}</p>
              )}
            </div>
            {drug.drugClass && (
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0 ml-2 text-right">
                {drug.drugClass}
              </Badge>
            )}
          </div>

          {drug.description.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Description</p>
              <p className="text-xs leading-relaxed">{drug.description[0]}</p>
            </div>
          )}

          {drug.indications.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Indications</p>
              <p className="text-xs leading-relaxed">{drug.indications[0]}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Summary */}
      {drug.aiSummary && <AISummaryCard summary={drug.aiSummary} />}

      {/* Raw FDA data toggle */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> FDA Label Data
            </span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 text-xs">
              {drug.adverseReactions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Adverse Reactions (FDA)</p>
                  <ul className="space-y-1">
                    {drug.adverseReactions.slice(0, 5).map((r, i) => (
                      <li key={i} className="leading-relaxed text-muted-foreground">• {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {drug.warnings.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Warnings (FDA)</p>
                  <ul className="space-y-1">
                    {drug.warnings.slice(0, 4).map((w, i) => (
                      <li key={i} className="leading-relaxed text-muted-foreground">• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {drug.drugInteractions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Drug Interactions (FDA)</p>
                  <ul className="space-y-1">
                    {drug.drugInteractions.slice(0, 3).map((d, i) => (
                      <li key={i} className="leading-relaxed text-muted-foreground">• {d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
        <Info className="h-3 w-3 shrink-0" />
        Data sourced from FDA drug label database. For educational purposes only — always consult your provider.
      </p>
    </div>
  );
}

export default function MedLookup() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrugInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lookup = async (drugName: string) => {
    if (!drugName.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("drug-lookup", {
        body: { drugName: drugName.trim() },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Drug not found in FDA database");

      setResult(data.data as DrugInfo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookup(query);
  };

  const handleQuickSearch = (name: string) => {
    setQuery(name);
    lookup(name);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Search the FDA clinical pharmacology database for any medication.
      </p>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search any medication…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {/* Quick searches */}
      {!result && !loading && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Common migraine medications:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SEARCHES.map((name) => (
              <button
                key={name}
                onClick={() => handleQuickSearch(name)}
                className="text-xs rounded-full border border-border bg-card px-3 py-1.5 hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Looking up {query}…</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fetching FDA data + generating AI summary</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Not found</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">Try the brand name (e.g., "Imitrex" instead of "Sumatriptan") or check spelling.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && !loading && <DrugResultCard drug={result} />}
    </div>
  );
}
