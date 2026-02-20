import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Clock, Phone, Search,
  ChevronDown, ChevronUp, CheckCircle2,
  Navigation, ShieldCheck, Zap, XCircle,
  Stethoscope, FlaskConical, Info, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ─── PBM / pharmacy network map ─────────────────────────────────────────── */
const PBM_NETWORKS: Record<string, string[]> = {
  "express scripts": ["Walgreens", "Rite Aid", "Jewel-Osco", "Albertsons", "Safeway", "H-E-B", "Meijer", "Hy-Vee"],
  "evernorth":       ["Walgreens", "Rite Aid", "Jewel-Osco", "Albertsons", "Safeway", "Meijer"],
  "cvs caremark":    ["CVS", "Target", "Walgreens", "Jewel-Osco", "Kroger", "Mariano's", "Walmart", "Costco", "Rite Aid"],
  "caremark":        ["CVS", "Target", "Walgreens", "Jewel-Osco", "Kroger", "Mariano's", "Walmart"],
  "optumrx":         ["Walgreens", "CVS", "Walmart", "Costco", "Kroger", "Mariano's", "Jewel-Osco", "Rite Aid", "Target"],
  "optum":           ["Walgreens", "CVS", "Walmart", "Costco", "Kroger", "Mariano's", "Jewel-Osco"],
  "humana":          ["Walgreens", "Walmart", "Kroger", "Mariano's", "CVS", "Costco", "Rite Aid"],
  "blue cross":      ["Walgreens", "CVS", "Walmart", "Kroger", "Mariano's", "Costco", "Rite Aid", "Jewel-Osco"],
  "bcbs":            ["Walgreens", "CVS", "Walmart", "Kroger", "Mariano's", "Costco", "Rite Aid", "Jewel-Osco"],
  "aetna":           ["Walgreens", "CVS", "Walmart", "Kroger", "Mariano's", "Costco", "Rite Aid"],
  "cigna":           ["Walgreens", "CVS", "Walmart", "Costco", "Rite Aid", "Meijer", "Jewel-Osco"],
  "united":          ["Walgreens", "CVS", "Walmart", "Kroger", "Mariano's", "Costco", "Rite Aid"],
};

