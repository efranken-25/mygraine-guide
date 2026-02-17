import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pill, Plus, Check, X, AlertTriangle, Activity, Clock, Trash2 } from "lucide-react";
import { format, subDays } from "date-fns";

type Medication = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  med_type: string;
  known_side_effects: string[];
  active: boolean;
  created_at: string;
};

type MedicationLog = {
  id: string;
  medication_id: string;
  taken_at: string;
  skipped: boolean;
  notes: string | null;
};

type HealthAlert = {
  type: "bp_high" | "bp_low" | "sleep_loss";
  message: string;
  value: string;
  date: string;
};

const COMMON_SIDE_EFFECTS = [
  "Drowsiness", "Dizziness", "Nausea", "Weight gain", "Fatigue",
  "Dry mouth", "Constipation", "Insomnia", "Headache", "Low blood pressure",
  "High blood pressure", "Mood changes", "Hair loss", "Muscle weakness",
];

export default function Medications() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [recentLogs, setRecentLogs] = useState<MedicationLog[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Add medication form
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newFrequency, setNewFrequency] = useState("daily");
  const [newType, setNewType] = useState("preventive");
  const [newSideEffects, setNewSideEffects] = useState<string[]>([]);

  const fetchMedications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as any;
    if (data) setMedications(data.map((m: any) => ({ ...m, known_side_effects: m.known_side_effects || [] })));
  }, [user]);

  const fetchRecentLogs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("medication_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("taken_at", subDays(new Date(), 7).toISOString())
      .order("taken_at", { ascending: false }) as any;
    if (data) setRecentLogs(data);
  }, [user]);

  const analyzeHealthData = useCallback(async () => {
    if (!user) return;
    const alerts: HealthAlert[] = [];
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("log_date", format(subDays(new Date(), 7), "yyyy-MM-dd"))
      .order("log_date", { ascending: false });

    if (logs) {
      for (const log of logs) {
        if (log.bp_systolic && log.bp_systolic >= 140) {
          alerts.push({ type: "bp_high", message: "High blood pressure detected — check if any medications may be contributing.", value: `${log.bp_systolic}/${log.bp_diastolic} mmHg`, date: log.log_date });
        }
        if (log.bp_systolic && log.bp_systolic <= 90) {
          alerts.push({ type: "bp_low", message: "Low blood pressure detected — some medications can cause hypotension.", value: `${log.bp_systolic}/${log.bp_diastolic} mmHg`, date: log.log_date });
        }
        if (log.sleep_quality && log.sleep_quality <= 2) {
          alerts.push({ type: "sleep_loss", message: "Poor sleep quality recorded — this may be a medication side effect.", value: `Quality: ${log.sleep_quality}/5`, date: log.log_date });
        }
      }
    }
    setHealthAlerts(alerts);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchMedications(), fetchRecentLogs(), analyzeHealthData()]).finally(() => setLoading(false));
  }, [user, fetchMedications, fetchRecentLogs, analyzeHealthData]);

  const addMedication = async () => {
    if (!user || !newName.trim()) return;
    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      name: newName.trim(),
      dosage: newDosage || null,
      frequency: newFrequency,
      med_type: newType,
      known_side_effects: newSideEffects,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Medication added" });
      setShowAddDialog(false);
      setNewName(""); setNewDosage(""); setNewFrequency("daily"); setNewType("preventive"); setNewSideEffects([]);
      fetchMedications();
    }
  };

  const toggleMedActive = async (med: Medication) => {
    await supabase.from("medications").update({ active: !med.active } as any).eq("id", med.id);
    fetchMedications();
  };

  const deleteMedication = async (id: string) => {
    await supabase.from("medications").delete().eq("id", id);
    fetchMedications();
    fetchRecentLogs();
  };

  const logDose = async (medId: string, skipped = false) => {
    if (!user) return;
    const { error } = await supabase.from("medication_logs").insert({
      user_id: user.id,
      medication_id: medId,
      skipped,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: skipped ? "Dose skipped" : "Dose logged" });
      fetchRecentLogs();
    }
  };

  const toggleSideEffect = (effect: string) => {
    setNewSideEffects(prev => prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect]);
  };

  const activeMeds = medications.filter(m => m.active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
          <p className="text-muted-foreground">Track meds & monitor side effects</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Med</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Medication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Topiramate" />
              </div>
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input value={newDosage} onChange={e => setNewDosage(e.target.value)} placeholder="e.g. 50mg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={newFrequency} onValueChange={setNewFrequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="twice_daily">Twice daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="as_needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="acute">Acute/Rescue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Known Side Effects</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SIDE_EFFECTS.map(effect => (
                    <Badge
                      key={effect}
                      variant={newSideEffects.includes(effect) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleSideEffect(effect)}
                    >
                      {effect}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={addMedication} className="w-full" disabled={!newName.trim()}>
                Add Medication
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Health alerts */}
      {healthAlerts.length > 0 && (
        <div className="space-y-2">
          {healthAlerts.slice(0, 3).map((alert, i) => (
            <Alert key={i} variant="destructive" className="border-warning/50 bg-warning/10 text-foreground [&>svg]:text-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">
                {alert.type === "bp_high" ? "High BP" : alert.type === "bp_low" ? "Low BP" : "Sleep Issue"} — {alert.date}
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                {alert.message} <span className="font-medium text-foreground">{alert.value}</span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="meds">
        <TabsList className="w-full">
          <TabsTrigger value="meds" className="flex-1">My Meds</TabsTrigger>
          <TabsTrigger value="log" className="flex-1">Log Dose</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
        </TabsList>

        {/* My Medications Tab */}
        <TabsContent value="meds" className="space-y-3 mt-4">
          {medications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Pill className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">No medications yet. Tap "Add Med" to start.</p>
              </CardContent>
            </Card>
          ) : (
            medications.map(med => (
              <Card key={med.id} className={!med.active ? "opacity-60" : ""}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{med.name}</span>
                        <Badge variant={med.med_type === "preventive" ? "secondary" : "outline"} className="text-xs shrink-0">
                          {med.med_type}
                        </Badge>
                      </div>
                      {med.dosage && <p className="text-sm text-muted-foreground">{med.dosage} · {med.frequency?.replace("_", " ")}</p>}
                      {med.known_side_effects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {med.known_side_effects.map((se: string) => (
                            <Badge key={se} variant="outline" className="text-xs bg-warning/10 border-warning/30 text-warning-foreground">
                              {se}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={med.active} onCheckedChange={() => toggleMedActive(med)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMedication(med.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Log Dose Tab */}
        <TabsContent value="log" className="space-y-3 mt-4">
          {activeMeds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Pill className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">Add an active medication first.</p>
              </CardContent>
            </Card>
          ) : (
            activeMeds.map(med => (
              <Card key={med.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{med.name}</p>
                      <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency?.replace("_", " ")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => logDose(med.id, true)}>
                        <X className="mr-1 h-3 w-3" /> Skip
                      </Button>
                      <Button size="sm" onClick={() => logDose(med.id)}>
                        <Check className="mr-1 h-3 w-3" /> Taken
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-3 mt-4">
          {recentLogs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">No dose logs in the last 7 days.</p>
              </CardContent>
            </Card>
          ) : (
            recentLogs.map(log => {
              const med = medications.find(m => m.id === log.medication_id);
              return (
                <Card key={log.id}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{med?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(log.taken_at), "MMM d, h:mm a")}</p>
                      </div>
                      <Badge variant={log.skipped ? "outline" : "secondary"} className="text-xs">
                        {log.skipped ? "Skipped" : "Taken"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
