import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Zap, TrendingUp, TrendingDown, Calendar, Pill, ArrowRight, Droplets, Wind, AlertTriangle, Plus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import LogMigraineForm, { UserEntry } from "@/components/LogMigraineForm";
import SoundscapeCard from "@/components/SoundscapeCard";

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

const CALM_QUOTES = [
  { text: "This too shall pass. Be gentle with yourself.", author: "Ancient Wisdom" },
  { text: "Rest is not giving up. Rest is giving back.", author: "Mindfulness" },
  { text: "Breathe slowly. Your body knows how to heal.", author: "Self-Care" },
  { text: "Stillness is the language your body speaks when it needs care.", author: "Reflection" },
  { text: "You have survived every difficult day so far.", author: "Inner Strength" },
  { text: "Healing happens quietly, in the pauses.", author: "Wellness" },
  { text: "Let go of what you cannot control. Rest in what you can feel.", author: "Calm" },
];

function Bloom({ cx, cy, r, petals, fill, opacity }: { cx: number; cy: number; r: number; petals: number; fill: string; opacity: number }) {
  const angles = Array.from({ length: petals }, (_, i) => (i / petals) * 2 * Math.PI);
  return (
    <g transform={`translate(${cx},${cy})`} opacity={opacity}>
      {angles.map((a, i) => {
        const px = Math.cos(a) * r * 1.5;
        const py = Math.sin(a) * r * 1.5;
        return (
          <ellipse key={i} cx={px} cy={py} rx={r * 0.55} ry={r * 0.9} fill={fill}
            transform={`rotate(${(a * 180) / Math.PI + 90},${px},${py})`} />
        );
      })}
      <circle cx={0} cy={0} r={r * 0.55} fill={fill} opacity={0.7} />
      <circle cx={0} cy={0} r={r * 0.3} fill="hsl(0 0% 100%)" opacity={0.5} />
    </g>
  );
}

function WelcomeBanner() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const quoteIdx = new Date().getDate() % CALM_QUOTES.length;
  const quote = CALM_QUOTES[quoteIdx];

  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      background: "linear-gradient(145deg, hsl(262 55% 94%), hsl(195 50% 91%), hsl(318 45% 94%))",
      minHeight: "188px",
    }}>
      <svg viewBox="0 0 360 188" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <ellipse cx="300" cy="20" rx="100" ry="60" fill="hsl(270 55% 75%)" opacity="0.12" />
        <ellipse cx="50" cy="168" rx="80" ry="50" fill="hsl(148 55% 60%)" opacity="0.10" />
        <Bloom cx={318} cy={28} r={16} petals={6} fill="hsl(270 55% 68%)" opacity={0.5} />
        <Bloom cx={38} cy={158} r={13} petals={5} fill="hsl(148 52% 55%)" opacity={0.45} />
        <Bloom cx={18} cy={32} r={9} petals={6} fill="hsl(318 48% 72%)" opacity={0.38} />
        <Bloom cx={340} cy={150} r={10} petals={5} fill="hsl(148 50% 50%)" opacity={0.38} />
        <Bloom cx={175} cy={14} r={6} petals={5} fill="hsl(252 50% 70%)" opacity={0.28} />
        <Bloom cx={280} cy={172} r={8} petals={6} fill="hsl(270 45% 72%)" opacity={0.3} />
        <path d="M318 44 Q308 90 295 138" stroke="hsl(148 45% 40%)" strokeWidth="1.2" fill="none" opacity="0.22" />
        <path d="M38 145 Q48 112 55 72" stroke="hsl(148 45% 40%)" strokeWidth="1.2" fill="none" opacity="0.22" />
        <ellipse cx="308" cy="84" rx="10" ry="5" fill="hsl(148 50% 50%)" opacity="0.25" transform="rotate(-30,308,84)" />
        <ellipse cx="46" cy="112" rx="9" ry="4" fill="hsl(148 50% 50%)" opacity="0.25" transform="rotate(40,46,112)" />
        {[[80,35],[140,22],[225,142],[195,160],[105,157],[245,20]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 3 : 2.2}
            fill={i % 3 === 0 ? "hsl(270 45% 68%)" : i % 3 === 1 ? "hsl(148 48% 58%)" : "hsl(318 45% 72%)"}
            opacity={0.3 + (i % 3) * 0.05} />
        ))}
      </svg>

      <div className="relative px-5 py-5 flex flex-col gap-3" style={{ minHeight: "188px" }}>
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "hsl(265 50% 48%)" }}>
            {greeting} ✦
          </p>
          <h2 className="text-[22px] font-bold font-serif mt-0.5 leading-tight" style={{ color: "hsl(262 40% 24%)" }}>
            How are you feeling?
          </h2>
        </div>
        <div className="rounded-xl px-3.5 py-2.5" style={{ background: "hsl(0 0% 100% / 0.48)", backdropFilter: "blur(4px)" }}>
          <p className="text-[12.5px] font-serif italic leading-relaxed" style={{ color: "hsl(262 35% 28%)" }}>
            "{quote.text}"
          </p>
          <p className="text-[10px] mt-1 font-medium" style={{ color: "hsl(262 25% 50%)" }}>
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}

function WaterReminderCard() {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5"
      style={{ background: "linear-gradient(135deg, hsl(197 65% 93%), hsl(178 55% 90%))", boxShadow: "0 1px 8px hsl(197 55% 50% / 0.1)" }}>
      <div className="flex-shrink-0 rounded-full p-2.5" style={{ background: "hsl(197 70% 82%)" }}>
        <Droplets className="h-5 w-5" style={{ color: "hsl(197 80% 32%)" }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "hsl(197 70% 24%)" }}>Drink more water 💧</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "hsl(197 45% 38%)" }}>
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
        className="w-full flex items-center gap-2 py-6 text-base rounded-2xl"
        style={{ boxShadow: "var(--shadow-soft)" }}
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

      {/* Soundscape + quotes card */}
      <SoundscapeCard />

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
        {allEntries.slice(0, 3).map((entry) => (
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
