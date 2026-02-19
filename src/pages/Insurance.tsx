import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck, Search, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, XCircle, Phone, Building2, Globe, Loader2, AlertCircle,
  Pill, X, Info, Plus, Trash2, Pencil, CreditCard, FlaskConical,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LS_KEY = "migraine_insurance_plans";

/* ─── Types ─────────────────────────────────────────── */
interface FormularyDrug {
  name: string;
  brandNames?: string[];
  drugClass?: string;
  migraineFocused?: boolean;
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

type InsurancePlanType = "primary" | "secondary" | "pharmacy";

interface SavedPlan {
  id: string;
  plan_type: InsurancePlanType;
  carrier: string;
  plan_name: string | null;
  member_id: string | null;
  group_number: string | null;
  rx_bin: string | null;
  rx_pcn: string | null;
  rx_group: string | null;
  phone: string | null;
  website: string | null;
  effective_date: string | null;
  notes: string | null;
  is_active: boolean;
}

interface PlanFormData {
  plan_type: InsurancePlanType;
  carrier: string;
  plan_name: string;
  member_id: string;
  group_number: string;
  rx_bin: string;
  rx_pcn: string;
  rx_group: string;
  phone: string;
  website: string;
  effective_date: string;
  notes: string;
}

const EMPTY_FORM: PlanFormData = {
  plan_type: "primary",
  carrier: "",
  plan_name: "",
  member_id: "",
  group_number: "",
  rx_bin: "",
  rx_pcn: "",
  rx_group: "",
  phone: "",
  website: "",
  effective_date: "",
  notes: "",
};

/* ─── Helpers ────────────────────────────────────────── */
const tierColor: Record<number, string> = {
  1: "bg-[hsl(var(--severity-low))]/15 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/30",
  2: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  3: "bg-destructive/15 text-destructive border-destructive/30",
};

const planTypeConfig: Record<InsurancePlanType, { label: string; icon: React.ElementType; color: string }> = {
  primary:   { label: "Primary Insurance",      icon: ShieldCheck,    color: "text-primary border-primary/30 bg-primary/5" },
  secondary: { label: "Secondary Insurance",    icon: CreditCard,     color: "text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5" },
  pharmacy:  { label: "Pharmacy / Rx Plan",     icon: FlaskConical,   color: "text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/30 bg-[hsl(var(--severity-low))]/5" },
};

function planTypeIcon(type: InsurancePlanType) {
  const cfg = planTypeConfig[type];
  const Icon = cfg.icon;
  return <Icon className="h-4 w-4" />;
}

/* ─── Plan card (saved) ──────────────────────────────── */
function SavedPlanCard({
  plan, onEdit, onDelete,
}: {
  plan: SavedPlan;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = planTypeConfig[plan.plan_type];
  const Icon = cfg.icon;
  const showRx = plan.plan_type === "pharmacy" || plan.rx_bin;

  return (
    <Card className={`border ${cfg.color.includes("primary") ? "border-primary/20" : cfg.color.includes("warning") ? "border-[hsl(var(--warning))]/20" : "border-[hsl(var(--severity-low))]/20"}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${cfg.color.split(" ")[0]}`} />
            <div>
              <p className="font-semibold text-sm">{plan.carrier}</p>
              {plan.plan_name && <p className="text-xs text-muted-foreground">{plan.plan_name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
            <button onClick={onEdit} className="p-1 rounded hover:bg-muted transition-colors">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={onDelete} className="p-1 rounded hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>

        {/* Key IDs */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {plan.member_id && (
            <div>
              <p className="text-xs text-muted-foreground">Member ID</p>
              <p className="font-mono font-medium text-sm">{plan.member_id}</p>
            </div>
          )}
          {plan.group_number && (
            <div>
              <p className="text-xs text-muted-foreground">Group #</p>
              <p className="font-mono font-medium text-sm">{plan.group_number}</p>
            </div>
          )}
        </div>

        {/* Toggle more */}
        {(showRx || plan.phone || plan.website || plan.effective_date || plan.notes) && (
          <button
            className="text-xs text-primary flex items-center gap-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide" : "Show"} details
          </button>
        )}

        {expanded && (
          <div className="space-y-2 pt-1 border-t border-border/50">
            {showRx && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                {plan.rx_bin && (
                  <div>
                    <p className="text-xs text-muted-foreground">RX BIN</p>
                    <p className="font-mono font-medium">{plan.rx_bin}</p>
                  </div>
                )}
                {plan.rx_pcn && (
                  <div>
                    <p className="text-xs text-muted-foreground">RX PCN</p>
                    <p className="font-mono font-medium">{plan.rx_pcn}</p>
                  </div>
                )}
                {plan.rx_group && (
                  <div>
                    <p className="text-xs text-muted-foreground">RX Group</p>
                    <p className="font-mono font-medium">{plan.rx_group}</p>
                  </div>
                )}
              </div>
            )}
            {plan.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${plan.phone.replace(/\D/g, "")}`} className="text-foreground font-medium">{plan.phone}</a>
              </div>
            )}
            {plan.website && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                <span>{plan.website}</span>
              </div>
            )}
            {plan.effective_date && (
              <p className="text-xs text-muted-foreground">Effective: {new Date(plan.effective_date).toLocaleDateString()}</p>
            )}
            {plan.notes && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1.5">{plan.notes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Add/Edit plan dialog ───────────────────────────── */
function PlanDialog({
  open, onClose, onSave, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: PlanFormData) => Promise<void>;
  initial: PlanFormData;
}) {
  const [form, setForm] = useState<PlanFormData>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial); }, [open, initial]);

  const set = (k: keyof PlanFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.carrier.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const isPharmacy = form.plan_type === "pharmacy";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial.carrier ? "Edit Insurance Plan" : "Add Insurance Plan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Plan type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Plan Type</Label>
            <Select value={form.plan_type} onValueChange={(v) => set("plan_type", v as InsurancePlanType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary Insurance</SelectItem>
                <SelectItem value="secondary">Secondary Insurance</SelectItem>
                <SelectItem value="pharmacy">Pharmacy / Rx Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Carrier */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Insurance Carrier <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Blue Cross Blue Shield, Aetna, CVS Caremark…"
              value={form.carrier}
              onChange={(e) => set("carrier", e.target.value)}
            />
          </div>

          {/* Plan name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Plan Name</Label>
            <Input placeholder="e.g. PPO Gold 1000" value={form.plan_name} onChange={(e) => set("plan_name", e.target.value)} />
          </div>

          {/* Member ID + Group */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Member ID</Label>
              <Input placeholder="e.g. XYZ123" value={form.member_id} onChange={(e) => set("member_id", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Group Number</Label>
              <Input placeholder="e.g. GRP-001" value={form.group_number} onChange={(e) => set("group_number", e.target.value)} />
            </div>
          </div>

          {/* RX fields */}
          {(isPharmacy || form.rx_bin) && (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">RX BIN</Label>
                <Input placeholder="610014" value={form.rx_bin} onChange={(e) => set("rx_bin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">RX PCN</Label>
                <Input placeholder="BCBSIL" value={form.rx_pcn} onChange={(e) => set("rx_pcn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">RX Group</Label>
                <Input placeholder="Group" value={form.rx_group} onChange={(e) => set("rx_group", e.target.value)} />
              </div>
            </div>
          )}

          {/* Show RX fields toggle for non-pharmacy */}
          {!isPharmacy && !form.rx_bin && (
            <button
              className="text-xs text-primary flex items-center gap-1"
              onClick={() => set("rx_bin", " ")}
            >
              <Plus className="h-3 w-3" /> Add RX / pharmacy info
            </button>
          )}

          {/* Phone + Website */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Member Services Phone</Label>
              <Input placeholder="1-800-XXX-XXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input placeholder="carrier.com" value={form.website} onChange={(e) => set("website", e.target.value)} />
            </div>
          </div>

          {/* Effective date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Effective Date</Label>
            <Input type="date" value={form.effective_date} onChange={(e) => set("effective_date", e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea
              placeholder="Any additional notes about this plan…"
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.carrier.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {saving ? "Saving…" : "Save Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── localStorage helpers ───────────────────────────── */
function loadFromStorage(): SavedPlan[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SavedPlan[]) : [];
  } catch {
    return [];
  }
}
function saveToStorage(plans: SavedPlan[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(plans));
}

/* ─── My Plans Tab ───────────────────────────────────── */
function MyPlansTab() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<SavedPlan[]>(() => loadFromStorage());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<SavedPlan | null>(null);
  const [initialForm, setInitialForm] = useState<PlanFormData>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const persist = (updated: SavedPlan[]) => {
    setPlans(updated);
    saveToStorage(updated);
  };

  const openAdd = (defaultType?: InsurancePlanType) => {
    setEditPlan(null);
    setInitialForm({ ...EMPTY_FORM, plan_type: defaultType ?? "primary" });
    setDialogOpen(true);
  };

  const openEdit = (p: SavedPlan) => {
    setEditPlan(p);
    setInitialForm({
      plan_type: p.plan_type,
      carrier: p.carrier,
      plan_name: p.plan_name ?? "",
      member_id: p.member_id ?? "",
      group_number: p.group_number ?? "",
      rx_bin: p.rx_bin ?? "",
      rx_pcn: p.rx_pcn ?? "",
      rx_group: p.rx_group ?? "",
      phone: p.phone ?? "",
      website: p.website ?? "",
      effective_date: p.effective_date ?? "",
      notes: p.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async (form: PlanFormData) => {
    if (editPlan) {
      const updated = plans.map((p) =>
        p.id === editPlan.id
          ? {
              ...p,
              plan_type: form.plan_type,
              carrier: form.carrier.trim(),
              plan_name: form.plan_name.trim() || null,
              member_id: form.member_id.trim() || null,
              group_number: form.group_number.trim() || null,
              rx_bin: form.rx_bin.trim() || null,
              rx_pcn: form.rx_pcn.trim() || null,
              rx_group: form.rx_group.trim() || null,
              phone: form.phone.trim() || null,
              website: form.website.trim() || null,
              effective_date: form.effective_date || null,
              notes: form.notes.trim() || null,
            }
          : p
      );
      persist(updated);
      toast({ title: "Plan updated" });
    } else {
      const newPlan: SavedPlan = {
        id: crypto.randomUUID(),
        plan_type: form.plan_type,
        carrier: form.carrier.trim(),
        plan_name: form.plan_name.trim() || null,
        member_id: form.member_id.trim() || null,
        group_number: form.group_number.trim() || null,
        rx_bin: form.rx_bin.trim() || null,
        rx_pcn: form.rx_pcn.trim() || null,
        rx_group: form.rx_group.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        effective_date: form.effective_date || null,
        notes: form.notes.trim() || null,
        is_active: true,
      };
      persist([...plans, newPlan]);
      toast({ title: "Plan added" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    persist(plans.filter((p) => p.id !== id));
    toast({ title: "Plan removed" });
    setDeleteConfirm(null);
  };

  const primary   = plans.filter((p) => p.plan_type === "primary");
  const secondary = plans.filter((p) => p.plan_type === "secondary");
  const pharmacy  = plans.filter((p) => p.plan_type === "pharmacy");

  return (
    <div className="space-y-6">
      {/* Section builder */}
      {(
        [
          { type: "primary" as InsurancePlanType, list: primary },
          { type: "secondary" as InsurancePlanType, list: secondary },
          { type: "pharmacy" as InsurancePlanType, list: pharmacy },
        ] as const
      ).map(({ type, list }) => {
        const cfg = planTypeConfig[type];
        const Icon = cfg.icon;
        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${cfg.color.split(" ")[0]}`} />
                <span className="text-sm font-semibold">{cfg.label}</span>
                {list.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{list.length}</Badge>
                )}
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openAdd(type)}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>

            {list.length === 0 ? (
              <button
                onClick={() => openAdd(type)}
                className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 py-4 text-sm text-muted-foreground transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add {cfg.label}
              </button>
            ) : (
              <div className="space-y-2">
                {list.map((p) => (
                  <SavedPlanCard
                    key={p.id}
                    plan={p}
                    onEdit={() => openEdit(p)}
                    onDelete={() => setDeleteConfirm(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add plan dialog */}
      <PlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initial={initialForm}
      />

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove this plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this insurance plan from your profile.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Remove Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Pharmacy helpdesk card ─────────────────────────── */
function PharmacyHelpdeskCard({ plan }: { plan: Plan }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Pharmacy Helpdesk</span>
        </div>
        <a href={`tel:${plan.pharmacyHelpdesk.replace(/[-\s]/g, "")}`} className="block text-lg font-mono font-bold text-foreground">
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
    <Card className={`cursor-pointer transition-all ${!drug.covered ? "opacity-70" : ""}`} onClick={() => setExpanded(!expanded)}>
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
            {drug.drugClass && <p className="text-[10px] text-muted-foreground">Class: {drug.drugClass}</p>}
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

/* ─── Drug class group ───────────────────────────────── */
function DrugClassGroup({ drugClass, drugs }: { drugClass: string; drugs: FormularyDrug[] }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between py-1.5 px-1 mb-1.5 group"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {drugClass} <span className="font-normal">({drugs.length})</span>
        </span>
        {collapsed ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {!collapsed && (
        <div className="space-y-1.5">
          {drugs.map((drug) => <DrugRow key={drug.name} drug={drug} />)}
        </div>
      )}
    </div>
  );
}

/* ─── Grouped formulary list ─────────────────────────── */
function GroupedDrugList({ drugs }: { drugs: FormularyDrug[] }) {
  const migraine = drugs.filter((d) => d.migraineFocused !== false);
  const other    = drugs.filter((d) => d.migraineFocused === false);

  const groupByClass = (list: FormularyDrug[]) => {
    const map = new Map<string, FormularyDrug[]>();
    for (const drug of list) {
      const cls = drug.drugClass || "Other";
      if (!map.has(cls)) map.set(cls, []);
      map.get(cls)!.push(drug);
    }
    return map;
  };

  const migraineGroups = groupByClass(migraine);
  const otherGroups    = groupByClass(other);

  return (
    <div className="space-y-4">
      {migraineGroups.size > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-primary/20" />
            <span className="text-xs font-semibold text-primary px-1">Migraine Treatments</span>
            <div className="h-px flex-1 bg-primary/20" />
          </div>
          {Array.from(migraineGroups.entries()).map(([cls, clsDrugs]) => (
            <DrugClassGroup key={cls} drugClass={cls} drugs={clsDrugs} />
          ))}
        </div>
      )}
      {otherGroups.size > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground px-1">Other Treatments</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {Array.from(otherGroups.entries()).map(([cls, clsDrugs]) => (
            <DrugClassGroup key={cls} drugClass={cls} drugs={clsDrugs} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Formulary panel for a plan ─────────────────────── */
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
              <GroupedDrugList drugs={drugs} />
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

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!selectedPlan && searched && !loading && (
        <div className="space-y-2">
          {plans.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No plans found. Try a broader search.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{plans.length} plan{plans.length !== 1 ? "s" : ""} found</p>
              {plans.map((plan) => (
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

      {selectedPlan && (
        <div className="space-y-4">
          <button className="text-xs text-primary flex items-center gap-1" onClick={() => setSelectedPlan(null)}>
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
                    {selectedPlan.state && <p className="text-xs text-muted-foreground">{selectedPlan.state}</p>}
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
        <p className="text-muted-foreground">Manage your plans, formulary & pharmacy support</p>
      </div>

      <Tabs defaultValue="myplans" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="myplans" className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> My Plans
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Compare Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="myplans" className="mt-4">
          <MyPlansTab />
        </TabsContent>
        <TabsContent value="compare" className="mt-4">
          <ComparePlansTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
