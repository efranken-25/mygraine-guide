import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Zap, Clock, CheckCircle2 } from "lucide-react";
import SeveritySlider from "@/components/SeveritySlider";
import HeadMap from "@/components/HeadMap";

const SYMPTOMS = [
  "Nausea", "Aura", "Light sensitivity", "Sound sensitivity",
  "Vomiting", "Dizziness", "Neck pain", "Eye pain",
  "Fatigue", "Brain fog", "Tingling", "Visual disturbance",
];

export default function Index() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeMigraine, setActiveMigraine] = useState<string | null>(null);
  const [severity, setSeverity] = useState(5);
  const [affectedArea, setAffectedArea] = useState("full");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const startMigraine = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("migraine_entries")
      .insert({ user_id: user.id, severity, affected_area: affectedArea, symptoms, notes })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setActiveMigraine(data.id);
      toast({ title: "Migraine logged", description: "Take care. You can end it when it passes." });
    }
    setLoading(false);
  };

  const endMigraine = async () => {
    if (!activeMigraine) return;
    setLoading(true);
    const { error } = await supabase
      .from("migraine_entries")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", activeMigraine);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Migraine ended", description: "Glad it's over. Rest well." });
      setActiveMigraine(null);
      setSeverity(5);
      setAffectedArea("full");
      setSymptoms([]);
      setNotes("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Migraine Log</h1>
        <p className="text-muted-foreground">Quick-log when a migraine starts</p>
      </div>

      {activeMigraine ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-destructive animate-pulse" />
              <p className="font-medium">Migraine in progress…</p>
            </div>
            <Button onClick={endMigraine} variant="destructive" size="lg" className="w-full" disabled={loading}>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              End Migraine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <SeveritySlider value={severity} onChange={setSeverity} />

          <HeadMap value={affectedArea} onChange={setAffectedArea} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Symptoms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOMS.map((s) => (
                  <label key={s} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm cursor-pointer hover:bg-muted transition-colors">
                    <Checkbox checked={symptoms.includes(s)} onCheckedChange={() => toggleSymptom(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Textarea
            placeholder="Any additional notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />

          <Button onClick={startMigraine} size="lg" className="w-full text-base" disabled={loading}>
            <Zap className="mr-2 h-5 w-5" />
            Log Migraine
          </Button>
        </div>
      )}
    </div>
  );
}
