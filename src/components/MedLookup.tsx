import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { MED_DB, type MedProfile } from "@/lib/medDb";

const ALL_MEDS = Object.values(MED_DB);

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

function MedCard({ med }: { med: MedProfile }) {
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

export default function MedLookup() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MedProfile | null>(null);
  const [open, setOpen] = useState(false);

  const results = searchMeds(query);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Search any medication to view its full clinical profile.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, brand, or drug class…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSelected(null); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="pl-9"
        />
        {open && (
          <div className="absolute z-20 top-full mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground text-center">No medications found</p>
            ) : results.map((m) => (
              <button
                key={m.name}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/30 last:border-0"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelected(m);
                  setQuery(m.name);
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

      {/* Browse all when no query */}
      {!query && !selected && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Browse all medications:</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_MEDS.map((m) => (
              <button
                key={m.name}
                onClick={() => { setSelected(m); setQuery(m.name); }}
                className="text-xs rounded-full border border-border bg-card px-3 py-1.5 hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && <MedCard med={selected} />}
    </div>
  );
}
