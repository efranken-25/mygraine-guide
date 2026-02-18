import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, Zap, TrendingUp, TrendingDown, Calendar, Pill, ArrowRight, Droplets, Wind, AlertTriangle } from "lucide-react";

// Derived from uploaded dummy data — recent migraine entries with full detail
const MOCK_ENTRIES = [
  {
    id: 1,
    date: "Mar 26",
    severity: 10,
    durationMin: 213,
    area: "Periorbital",
    symptoms: ["Severe Head Pain", "Nausea", "Light Sensitivity"],
    triggers: ["Travel", "Stress", "Caffeine"],
    meds: ["Eletriptan"],
    weather: "Cloudy",
    sleep: 6.7,
    caffeine: 151,
    stress: "Very High",
    skippedMeal: false,
    notes: "Travel day; irregular meals",
  },
  {
    id: 2,
    date: "Mar 24",
    severity: 8,
    durationMin: 66,
    area: "Occipital",
    symptoms: ["Throbbing Pain", "Neck Tension", "Nausea"],
    triggers: ["Caffeine", "Poor Sleep", "Rain/Pressure"],
    meds: ["Rizatriptan"],
    weather: "Light Rain",
    sleep: 4.4,
    caffeine: 224,
    stress: "Very High",
    skippedMeal: false,
    notes: "Travel day; irregular meals",
  },
  {
    id: 3,
    date: "Mar 21",
    severity: 7,
    durationMin: 149,
    area: "Right Orbital",
    symptoms: ["Eye Pain", "Light Sensitivity", "Throbbing"],
    triggers: ["Bright Light", "Skipped Meal", "Hormonal/Menstrual"],
    meds: ["Ibuprofen"],
    weather: "Clear",
    sleep: 7.3,
    caffeine: 94,
    stress: "High",
    skippedMeal: true,
    notes: "Lots of meetings in bright room",
  },
  {
    id: 4,
    date: "Mar 18",
    severity: 9,
    durationMin: 129,
    area: "Bilateral Temporal",
    symptoms: ["Severe Head Pain", "Vomiting", "Sound Sensitivity", "Aura"],
    triggers: ["Weather/Storm", "Travel", "Skipped Meal", "Caffeine"],
    meds: ["Zolmitriptan"],
    weather: "Storm",
    sleep: 7.6,
    caffeine: 235,
    stress: "Very High",
    skippedMeal: true,
    notes: "Travel day; irregular meals",
  },
  {
    id: 5,
    date: "Mar 13",
    severity: 9,
    durationMin: 82,
    area: "Frontal",
    symptoms: ["Severe Head Pain", "Nausea", "Aura", "Brain Fog"],
    triggers: ["Stress", "Weather/Storm", "Skipped Meal", "Poor Sleep"],
    meds: ["Sumatriptan"],
    weather: "Thunderstorm",
    sleep: 4.4,
    caffeine: 13,
    stress: "Very High",
    skippedMeal: true,
    notes: "Argued with colleague; thunderstorm",
  },
  {
    id: 6,
    date: "Mar 9",
    severity: 8,
    durationMin: 173,
    area: "Left Temporal",
    symptoms: ["Throbbing Pain", "Neck Tension", "Fatigue"],
    triggers: ["Barometric Pressure", "Caffeine"],
    meds: ["Naproxen"],
    weather: "Foggy",
    sleep: 6.9,
    caffeine: 168,
    stress: "Moderate",
    skippedMeal: false,
    notes: "Outdoor walk; low phone use",
  },
  {
    id: 7,
    date: "Mar 8",
    severity: 9,
    durationMin: 51,
    area: "Vertex",
    symptoms: ["Severe Head Pain", "Nausea", "Dizziness"],
    triggers: ["Travel", "Caffeine", "Stress", "Weather/Storm"],
    meds: ["Ibuprofen"],
    weather: "Snow",
    sleep: 5.9,
    caffeine: 260,
    stress: "Very High",
    skippedMeal: false,
    notes: "Travel day; irregular meals",
  },
  {
    id: 8,
    date: "Mar 7",
    severity: 7,
    durationMin: 135,
    area: "Right Orbital",
    symptoms: ["Eye Pain", "Screen Fatigue", "Neck Tension", "Brain Fog"],
    triggers: ["Screen Time", "Caffeine", "Poor Sleep"],
    meds: ["Naproxen"],
    weather: "Foggy",
    sleep: 4.2,
    caffeine: 249,
    stress: "Very High",
    skippedMeal: false,
    notes: "Long coding session; forgot breaks",
  },
];

const MED_EFFECTIVENESS = [
  {
    name: "Topiramate",
    dosage: "50mg",
    status: "active",
    period: "8 weeks",
    avgSeverityBefore: 7.8,
    avgSeverityDuring: 6.4,
    frequencyBefore: 8,
    frequencyDuring: 5,
    verdict: "moderate",
  },
  {
    name: "Propranolol",
    dosage: "80mg",
    status: "discontinued",
    period: "12 weeks",
    avgSeverityBefore: 7.8,
    avgSeverityDuring: 7.5,
    frequencyBefore: 8,
    frequencyDuring: 7,
    verdict: "ineffective",
  },
  {
    name: "Sumatriptan",
    dosage: "100mg",
    status: "active",
    period: "Acute use",
    avgSeverityBefore: null,
    avgSeverityDuring: null,
    frequencyBefore: null,
    frequencyDuring: null,
    verdict: "rescue",
  },
];

