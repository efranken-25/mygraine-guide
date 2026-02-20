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
  ResponsiveContainer, Cell,
} from "recharts";
import {
  CalendarIcon, FileText, Download, Brain, AlertTriangle, Pill,
  TrendingUp, CheckCircle, Loader2, ChevronDown, ChevronUp, Sparkles,
  Clock, Activity, FlaskConical,
} from "lucide-react";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

const SECTION_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(var(--severity-low))",
];

// ─── PDF generation ──────────────────────────────────────────────────────────

async function captureSectionAsPNG(el: HTMLElement): Promise<string> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  return canvas.toDataURL("image/png");
}

async function exportClinicalPDF(
  reportRef: React.RefObject<HTMLDivElement>,
  patientNotes: string,
  dateFrom: Date,
  dateTo: Date,
  filteredEntries: Entry[],
  stats: ReturnType<typeof computeStats>,
  aiReport: AIReport | null
) {
  if (!reportRef.current) return;

  const A4_W = 210;
  const A4_H = 297;
  const MARGIN = 14;
  const CONTENT_W = A4_W - MARGIN * 2;
  const GAP = 5;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN;

  // ── Helper: add image section ─────────────────────────────────────────────
  const addSection = async (el: HTMLElement) => {
    const imgData = await captureSectionAsPNG(el);
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
    const imgH = (canvas.height / canvas.width) * CONTENT_W;
    if (y + imgH > A4_H - MARGIN) {
      pdf.addPage();
      y = MARGIN;
    }
    pdf.addImage(imgData, "PNG", MARGIN, y, CONTENT_W, imgH);
    y += imgH + GAP;
  };

  // ── Helper: text block ────────────────────────────────────────────────────
  const addTextSection = (
    title: string,
    body: string | string[],
    opts: { color?: [number, number, number]; numbered?: boolean } = {}
  ) => {
    const titleH = 7;
    const lineH = 5.5;
    const lines = Array.isArray(body) ? body : [body];
    const totalH = titleH + lines.length * lineH + GAP;
    if (y + totalH > A4_H - MARGIN) { pdf.addPage(); y = MARGIN; }

    // Section title
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    const [r, g, b] = opts.color ?? [100, 100, 110];
    pdf.setTextColor(r, g, b);
    pdf.text(title.toUpperCase(), MARGIN, y);
    y += titleH;

    // Body
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(30, 30, 40);
    lines.forEach((line, i) => {
      const prefix = opts.numbered ? `${i + 1}.  ` : "•  ";
      const wrapped = pdf.splitTextToSize(
        Array.isArray(body) ? `${prefix}${line}` : line,
        CONTENT_W - 2
      );
      wrapped.forEach((l: string) => {
        if (y + lineH > A4_H - MARGIN) { pdf.addPage(); y = MARGIN; }
        pdf.text(l, MARGIN + (Array.isArray(body) ? 3 : 0), y);
        y += lineH;
      });
    });
    y += GAP;
  };

  // ── COVER / HEADER ────────────────────────────────────────────────────────
  pdf.setFillColor(245, 243, 255);
  pdf.rect(0, 0, A4_W, 38, "F");

  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(60, 40, 100);
  pdf.text("Migraine Clinical Report", MARGIN, 16);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 90, 130);
  pdf.text(`Period: ${format(dateFrom, "MMM d, yyyy")} – ${format(dateTo, "MMM d, yyyy")}`, MARGIN, 24);
  pdf.text(`Generated: ${format(new Date(), "PPP 'at' p")}`, MARGIN, 30);
  pdf.text(`Episodes analyzed: ${filteredEntries.length}`, MARGIN + 100, 24);

  pdf.setFontSize(7.5);
  pdf.setTextColor(150, 140, 170);
  pdf.text("AI-assisted clinical summary · Not a substitute for professional medical judgment", MARGIN, 36);

  y = 46;

  // ── HORIZONTAL RULE ───────────────────────────────────────────────────────
  pdf.setDrawColor(220, 215, 240);
  pdf.line(MARGIN, y, A4_W - MARGIN, y);
  y += 6;

  // ── SUMMARY KPIs ─────────────────────────────────────────────────────────
  if (stats) {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 100, 110);
    pdf.text("SUMMARY STATISTICS", MARGIN, y);
    y += 6;

    const kpis = [
      { label: "Total Episodes", value: String(filteredEntries.length) },
      { label: "Avg Severity (0–10)", value: stats.avgSev.toFixed(1) },
      { label: "Avg Duration", value: minToHm(Math.round(stats.avgDur)) },
      { label: "Severe Episodes (≥7)", value: String(filteredEntries.filter(e => e.severity >= 7).length) },
      { label: "Skipped Meals", value: String(filteredEntries.filter(e => e.skippedMeal).length) + " episodes" },
      { label: "Unique Triggers", value: String(new Set(filteredEntries.flatMap(e => e.triggers)).size) },
    ];

    const colW = CONTENT_W / 3;
    const rowH = 13;
    const boxPad = 3;

    kpis.forEach((kpi, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const bx = MARGIN + col * colW;
      const by = y + row * rowH;

      pdf.setFillColor(249, 248, 255);
      pdf.setDrawColor(230, 225, 245);
      pdf.roundedRect(bx, by, colW - 2, rowH - 2, 2, 2, "FD");

      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(60, 40, 100);
      pdf.text(kpi.value, bx + boxPad, by + 7.5);

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 110, 140);
      pdf.text(kpi.label, bx + boxPad, by + 11);
    });

    y += Math.ceil(kpis.length / 3) * rowH + 8;
  }

  // ── CHART SECTIONS ────────────────────────────────────────────────────────
  const sections = reportRef.current.querySelectorAll<HTMLElement>("[data-pdf-section]");
  for (const section of Array.from(sections)) {
    await addSection(section);
  }

  // ── TOP TRIGGERS TABLE ────────────────────────────────────────────────────
  if (stats && stats.topTriggers.length > 0) {
    if (y + 8 + stats.topTriggers.length * 7 > A4_H - MARGIN) { pdf.addPage(); y = MARGIN; }

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 100, 110);
    pdf.text("TOP TRIGGERS", MARGIN, y);
    y += 5;

    // Table header
    pdf.setFillColor(240, 238, 252);
    pdf.rect(MARGIN, y, CONTENT_W, 6, "F");
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(80, 60, 120);
    pdf.text("Trigger", MARGIN + 2, y + 4);
    pdf.text("Episodes", MARGIN + 90, y + 4);
    pdf.text("% of Period", MARGIN + 130, y + 4);
    pdf.text("Avg Severity", MARGIN + 160, y + 4);
    y += 6;

    stats.topTriggers.forEach(([trigger, count], i) => {
      const bgAlpha = i % 2 === 0 ? 250 : 244;
      pdf.setFillColor(bgAlpha, bgAlpha, bgAlpha);
      pdf.rect(MARGIN, y, CONTENT_W, 6.5, "F");

      const relevantEntries = filteredEntries.filter(e => e.triggers.includes(trigger));
      const avgSev = relevantEntries.length
        ? (relevantEntries.reduce((a, e) => a + e.severity, 0) / relevantEntries.length).toFixed(1)
        : "—";

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 30, 40);
      pdf.text(trigger, MARGIN + 2, y + 4.5);
      pdf.text(String(count), MARGIN + 90, y + 4.5);
      pdf.text(`${Math.round((count / filteredEntries.length) * 100)}%`, MARGIN + 130, y + 4.5);
      pdf.text(String(avgSev), MARGIN + 160, y + 4.5);
      y += 6.5;
    });
    y += 8;
  }

  // ── EPISODE TIMELINE TABLE ────────────────────────────────────────────────
  if (y + 60 > A4_H - MARGIN) { pdf.addPage(); y = MARGIN; }

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 100, 110);
  pdf.text("EPISODE TIMELINE", MARGIN, y);
  y += 5;

  // Table header
  pdf.setFillColor(240, 238, 252);
  pdf.rect(MARGIN, y, CONTENT_W, 6, "F");
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(80, 60, 120);
  ["Date", "Area", "Sev", "Duration", "Triggers", "Medications", "Hormonal"].forEach((h, i) => {
    const xs = [0, 22, 58, 66, 84, 124, 156];
    pdf.text(h, MARGIN + xs[i], y + 4);
  });
  y += 6;

  filteredEntries.slice().reverse().forEach((entry, i) => {
    const rowH = 7;
    if (y + rowH > A4_H - MARGIN) { pdf.addPage(); y = MARGIN; }

    const bg = i % 2 === 0 ? 250 : 244;
    pdf.setFillColor(bg, bg, bg);
    pdf.rect(MARGIN, y, CONTENT_W, rowH, "F");

    // Severity color dot
    const sev = entry.severity;
    if (sev >= 7) pdf.setFillColor(220, 60, 60);
    else if (sev >= 4) pdf.setFillColor(230, 150, 30);
    else pdf.setFillColor(60, 160, 100);
    pdf.circle(MARGIN + 61 + 2, y + 3.5, 1.5, "F");

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 40);

    const xs = [0, 22, 58, 66, 84, 124, 156];
    pdf.text(entry.date, MARGIN + xs[0], y + 4.5);
    pdf.text(entry.area.slice(0, 16), MARGIN + xs[1], y + 4.5);
    pdf.text(String(sev), MARGIN + xs[2] + 1, y + 4.5);
    pdf.text(minToHm(entry.durationMin), MARGIN + xs[3], y + 4.5);

    const trigStr = entry.triggers.join(", ");
    pdf.text(pdf.splitTextToSize(trigStr, 36)[0], MARGIN + xs[4], y + 4.5);

    const medStr = entry.meds.join(", ");
    pdf.text(pdf.splitTextToSize(medStr, 28)[0], MARGIN + xs[5], y + 4.5);

    const horStr = (entry.hormonalStatus ?? []).join(", ");
    pdf.text(pdf.splitTextToSize(horStr, 30)[0], MARGIN + xs[6], y + 4.5);

    // Notes sub-row
    if (entry.notes) {
      y += rowH;
      if (y + 5 > A4_H - MARGIN) { pdf.addPage(); y = MARGIN; }
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(120, 120, 140);
      const noteStr = pdf.splitTextToSize(`Note: ${entry.notes}`, CONTENT_W - 4)[0];
      pdf.text(noteStr, MARGIN + 2, y + 3.5);
      y += 5;
    } else {
      y += rowH;
    }
  });
  y += 8;

  // ── AI REPORT SECTIONS ────────────────────────────────────────────────────
  if (aiReport) {
    if (y + 10 > A4_H - MARGIN) { pdf.addPage(); y = MARGIN; }

    // AI header bar
    pdf.setFillColor(235, 230, 255);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, "F");
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(60, 40, 100);
    pdf.text("✦  AI Clinical Narrative", MARGIN + 4, y + 6);
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(120, 100, 160);
    pdf.text("AI-assisted · not a clinical diagnosis", A4_W - MARGIN - 2, y + 6, { align: "right" });
    y += 13;

    addTextSection("Executive Summary", aiReport.executiveSummary);

    if (aiReport.patternInsights?.length) {
      addTextSection("Pattern Insights", aiReport.patternInsights);
    }
    if (aiReport.triggerAnalysis) {
      addTextSection("Trigger Analysis", aiReport.triggerAnalysis);
    }
    if (aiReport.medicationSummary) {
      addTextSection("Medication Summary", aiReport.medicationSummary);
    }
    if (aiReport.hormonalNotes) {
      addTextSection("Hormonal Patterns", aiReport.hormonalNotes);
    }
    if (aiReport.anomalies?.length) {
      addTextSection("Anomalies / Red Flags", aiReport.anomalies, { color: [180, 40, 40] });
    }
    if (aiReport.clinicalRecommendations?.length) {
      addTextSection("Clinical Recommendations", aiReport.clinicalRecommendations, { color: [30, 110, 70], numbered: true });
    }
  }

  // ── PATIENT NOTES ─────────────────────────────────────────────────────────
  if (patientNotes) {
    if (y + 20 > A4_H - MARGIN) { pdf.addPage(); y = MARGIN; }
    pdf.setFillColor(250, 249, 255);
    pdf.setDrawColor(210, 205, 235);
    const boxH = Math.min(40, 10 + Math.ceil(patientNotes.length / 80) * 6);
    pdf.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, "FD");
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 90, 130);
    pdf.text("PATIENT NOTES", MARGIN + 3, y + 5);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 55, 80);
    const wrapped = pdf.splitTextToSize(`"${patientNotes}"`, CONTENT_W - 8);
    wrapped.slice(0, 6).forEach((line: string, i: number) => {
      pdf.text(line, MARGIN + 3, y + 10 + i * 5.5);
    });
    y += boxH + 6;
  }

  // ── FOOTER on every page ──────────────────────────────────────────────────
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(170, 165, 185);
    pdf.text(
      `Migraine Clinical Report · ${format(dateFrom, "MMM d")} – ${format(dateTo, "MMM d, yyyy")} · Page ${p} of ${totalPages}`,
      A4_W / 2,
      A4_H - 6,
      { align: "center" }
    );
  }

  pdf.save(`migraine-report-${format(dateFrom, "yyyy-MM-dd")}-to-${format(dateTo, "yyyy-MM-dd")}.pdf`);
}

