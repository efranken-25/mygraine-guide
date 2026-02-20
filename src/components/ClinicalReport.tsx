import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  CalendarIcon, FileText, Download, Brain, AlertTriangle, Pill,
  TrendingUp, CheckCircle, Loader2, ChevronDown, ChevronUp, Sparkles,
  Clock, Activity, FlaskConical,
} from "lucide-react";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface MedEffectiveness {
  helped: "yes" | "partial" | "no" | null;
  timeToReliefMin: number | null;
}

interface Entry {
  id: number | string;
  date: string;
  severity: number;
  durationMin: number;
  area: string;
  symptoms: string[];
  triggers: string[];
  meds: string[];
  medEffectiveness?: Record<string, MedEffectiveness>;
  hormonalStatus?: string[];
  sleep?: number;
  caffeine?: number;
  stress?: string;
  skippedMeal?: boolean;
  notes?: string;
}

interface AIReport {
  executiveSummary: string;
  patternInsights: string[];
  triggerAnalysis: string;
  medicationSummary: string;
  anomalies: string[];
  clinicalRecommendations: string[];
  hormonalNotes: string;
}

interface Props {
  entries: Entry[];
}

function minToHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function severityColor(s: number) {
  if (s <= 3) return "hsl(var(--severity-low))";
  if (s <= 6) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

const SECTION_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(var(--severity-low))",
];