// Trigger frequency across all entries
const ALL_TRIGGERS = MOCK_ENTRIES.flatMap((e) => e.triggers);
const triggerCounts: Record<string, number> = {};
ALL_TRIGGERS.forEach((t) => { triggerCounts[t] = (triggerCounts[t] || 0) + 1; });
const TOP_TRIGGERS = Object.entries(triggerCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

function minToHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function severityColor(s: number) {
  if (s <= 3) return "bg-[hsl(var(--severity-low))] text-white";
  if (s <= 6) return "bg-[hsl(var(--severity-mid))] text-[hsl(var(--warning-foreground))]";
  return "bg-[hsl(var(--severity-high))] text-white";
}

function verdictStyle(v: string) {
  if (v === "effective") return { label: "Effective", color: "text-[hsl(var(--severity-low))]", bg: "bg-[hsl(var(--severity-low))]/10 border-[hsl(var(--severity-low))]/20" };
  if (v === "moderate") return { label: "Moderate help", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/20" };
  if (v === "ineffective") return { label: "Ineffective", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" };
  return { label: "Rescue med", color: "text-primary", bg: "bg-primary/10 border-primary/20" };
}

export default function MigraineTracker() {
  const avgSeverity = (MOCK_ENTRIES.reduce((a, e) => a + e.severity, 0) / MOCK_ENTRIES.length).toFixed(1);
  const avgDuration = Math.round(MOCK_ENTRIES.reduce((a, e) => a + e.durationMin, 0) / MOCK_ENTRIES.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Migraine Tracker</h1>
        <p className="text-muted-foreground">Your recent migraine history</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Zap className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold font-serif">{MOCK_ENTRIES.length}</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingUp className="mx-auto h-5 w-5 text-destructive mb-1" />
            <p className="text-2xl font-bold font-serif">{avgSeverity}</p>
            <p className="text-xs text-muted-foreground">Avg severity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Clock className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-2xl font-bold font-serif">{minToHm(avgDuration)}</p>
            <p className="text-xs text-muted-foreground">Avg duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Severity trend mini chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Severity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-24">
            {MOCK_ENTRIES.slice().reverse().map((e) => (
              <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-md ${severityColor(e.severity)} transition-all`}
                  style={{ height: `${(e.severity / 10) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{e.date.split(" ")[1]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top triggers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" /> Top Triggers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {TOP_TRIGGERS.map(([trigger, count]) => (
            <div key={trigger} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{trigger}</span>
              <Progress
                value={(count / MOCK_ENTRIES.length) * 100}
                className="flex-1 h-1.5 [&>div]:bg-[hsl(var(--warning))]"
              />
              <span className="text-xs font-medium w-8 text-right">{count}x</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Medication effectiveness */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" /> Medication Effectiveness
        </h2>
        {MED_EFFECTIVENESS.map((med) => {
          const style = verdictStyle(med.verdict);
          return (
            <Card key={med.name} className={style.bg}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{med.name}</span>
                    <span className="text-sm text-muted-foreground ml-1.5">{med.dosage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs capitalize ${style.bg}`}>{style.label}</Badge>
                    {med.status === "discontinued" && (
                      <Badge variant="secondary" className="text-xs text-muted-foreground">Stopped</Badge>
                    )}
                  </div>
                </div>

                {med.avgSeverityBefore !== null && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Avg severity</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{med.avgSeverityBefore}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className={`font-bold ${style.color}`}>{med.avgSeverityDuring}</span>
                          {med.avgSeverityDuring! < med.avgSeverityBefore! ? (
                            <TrendingDown className="h-3 w-3 text-[hsl(var(--severity-low))]" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      </div>
                      <Progress
                        value={((med.avgSeverityBefore! - med.avgSeverityDuring!) / med.avgSeverityBefore!) * 100}
                        className="h-1.5 [&>div]:bg-[hsl(var(--severity-low))]"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Monthly frequency</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{med.frequencyBefore}/mo</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className={`font-bold ${style.color}`}>{med.frequencyDuring}/mo</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Tracked over {med.period}</p>
                  </>
                )}

                {med.verdict === "rescue" && (
                  <p className="text-xs text-muted-foreground">
                    Used during {MOCK_ENTRIES.filter((e) => e.meds.includes(med.name)).length} of {MOCK_ENTRIES.length} migraines this month
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Entry list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Entries</h2>
        {MOCK_ENTRIES.map((entry) => (
          <Card key={entry.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-medium">{entry.date}</span>
                  <span className="text-sm text-muted-foreground">· {entry.area}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{minToHm(entry.durationMin)}</Badge>
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${severityColor(entry.severity)}`}>
                    {entry.severity}
                  </span>
                </div>
              </div>

              {/* Symptoms */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {entry.symptoms.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                ))}
              </div>

              {/* Triggers */}
              {entry.triggers.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {entry.triggers.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Context row */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1.5">
                <span className="flex items-center gap-0.5"><Wind className="h-3 w-3" /> {entry.weather}</span>
                <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> Sleep {entry.sleep}h</span>
                <span className="flex items-center gap-0.5"><Droplets className="h-3 w-3" /> {entry.caffeine}mg caffeine</span>
                {entry.skippedMeal && <span className="text-[hsl(var(--warning))]">Skipped meal</span>}
              </div>

              {entry.meds.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                  <Pill className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{entry.meds.join(", ")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
