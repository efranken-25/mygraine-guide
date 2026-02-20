import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Clock, Zap, TrendingUp, TrendingDown, Calendar, Pill, ArrowRight, Droplets, Wind, AlertTriangle, FileText } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import ClinicalReport from "@/components/ClinicalReport";
import { SAMPLE_MIGRAINE_DATA } from "@/lib/sampleMigraineData";

// Use the most recent 8 March entries for history display (sorted newest first)
const MOCK_ENTRIES = SAMPLE_MIGRAINE_DATA
  .filter((e) => e.isoDate.startsWith("2026-03"))
  .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
  .slice(0, 8);

const MED_EFFECTIVENESS = [
  { name: "Topiramate", dosage: "50mg", status: "active", period: "8 weeks", avgSeverityBefore: 7.8, avgSeverityDuring: 6.4, frequencyBefore: 8, frequencyDuring: 5, verdict: "moderate" },
  { name: "Propranolol", dosage: "80mg", status: "discontinued", period: "12 weeks", avgSeverityBefore: 7.8, avgSeverityDuring: 7.5, frequencyBefore: 8, frequencyDuring: 7, verdict: "ineffective" },
  { name: "Sumatriptan", dosage: "100mg", status: "active", period: "Acute use", avgSeverityBefore: null, avgSeverityDuring: null, frequencyBefore: null, frequencyDuring: null, verdict: "rescue" },
];

const ALL_TRIGGERS = MOCK_ENTRIES.flatMap((e) => e.triggers);
const triggerCounts: Record<string, number> = {};
ALL_TRIGGERS.forEach((t) => { triggerCounts[t] = (triggerCounts[t] || 0) + 1; });
const TOP_TRIGGERS = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

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

function HistoryTab({ allEntries }: { allEntries: typeof MOCK_ENTRIES }) {
  const avgSeverity = (allEntries.reduce((a, e) => a + e.severity, 0) / allEntries.length).toFixed(1);
  const avgDuration = Math.round(allEntries.reduce((a, e) => a + e.durationMin, 0) / allEntries.length);

  return (
    <div className="space-y-5">
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
              data={allEntries.slice().reverse().map((e) => ({ date: e.date, severity: e.severity, duration: e.durationMin }))}
              margin={{ top: 6, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => v.split(" ")[1]} />
              <YAxis domain={[0, 10]} ticks={[0, 3, 6, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", padding: "8px 12px" }}
                labelStyle={{ fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 2 }}
                formatter={(value: number, name: string) => [
                  name === "severity" ? `${value} / 10` : `${Math.floor(value / 60)}h ${value % 60}m`,
                  name === "severity" ? "Severity" : "Duration",
                ]}
              />
              <ReferenceLine y={7} stroke="hsl(var(--destructive))" strokeDasharray="4 2" strokeOpacity={0.4} label={{ value: "Severe", position: "insideTopRight", fontSize: 9, fill: "hsl(var(--destructive))", opacity: 0.6 }} />
              <Area type="monotone" dataKey="severity" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#severityGrad)" dot={{ r: 4, fill: "hsl(var(--destructive))", strokeWidth: 0 }} activeDot={{ r: 6, fill: "hsl(var(--destructive))", strokeWidth: 2, stroke: "hsl(var(--background))" }} />
            </AreaChart>
          </ResponsiveContainer>
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
              <Progress value={(count / allEntries.length) * 100} className="flex-1 h-1.5 [&>div]:bg-[hsl(var(--warning))]" />
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
                      <Progress value={((med.avgSeverityBefore! - med.avgSeverityDuring!) / med.avgSeverityBefore!) * 100} className="h-1.5 [&>div]:bg-[hsl(var(--severity-low))]" />
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

      {/* Recent entries */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Entries</h2>
        {allEntries.slice(0, 3).map((entry) => (
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
              <div className="flex flex-wrap gap-1.5 mb-2">
                {entry.symptoms.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                ))}
              </div>
              {entry.triggers.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {entry.triggers.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
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

export default function MigraineHistory() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Migraine History</h1>
        <p className="text-muted-foreground">Trends, triggers, and clinical reports</p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="history" className="gap-1.5">
            <Brain className="h-3.5 w-3.5" /> History
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Clinical Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <HistoryTab allEntries={MOCK_ENTRIES} />
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <ClinicalReport entries={MOCK_ENTRIES} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
