import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Zap, TrendingUp, TrendingDown, Calendar, Pill, ArrowRight, Droplets, Wind, AlertTriangle, Plus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import LogMigraineForm, { UserEntry } from "@/components/LogMigraineForm";

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

function WelcomeBanner() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(270 45% 92%), hsl(145 45% 88%), hsl(270 30% 85%))" }}>
      {/* Decorative SVG flowers */}
      <svg
        viewBox="0 0 360 160"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Large purple bloom — top right */}
        <g opacity="0.55" transform="translate(305,22)">
          {[0,60,120,180,240,300].map((a,i) => (
            <ellipse key={i} cx={Math.cos(a*Math.PI/180)*18} cy={Math.sin(a*Math.PI/180)*18} rx="11" ry="18"
              transform={`rotate(${a},${Math.cos(a*Math.PI/180)*18},${Math.sin(a*Math.PI/180)*18})`}
              fill="hsl(270 55% 65%)" />
          ))}
          <circle cx="0" cy="0" r="8" fill="hsl(280 60% 80%)" />
        </g>
        {/* Medium green bloom — bottom left */}
        <g opacity="0.5" transform="translate(42,118)">
          {[0,72,144,216,288].map((a,i) => (
            <ellipse key={i} cx={Math.cos(a*Math.PI/180)*14} cy={Math.sin(a*Math.PI/180)*14} rx="9" ry="15"
              transform={`rotate(${a},${Math.cos(a*Math.PI/180)*14},${Math.sin(a*Math.PI/180)*14})`}
              fill="hsl(145 50% 52%)" />
          ))}
          <circle cx="0" cy="0" r="6" fill="hsl(145 60% 75%)" />
        </g>
        {/* Small purple bloom — top left */}
        <g opacity="0.4" transform="translate(22,28)">
          {[0,60,120,180,240,300].map((a,i) => (
            <ellipse key={i} cx={Math.cos(a*Math.PI/180)*10} cy={Math.sin(a*Math.PI/180)*10} rx="6" ry="11"
              transform={`rotate(${a},${Math.cos(a*Math.PI/180)*10},${Math.sin(a*Math.PI/180)*10})`}
              fill="hsl(280 55% 65%)" />
          ))}
          <circle cx="0" cy="0" r="5" fill="hsl(270 50% 82%)" />
        </g>
        {/* Small green bloom — bottom right */}
        <g opacity="0.45" transform="translate(328,130)">
          {[0,72,144,216,288].map((a,i) => (
            <ellipse key={i} cx={Math.cos(a*Math.PI/180)*10} cy={Math.sin(a*Math.PI/180)*10} rx="6" ry="12"
              transform={`rotate(${a},${Math.cos(a*Math.PI/180)*10},${Math.sin(a*Math.PI/180)*10})`}
              fill="hsl(145 50% 48%)" />
          ))}
          <circle cx="0" cy="0" r="5" fill="hsl(145 55% 70%)" />
        </g>
        {/* Tiny scattered dots */}
        {[[80,40],[160,20],[240,135],[190,145],[100,150]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="3.5" fill={i%2===0 ? "hsl(270 45% 70%)" : "hsl(145 45% 58%)"} opacity="0.35" />
        ))}
        {/* Stems */}
        <path d="M305 40 Q298 80 290 120" stroke="hsl(145 50% 42%)" strokeWidth="1.5" fill="none" opacity="0.3" />
        <path d="M42 104 Q50 80 60 55" stroke="hsl(145 50% 42%)" strokeWidth="1.5" fill="none" opacity="0.3" />
      </svg>

      {/* Content */}
      <div className="relative px-5 py-5">
        <p className="text-xs font-medium" style={{ color: "hsl(270 45% 45%)" }}>{greeting} ✦</p>
        <h2 className="text-xl font-bold font-serif mt-0.5" style={{ color: "hsl(265 40% 30%)" }}>
          How are you feeling today?
        </h2>
        <p className="text-sm mt-1" style={{ color: "hsl(265 30% 40%)" }}>
          Track a new migraine or review your patterns below.
        </p>
      </div>
    </div>
  );
}

function WaterReminderCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: "linear-gradient(135deg, hsl(200 65% 94%), hsl(175 55% 90%))" }}>
      <div className="flex-shrink-0 rounded-full p-2" style={{ background: "hsl(200 70% 80%)" }}>
        <Droplets className="h-5 w-5" style={{ color: "hsl(200 80% 38%)" }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "hsl(200 70% 28%)" }}>
          Drink more water 💧
        </p>
        <p className="text-xs" style={{ color: "hsl(200 50% 42%)" }}>
          Dehydration is a top migraine trigger — aim for 8 glasses today.
        </p>
      </div>
    </div>
  );
}


export default function MigraineTracker() {
  const [userEntries, setUserEntries] = useState<UserEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  const allEntries = [...userEntries, ...MOCK_ENTRIES];

  const avgSeverity = (allEntries.reduce((a, e) => a + e.severity, 0) / allEntries.length).toFixed(1);
  const avgDuration = Math.round(allEntries.reduce((a, e) => a + e.durationMin, 0) / allEntries.length);

  return (
    <div className="space-y-5">
      <WelcomeBanner />
      <WaterReminderCard />

      {/* Log button */}
      <Button
        className="w-full flex items-center gap-2 py-6 text-base rounded-xl"
        onClick={() => setShowForm(true)}
      >
        <Plus className="h-5 w-5" /> Log a Migraine
      </Button>

      {showForm && (
        <LogMigraineForm
          onSave={(e) => setUserEntries([e, ...userEntries])}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Zap className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold font-serif">{allEntries.length}</p>
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

      {/* Severity trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Severity Trend
          </CardTitle>
          <p className="text-xs text-muted-foreground">Pain level (1–10) across recent migraines</p>
        </CardHeader>
        <CardContent className="pb-3">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart
              data={allEntries.slice().reverse().map((e) => ({
                date: e.date,
                severity: e.severity,
                duration: e.durationMin,
              }))}
              margin={{ top: 6, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.split(" ")[1]}
              />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 3, 6, 10]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                labelStyle={{ fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 2 }}
                formatter={(value: number, name: string) => [
                  name === "severity" ? `${value} / 10` : `${Math.floor(value / 60)}h ${value % 60}m`,
                  name === "severity" ? "Severity" : "Duration",
                ]}
              />
              <ReferenceLine y={7} stroke="hsl(var(--destructive))" strokeDasharray="4 2" strokeOpacity={0.4} label={{ value: "Severe", position: "insideTopRight", fontSize: 9, fill: "hsl(var(--destructive))", opacity: 0.6 }} />
              <Area
                type="monotone"
                dataKey="severity"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                fill="url(#severityGrad)"
                dot={{ r: 4, fill: "hsl(var(--destructive))", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "hsl(var(--destructive))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend / quick stats */}
          <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-muted-foreground">
            <span>← Oldest</span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-destructive/70" />
              Severity (1–10)
              <span className="ml-2 border-l border-destructive/30 pl-2 text-destructive/60">— Severe threshold</span>
            </span>
            <span>Newest →</span>
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
                value={(count / allEntries.length) * 100}
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
                     Used during {allEntries.filter((e) => e.meds.includes(med.name)).length} of {allEntries.length} migraines this month
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
        {allEntries.slice(0, 6).map((entry) => (
          <Card key={entry.id} className={`overflow-hidden ${"isUserEntry" in entry ? "border-primary/30" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-medium">{entry.date}</span>
                  <span className="text-sm text-muted-foreground">· {entry.area}</span>
                  {"isUserEntry" in entry && (
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/8 px-1.5 py-0">You</Badge>
                  )}
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
