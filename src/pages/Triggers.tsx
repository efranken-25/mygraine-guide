import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Coffee, Moon, Heart, Activity, Save } from "lucide-react";

export default function Triggers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [caffeineItems, setCaffeineItems] = useState<{ type: string; amount: string }[]>([]);
  const [sleepBedtime, setSleepBedtime] = useState("");
  const [sleepWaketime, setSleepWaketime] = useState("");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [stressLevel, setStressLevel] = useState(3);
  const [bpSystolic, setBpSystolic] = useState("");
  const [bpDiastolic, setBpDiastolic] = useState("");
  const [periodActive, setPeriodActive] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setWaterGlasses(data.water_glasses ?? 0);
          setCaffeineItems(Array.isArray(data.caffeine_items) ? (data.caffeine_items as any[]) : []);
          setSleepBedtime(data.sleep_bedtime ?? "");
          setSleepWaketime(data.sleep_waketime ?? "");
          setSleepQuality(data.sleep_quality ?? 3);
          setStressLevel(data.stress_level ?? 3);
          setBpSystolic(data.bp_systolic?.toString() ?? "");
          setBpDiastolic(data.bp_diastolic?.toString() ?? "");
          setPeriodActive(data.period_active ?? false);
        }
      });
  }, [user, today]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const payload = {
      user_id: user.id,
      log_date: today,
      water_glasses: waterGlasses,
      caffeine_items: caffeineItems,
      sleep_bedtime: sleepBedtime || null,
      sleep_waketime: sleepWaketime || null,
      sleep_quality: sleepQuality,
      stress_level: stressLevel,
      bp_systolic: bpSystolic ? parseInt(bpSystolic) : null,
      bp_diastolic: bpDiastolic ? parseInt(bpDiastolic) : null,
      period_active: periodActive,
    };
    const { error } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,log_date" });

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Daily log updated." });
    }
    setLoading(false);
  };

  const addCaffeine = () => setCaffeineItems([...caffeineItems, { type: "Coffee", amount: "1 cup" }]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Triggers</h1>
        <p className="text-muted-foreground">Log today's potential triggers</p>
      </div>

      {/* Water */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4 text-primary" /> Water Intake
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}>−</Button>
            <span className="text-3xl font-bold tabular-nums font-serif w-12 text-center">{waterGlasses}</span>
            <Button variant="outline" size="icon" onClick={() => setWaterGlasses(waterGlasses + 1)}>+</Button>
            <span className="text-sm text-muted-foreground">glasses</span>
          </div>
        </CardContent>
      </Card>

      {/* Caffeine */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coffee className="h-4 w-4 text-primary" /> Caffeine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {caffeineItems.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input value={item.type} onChange={(e) => {
                const next = [...caffeineItems];
                next[i] = { ...next[i], type: e.target.value };
                setCaffeineItems(next);
              }} placeholder="Type (coffee, tea…)" />
              <Input value={item.amount} onChange={(e) => {
                const next = [...caffeineItems];
                next[i] = { ...next[i], amount: e.target.value };
                setCaffeineItems(next);
              }} placeholder="Amount" className="w-28" />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addCaffeine}>+ Add caffeine</Button>
        </CardContent>
      </Card>

      {/* Sleep */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-primary" /> Sleep
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Bedtime</Label>
              <Input type="time" value={sleepBedtime} onChange={(e) => setSleepBedtime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Wake time</Label>
              <Input type="time" value={sleepWaketime} onChange={(e) => setSleepWaketime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Quality</span>
              <span className="font-medium">{sleepQuality}/5</span>
            </div>
            <Slider value={[sleepQuality]} onValueChange={([v]) => setSleepQuality(v)} min={1} max={5} step={1} />
          </div>
        </CardContent>
      </Card>

      {/* Stress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" /> Stress Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span>Calm</span>
            <span className="font-medium">{stressLevel}/5</span>
            <span>Stressed</span>
          </div>
          <Slider value={[stressLevel]} onValueChange={([v]) => setStressLevel(v)} min={1} max={5} step={1} />
        </CardContent>
      </Card>

      {/* Blood Pressure */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-primary" /> Blood Pressure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input type="number" placeholder="Sys" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} className="w-20" />
            <span className="text-lg font-bold text-muted-foreground">/</span>
            <Input type="number" placeholder="Dia" value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} className="w-20" />
            <span className="text-sm text-muted-foreground">mmHg</span>
          </div>
        </CardContent>
      </Card>

      {/* Period */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Period active today</span>
            <Switch checked={periodActive} onCheckedChange={setPeriodActive} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} size="lg" className="w-full" disabled={loading}>
        <Save className="mr-2 h-5 w-5" />
        Save Daily Log
      </Button>
    </div>
  );
}