// ─── Stats helper (shared) ────────────────────────────────────────────────────

function computeStats(filteredEntries: Entry[]) {
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
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClinicalReport({ entries }: Props) {
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateFrom, setDateFrom] = useState<Date>(defaultFrom);
  const [dateTo, setDateTo] = useState<Date>(today);
  const [patientNotes, setPatientNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const raw = e.date;
      if (raw.includes("-")) {
        try {
          const d = parseISO(raw);
          return isWithinInterval(d, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
        } catch { return true; }
      }
      return true;
    });
  }, [entries, dateFrom, dateTo]);

  const stats = useMemo(() => computeStats(filteredEntries), [filteredEntries]);

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

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportClinicalPDF(
        chartsRef,
        patientNotes,
        dateFrom,
        dateTo,
        filteredEntries,
        stats,
        aiReport
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Clinical Report</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={exporting || filteredEntries.length === 0}
          className="gap-1.5 text-xs"
        >
          {exporting ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Building PDF…</>
          ) : (
            <><Download className="h-3.5 w-3.5" /> Export PDF</>
          )}
        </Button>
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
              <><Sparkles className="h-4 w-4" /> Generate AI Clinical Summary</>
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

      {/* Stats + Charts (always shown if entries exist) — captured for PDF */}
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

          {/* Charts captured for PDF */}
          <div ref={chartsRef} className="space-y-4">
            {/* Severity timeline */}
            <Card data-pdf-section>
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
              <Card data-pdf-section>
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
                        {stats.topTriggers.map(([,,], i) => (
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
              <Card data-pdf-section>
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

            {/* Hormonal breakdown */}
            {Object.keys(stats.hormonalMap).length > 0 && (
              <Card data-pdf-section>
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
          </div>
        </>
      )}

      {/* AI Report Section */}
      {aiReport && (
        <div className="space-y-4">
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
                <div className="px-4 py-3 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Executive Summary</p>
                  <p className="text-sm leading-relaxed">{aiReport.executiveSummary}</p>
                </div>

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

                {aiReport.triggerAnalysis && (
                  <div className="px-4 py-3 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-[hsl(var(--warning))]" /> Trigger Analysis
                    </p>
                    <p className="text-sm leading-relaxed">{aiReport.triggerAnalysis}</p>
                  </div>
                )}

                {aiReport.medicationSummary && (
                  <div className="px-4 py-3 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <Pill className="h-3 w-3 text-primary" /> Medication Summary
                    </p>
                    <p className="text-sm leading-relaxed">{aiReport.medicationSummary}</p>
                  </div>
                )}

                {aiReport.hormonalNotes && (
                  <div className="px-4 py-3 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Hormonal Patterns</p>
                    <p className="text-sm leading-relaxed">{aiReport.hormonalNotes}</p>
                  </div>
                )}

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

                {patientNotes && (
                  <div className="px-4 py-3 space-y-1.5 bg-muted/30">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Patient Notes</p>
                    <p className="text-sm leading-relaxed italic text-muted-foreground">"{patientNotes}"</p>
                  </div>
                )}

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