function getInNetworkChains(carrier: string): string[] | null {
  const lc = carrier.toLowerCase();
  for (const [key, chains] of Object.entries(PBM_NETWORKS)) {
    if (lc.includes(key) || key.includes(lc)) return chains;
  }
  return null;
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ApiDoctor {
  id: string;
  npi: string;
  name: string;
  title: string;
  specialty: string;
  practice: string;
  address: string;
  phone: string;
  state: string;
}

interface ApiPharmacy {
  id: string;
  npi: string;
  name: string;
  chain: string;
  address: string;
  phone: string;
  specialty: string;
}

interface SavedPlan {
  id: string;
  plan_type: string;
  carrier: string;
  plan_name: string | null;
}

/* ─── Doctor card ────────────────────────────────────────────────────────── */
function DoctorCard({ doc, isExpanded, onToggle }: { doc: ApiDoctor; isExpanded: boolean; onToggle: () => void }) {
  return (
    <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-md" onClick={onToggle}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{doc.name}</span>
              {doc.title && <span className="text-xs text-muted-foreground">{doc.title}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.practice}</p>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{doc.specialty}</Badge>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{doc.address}</span>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/40 rounded-lg p-2">
                <p className="text-muted-foreground text-[10px]">NPI Number</p>
                <p className="font-medium font-mono">{doc.npi}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2">
                <p className="text-muted-foreground text-[10px]">Specialty</p>
                <p className="font-medium">{doc.specialty}</p>
              </div>
            </div>
            {doc.phone && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={(e) => { e.stopPropagation(); window.open(`tel:${doc.phone}`); }}>
                  <Phone className="h-3.5 w-3.5" /> {doc.phone}
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-center mt-2">
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Pharmacy card ──────────────────────────────────────────────────────── */
function PharmacyCard({ pharmacy, inNetwork }: { pharmacy: ApiPharmacy; inNetwork: boolean | null }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${inNetwork === true ? "border-[hsl(var(--severity-low))]/30" : inNetwork === false ? "border-border opacity-75" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{pharmacy.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{pharmacy.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          {inNetwork === true && (
            <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--severity-low))] font-medium">
              <CheckCircle2 className="h-3 w-3" /> In-Network
            </div>
          )}
          {inNetwork === false && (
            <div className="flex items-center gap-1 text-[10px] text-destructive font-medium">
              <XCircle className="h-3 w-3" /> Out-of-Network
            </div>
          )}
          {inNetwork === null && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Info className="h-3 w-3" /> Network unknown
            </div>
          )}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{pharmacy.specialty}</Badge>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
            <div className="bg-muted/40 rounded-lg p-2 text-xs">
              <p className="text-muted-foreground text-[10px]">NPI Number</p>
              <p className="font-medium font-mono">{pharmacy.npi}</p>
            </div>
            {pharmacy.phone && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={(e) => { e.stopPropagation(); window.open(`tel:${pharmacy.phone}`); }}>
                  <Phone className="h-3.5 w-3.5" /> {pharmacy.phone}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center mt-2">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Neurologists tab ───────────────────────────────────────────────────── */
function NeurologistsTab() {
  const [zip, setZip] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const handleSearch = async () => {
    const clean = zip.trim();
    if (!clean) return;
    setSearched(true);
    setLoading(true);
    setError(null);
    setExpandedDoc(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("provider-search", {
        body: { zip: clean, type: "doctor" },
      });
      if (fnError) throw fnError;
      setDoctors(data?.providers || []);
    } catch (e: any) {
      console.error("Search error:", e);
      setError("Failed to search providers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter ZIP code"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
            maxLength={10}
          />
        </div>
        <Button onClick={handleSearch} className="gap-1.5" disabled={!zip.trim() || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
        </Button>
      </div>

      {!searched && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-2">
            <Stethoscope className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Enter a ZIP code to find neurologists near you</p>
            <p className="text-xs text-muted-foreground">Results come from the NPI Registry (real provider data)</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Searching neurologists near {zip}…</span>
        </div>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {searched && !loading && !error && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {doctors.length} neurologist{doctors.length !== 1 ? "s" : ""} found near {zip}
            </p>
          </div>
          {doctors.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No neurologists found for this ZIP code. Try a nearby ZIP code.
              </CardContent>
            </Card>
          ) : (
            doctors.map((doc) => (
              <DoctorCard key={doc.id} doc={doc} isExpanded={expandedDoc === doc.id} onToggle={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Pharmacies tab ─────────────────────────────────────────────────────── */
function PharmaciesTab() {
  const [zip, setZip] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<ApiPharmacy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rxPlan, setRxPlan] = useState<SavedPlan | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("migraine_insurance_plans");
      if (raw) {
        const plans = JSON.parse(raw) as SavedPlan[];
        const rxMatch = plans.find((p) => p.plan_type === "pharmacy");
        if (rxMatch) setRxPlan(rxMatch);
      }
    } catch { /* ignore */ }
  }, []);

  const inNetworkChains: string[] | null = rxPlan ? getInNetworkChains(rxPlan.carrier) : null;

  function isInNetwork(pharmacy: ApiPharmacy): boolean | null {
    if (!inNetworkChains) return null;
    const nameLC = pharmacy.name.toLowerCase();
    return inNetworkChains.some((chain) => nameLC.includes(chain.toLowerCase()));
  }

  const handleSearch = async () => {
    const clean = zip.trim();
    if (!clean) return;
    setSearched(true);
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("provider-search", {
        body: { zip: clean, type: "pharmacy" },
      });
      if (fnError) throw fnError;
      setPharmacies(data?.providers || []);
    } catch (e: any) {
      console.error("Search error:", e);
      setError("Failed to search pharmacies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Sort in-network first
  const sorted = [...pharmacies].sort((a, b) => {
    const aIn = isInNetwork(a);
    const bIn = isInNetwork(b);
    if (aIn === bIn) return 0;
    if (aIn === true) return -1;
    if (bIn === true) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Plan banner */}
      {rxPlan ? (
        <Card className="border-[hsl(var(--severity-low))]/20 bg-[hsl(var(--severity-low))]/5">
          <CardContent className="p-3 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[hsl(var(--severity-low))] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Filtering by your pharmacy plan</p>
              <p className="text-xs text-muted-foreground">{rxPlan.carrier}{rxPlan.plan_name ? ` · ${rxPlan.plan_name}` : ""}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
          <CardContent className="p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">No pharmacy plan saved</p>
              <p className="text-xs text-muted-foreground">
                Add a Pharmacy / Rx Plan in <span className="font-medium">Insurance → My Plans</span> to see which pharmacies are in-network.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter ZIP code"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
            maxLength={10}
          />
        </div>
        <Button onClick={handleSearch} className="gap-1.5" disabled={!zip.trim() || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
        </Button>
      </div>

      {!searched && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-2">
            <FlaskConical className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Enter a ZIP code to find pharmacies near you</p>
            <p className="text-xs text-muted-foreground">Results come from the NPI Registry (real provider data)</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Searching pharmacies near {zip}…</span>
        </div>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {searched && !loading && !error && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sorted.length} pharmac{sorted.length !== 1 ? "ies" : "y"} found near {zip}
            </p>
          </div>
          {sorted.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No pharmacies found for this ZIP code. Try a nearby ZIP code.
              </CardContent>
            </Card>
          ) : (
            sorted.map((p) => <PharmacyCard key={p.id} pharmacy={p} inNetwork={isInNetwork(p)} />)
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function FindCare() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find Care</h1>
        <p className="text-muted-foreground">Neurologists & pharmacies near your ZIP code</p>
      </div>

      <Tabs defaultValue="neurologists" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="neurologists" className="flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" /> Neurologists
          </TabsTrigger>
          <TabsTrigger value="pharmacies" className="flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> Pharmacies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="neurologists" className="mt-4">
          <NeurologistsTab />
        </TabsContent>
        <TabsContent value="pharmacies" className="mt-4">
          <PharmaciesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