export default function ClinicalReport({ entries }: Props) {
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateFrom, setDateFrom] = useState<Date>(defaultFrom);
  const [dateTo, setDateTo] = useState<Date>(today);
  const [patientNotes, setPatientNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter entries to date range
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Try to parse the date string — entries may have "Mar 26" style dates
      const raw = e.date;
      // Handle ISO date strings
      if (raw.includes("-")) {
        try {
          const d = parseISO(raw);
          return isWithinInterval(d, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
        } catch { return true; }
      }
      // For display-only dates like "Mar 26", keep all (they're mock/demo)
      return true;
    });
  }, [entries, dateFrom, dateTo]);

  // Stats
  const stats = useMemo(() => {
    if (!filteredEntries.length) return null;
    const avgSev = filteredEntries.reduce((a, e) => a + e.severity, 0) / filteredEntries.length;
    const avgDur = filteredEntries.reduce((a, e) => a + e.durationMin, 0) / filteredEntries.length;
    const allTriggers = filteredEntries.flatMap((e) => e.triggers);
    const triggerMap: Record<string, number> = {};
    allTriggers.forEach((t) => { triggerMap[t] = (triggerMap[t] || 0) + 1; });
    const topTriggers = Object.entries(triggerMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const severityDist = [
      { name: "Mild (1–3)", value: filteredEntries.filter((e) => e.severity <= 3).length, color: "hsl(var(--severity-low))" },
      { name: "Moderate (4–6)", value: filteredEntries.filter((e) => e.severity > 3 && e.severity <= 6).length, color: "hsl(var(--warning))" },
      { name: "Severe (7–10)", value: filteredEntries.filter((e) => e.severity > 6).length, color: "hsl(var(--destructive))" },
    ].filter((d) => d.value > 0);
    const hormonalEntries = filteredEntries.filter((e) => e.hormonalStatus?.length);
    const hormonalMap: Record<string, number> = {};
    hormonalEntries.forEach((e) => e.hormonalStatus?.forEach((h) => { hormonalMap[h] = (hormonalMap[h] || 0) + 1; }));
    return { avgSev, avgDur, topTriggers, severityDist, hormonalMap };
  }, [filteredEntries]);

  // Timeline data for chart
  const timelineData = useMemo(() =>
    filteredEntries.slice().reverse().map((e, i) => ({
      name: e.date,
      severity: e.severity,
      duration: e.durationMin,
      idx: i,
    })),
    [filteredEntries]
  );

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setAiReport(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-report", {
        body: {
          entries: filteredEntries,
          medications: [],
          dateFrom: format(dateFrom, "PPP"),
          dateTo: format(dateTo, "PPP"),
          patientNotes,
        },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Report generation failed");
      setAiReport(data.data);
      setShowFullReport(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Clinical Report</h2>
        </div>
        {aiReport && (
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        )}
      </div>

      {/* Date range + notes */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left text-sm font-normal h-9", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)}
                    initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left text-sm font-normal h-9", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)}
                    disabled={(d) => d < dateFrom}
                    initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Patient notes for provider (optional)</Label>
            <Textarea
              placeholder="Any additional context you'd like to share with your provider…"
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              className="text-sm resize-none"
              rows={2}
            />
          </div>

          <Button className="w-full gap-2" onClick={generateReport} disabled={loading || filteredEntries.length === 0}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating report…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Clinical Report</>
            )}
          </Button>
          {filteredEntries.length === 0 && (
            <p className="text-[11px] text-center text-muted-foreground">No entries found for this date range</p>
          )}
          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats summary (always shown if entries exist) */}
      {stats && filteredEntries.length > 0 && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <Activity className="mx-auto h-4 w-4 text-primary mb-1" />
                <p className="text-xl font-bold font-serif">{filteredEntries.length}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Episodes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <TrendingUp className="mx-auto h-4 w-4 text-destructive mb-1" />
                <p className="text-xl font-bold font-serif">{stats.avgSev.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Avg severity</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <Clock className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-xl font-bold font-serif">{minToHm(Math.round(stats.avgDur))}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Avg duration</p>
              </CardContent>
            </Card>
          </div>

          {/* Severity trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Episode Severity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={timelineData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="repSevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px", padding: "6px 10px" }}
                    formatter={(v: number, name: string) => [name === "severity" ? `${v}/10` : minToHm(v), name === "severity" ? "Severity" : "Duration"]}
                  />
                  <Area type="monotone" dataKey="severity" stroke="hsl(var(--destructive))" strokeWidth={2}
                    fill="url(#repSevGrad)"
                    dot={{ r: 4, fill: "hsl(var(--destructive))", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "hsl(var(--destructive))", strokeWidth: 2, stroke: "hsl(var(--background))" }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trigger frequency */}
          {stats.topTriggers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" /> Top Triggers
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={stats.topTriggers.map(([name, val]) => ({ name, val }))} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                    <Bar dataKey="val" radius={[0, 4, 4, 0]} name="Episodes">
                      {stats.topTriggers.map(([, , ], i) => (
                        <Cell key={i} fill={SECTION_COLORS[i % SECTION_COLORS.length]} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Severity distribution */}
          {stats.severityDist.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" /> Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 space-y-2">
                {stats.severityDist.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-28 shrink-0">{d.name}</span>
                    <Progress value={(d.value / filteredEntries.length) * 100} className="flex-1 h-2" style={{ ["--progress-bg" as string]: d.color }} />
                    <span className="text-[11px] font-medium w-6 text-right">{d.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Hormonal status breakdown */}
          {Object.keys(stats.hormonalMap).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Hormonal Status During Episodes</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.hormonalMap).map(([status, count]) => (
                    <Badge key={status} variant="secondary" className="text-xs">
                      {status} <span className="ml-1 font-bold">{count}x</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* AI Report Section */}
      {aiReport && (
        <div ref={reportRef} className="space-y-4 print:space-y-3">
          {/* Report header */}
          <div className="rounded-xl border border-primary/20 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, hsl(262 55% 94%), hsl(195 50% 91%))" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "hsl(265 50% 48%)" }} />
                <p className="text-sm font-semibold" style={{ color: "hsl(262 40% 24%)" }}>AI Clinical Summary</p>
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: "hsl(265 50% 68%)", color: "hsl(265 50% 48%)" }}>
                  {format(dateFrom, "MMM d")} – {format(dateTo, "MMM d, yyyy")}
                </Badge>
              </div>
              <button onClick={() => setShowFullReport(!showFullReport)} className="text-xs text-muted-foreground flex items-center gap-1">
                {showFullReport ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {showFullReport && (
              <div className="divide-y divide-border">
                {/* Executive summary */}
                <div className="px-4 py-3 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Executive Summary</p>
                  <p className="text-sm leading-relaxed">{aiReport.executiveSummary}</p>
                </div>

                {/* Pattern insights */}
                {aiReport.patternInsights?.length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" /> Pattern Insights
                    </p>
                    <ul className="space-y-1.5">
                      {aiReport.patternInsights.map((insight, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                          <span className="leading-relaxed">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Trigger analysis */}
                {aiReport.triggerAnalysis && (
                  <div className="px-4 py-3 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-[hsl(var(--warning))]" /> Trigger Analysis
                    </p>
                    <p className="text-sm leading-relaxed">{aiReport.triggerAnalysis}</p>
                  </div>
                )}

                {/* Medication summary */}
                {aiReport.medicationSummary && (
                  <div className="px-4 py-3 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <Pill className="h-3 w-3 text-primary" /> Medication Summary
                    </p>
                    <p className="text-sm leading-relaxed">{aiReport.medicationSummary}</p>
                  </div>
                )}

                {/* Hormonal notes */}
                {aiReport.hormonalNotes && (
                  <div className="px-4 py-3 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Hormonal Patterns</p>
                    <p className="text-sm leading-relaxed">{aiReport.hormonalNotes}</p>
                  </div>
                )}

                {/* Anomalies */}
                {aiReport.anomalies?.length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" /> Anomalies / Red Flags
                    </p>
                    <ul className="space-y-1.5">
                      {aiReport.anomalies.map((a, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-destructive mt-0.5 flex-shrink-0">⚠</span>
                          <span className="leading-relaxed">{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Clinical recommendations */}
                {aiReport.clinicalRecommendations?.length > 0 && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-[hsl(var(--severity-low))]" /> Clinical Recommendations
                    </p>
                    <ul className="space-y-1.5">
                      {aiReport.clinicalRecommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-[hsl(var(--severity-low))] mt-0.5 flex-shrink-0 font-bold">{i + 1}.</span>
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Patient notes section */}
                {patientNotes && (
                  <div className="px-4 py-3 space-y-1.5 bg-muted/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Patient Notes</p>
                    <p className="text-sm leading-relaxed italic text-muted-foreground">"{patientNotes}"</p>
                  </div>
                )}

                {/* Report footer */}
                <div className="px-4 py-2 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground text-center">
                    Generated {format(new Date(), "PPP 'at' p")} · {filteredEntries.length} episode{filteredEntries.length !== 1 ? "s" : ""} analyzed · AI-assisted, not a clinical diagnosis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
