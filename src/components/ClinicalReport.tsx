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
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

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

async function exportClinicalPDF(
  _chartsRef: React.RefObject<HTMLDivElement>,
  patientNotes: string,
  dateFrom: Date,
  dateTo: Date,
  filteredEntries: Entry[],
  stats: ReturnType<typeof computeStats>,
  aiReport: AIReport | null
) {
  try {
    const A4_W = 210;
    const A4_H = 297;
    const M = 14; // margin
    const CW = A4_W - M * 2; // content width
    const LH = 5.2; // line height
    const SECTION_GAP = 7;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    let y = M;

  // ── COLOUR PALETTE (grayscale only, colour only for severity) ─────────────
  const C = {
    black: [15, 15, 15] as [number,number,number],
    dark:  [45, 45, 45] as [number,number,number],
    mid:   [90, 90, 90] as [number,number,number],
    muted: [140, 140, 140] as [number,number,number],
    light: [210, 210, 210] as [number,number,number],
    rule:  [195, 195, 195] as [number,number,number],
    bg1:   [248, 248, 248] as [number,number,number],
    bg2:   [240, 240, 240] as [number,number,number],
    headerBg: [30, 30, 30] as [number,number,number],
    // severity colours — only colour used
    sevHigh: [200, 50, 50] as [number,number,number],
    sevMid:  [180, 110, 20] as [number,number,number],
    sevLow:  [50, 140, 80] as [number,number,number],
  };

  const setFill = (c: [number,number,number]) => pdf.setFillColor(c[0], c[1], c[2]);
  const setDraw = (c: [number,number,number]) => pdf.setDrawColor(c[0], c[1], c[2]);
  const setTxt  = (c: [number,number,number]) => pdf.setTextColor(c[0], c[1], c[2]);
  const sevColor = (s: number) => s >= 7 ? C.sevHigh : s >= 4 ? C.sevMid : C.sevLow;

  // ── HELPERS ───────────────────────────────────────────────────────────────

  const rule = (thick = false) => {
    setDraw(thick ? C.dark : C.rule);
    pdf.setLineWidth(thick ? 0.4 : 0.2);
    pdf.line(M, y, A4_W - M, y);
    y += 3;
  };

  const newPageIfNeeded = (needed: number) => {
    if (y + needed > A4_H - M - 8) { pdf.addPage(); y = M; }
  };

  const sectionHeading = (title: string) => {
    newPageIfNeeded(12);
    y += 2;
    setFill(C.black);
    pdf.rect(M, y, CW, 7, "F");
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    setTxt([255, 255, 255]);
    pdf.text(title.toUpperCase(), M + 3, y + 5);
    y += 9;
  };

  const tableHeader = (cols: { label: string; x: number; w: number }[]) => {
    setFill(C.bg2);
    setDraw(C.light);
    pdf.rect(M, y, CW, 6, "FD");
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    setTxt(C.mid);
    cols.forEach(col => pdf.text(col.label, M + col.x + 1, y + 4.2));
    y += 6;
  };

  const tableRow = (
    cols: { text: string; x: number; w: number; bold?: boolean; color?: [number,number,number] }[],
    rowIdx: number,
    rowH = 6.5
  ) => {
    newPageIfNeeded(rowH);
    setFill(rowIdx % 2 === 0 ? C.bg1 : [255, 255, 255]);
    setDraw(C.light);
    pdf.rect(M, y, CW, rowH, "FD");
    cols.forEach(col => {
      pdf.setFontSize(7.8);
      pdf.setFont("helvetica", col.bold ? "bold" : "normal");
      setTxt(col.color ?? C.dark);
      const text = pdf.splitTextToSize(col.text, col.w - 2);
      pdf.text(text[0] ?? "", M + col.x + 1, y + 4.3);
    });
    y += rowH;
  };

  const bodyText = (text: string, indent = 0) => {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    setTxt(C.dark);
    const wrapped = pdf.splitTextToSize(text, CW - indent - 2);
    wrapped.forEach((line: string) => {
      newPageIfNeeded(LH + 1);
      pdf.text(line, M + indent, y);
      y += LH;
    });
  };

  const bulletList = (items: string[], numbered = false) => {
    items.forEach((item, i) => {
      newPageIfNeeded(LH + 1);
      const prefix = numbered ? `${i + 1}.` : "-";
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", numbered ? "bold" : "normal");
      setTxt(C.mid);
      pdf.text(prefix, M + 2, y);
      pdf.setFont("helvetica", "normal");
      setTxt(C.dark);
      const wrapped = pdf.splitTextToSize(item, CW - 10);
      wrapped.forEach((line: string, li: number) => {
        if (li > 0) { newPageIfNeeded(LH); }
        pdf.text(line, M + 8, y);
        y += LH;
      });
      y += 0.5;
    });
  };

  // ASCII bar (0–maxVal mapped to barWidth chars)
  const asciiBar = (val: number, maxVal: number, maxW = 40): string => {
    const filled = Math.round((val / maxVal) * maxW);
    return "#".repeat(filled) + "-".repeat(maxW - filled);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER HEADER
  // ══════════════════════════════════════════════════════════════════════════

  // Header banner
  setFill(C.headerBg);
  pdf.rect(0, 0, A4_W, 42, "F");

  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  setTxt([255, 255, 255]);
  pdf.text("MIGRAINE CLINICAL REPORT", M, 16);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  setTxt([200, 200, 200]);
  pdf.text(`Report period:  ${format(dateFrom, "MMMM d, yyyy")} - ${format(dateTo, "MMMM d, yyyy")}`, M, 24);
  pdf.text(`Generated:  ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, M, 30);
  pdf.text(`Total episodes in period:  ${filteredEntries.length}`, M, 36);

  setTxt([120, 120, 120]);
  pdf.setFontSize(7);
  pdf.text("AI-assisted analysis · Not a substitute for professional medical judgment · Confidential patient document", M, 41);

  y = 50;

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — SUMMARY STATISTICS
  // ══════════════════════════════════════════════════════════════════════════

  if (stats && filteredEntries.length > 0) {
    sectionHeading("1. Summary Statistics");

    const severeCount  = filteredEntries.filter(e => e.severity >= 7).length;
    const modCount     = filteredEntries.filter(e => e.severity >= 4 && e.severity < 7).length;
    const mildCount    = filteredEntries.filter(e => e.severity < 4).length;
    const skippedMeals = filteredEntries.filter(e => e.skippedMeal).length;
    const withHormonal = filteredEntries.filter(e => e.hormonalStatus?.length).length;
    const maxDur       = Math.max(...filteredEntries.map(e => e.durationMin));
    const minDur       = Math.min(...filteredEntries.map(e => e.durationMin));

    const kpiRows = [
      ["Total episodes", String(filteredEntries.length), "Average severity", stats.avgSev.toFixed(1) + " / 10"],
      ["Average duration", minToHm(Math.round(stats.avgDur)), "Longest episode", minToHm(maxDur)],
      ["Shortest episode", minToHm(minDur), "Severe (>=7/10)", `${severeCount}  (${Math.round((severeCount/filteredEntries.length)*100)}%)`],
      ["Moderate (4-6)", `${modCount}  (${Math.round((modCount/filteredEntries.length)*100)}%)`, "Mild (< 4)", `${mildCount}  (${Math.round((mildCount/filteredEntries.length)*100)}%)`],
      ["Skipped meals logged", String(skippedMeals), "With hormonal status", String(withHormonal)],
      ["Unique triggers logged", String(new Set(filteredEntries.flatMap(e => e.triggers)).size), "Unique symptoms logged", String(new Set(filteredEntries.flatMap(e => e.symptoms)).size)],
    ];

    const kpiColW = CW / 2;
    kpiRows.forEach((row, ri) => {
      newPageIfNeeded(7);
      setFill(ri % 2 === 0 ? C.bg1 : [255,255,255]);
      setDraw(C.light);
      pdf.rect(M, y, CW, 6.5, "FD");

      [0, 1].forEach(ci => {
        const label = row[ci * 2];
        const value = row[ci * 2 + 1];
        const bx = M + ci * kpiColW;
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "normal");
        setTxt(C.mid);
        pdf.text(label, bx + 2, y + 3);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        setTxt(C.black);
        pdf.text(value, bx + 2, y + 6);
      });
      y += 6.5;
    });

    y += SECTION_GAP;

    // ── Severity trend (ASCII sparkline) ─────────────────────────────────────
    sectionHeading("2. Severity Trend");

    const chronological = filteredEntries.slice().reverse();

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    setTxt(C.mid);
    pdf.text("Date", M + 1, y + 4);
    pdf.text("Severity", M + 50, y + 4);
    pdf.text("Duration", M + 90, y + 4);
    pdf.text("Trend", M + 130, y + 4);
    setFill(C.bg2);
    pdf.rect(M, y, CW, 6, "F");
    y += 6;

    let prevSev: number | null = null;
    chronological.forEach((entry, i) => {
      newPageIfNeeded(6.5);
      const sev = entry.severity;
      const sc = sevColor(sev);

      setFill(i % 2 === 0 ? C.bg1 : [255,255,255]);
      setDraw(C.light);
      pdf.rect(M, y, CW, 6.5, "FD");

      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      setTxt(C.dark);
      pdf.text(entry.date, M + 1, y + 4.3);

      // Severity score
      pdf.setFont("helvetica", "bold");
      setTxt(sc);
      pdf.text(`${sev} / 10`, M + 50, y + 4.3);

      // Duration
      pdf.setFont("helvetica", "normal");
      setTxt(C.dark);
      pdf.text(minToHm(entry.durationMin), M + 90, y + 4.3);

      // Trend arrow vs previous
      if (prevSev !== null) {
        const delta = sev - prevSev;
        const arrow = delta > 0 ? "^ +" + delta : delta < 0 ? "v " + delta : "= 0";
        const ac = delta > 0 ? C.sevHigh : delta < 0 ? C.sevLow : C.mid;
        pdf.setFont("helvetica", "bold");
        setTxt(ac);
        pdf.text(arrow, M + 130, y + 4.3);
      }
      prevSev = sev;
      y += 6.5;
    });

    y += SECTION_GAP;

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 3 — COMPREHENSIVE SYMPTOM LOG
    // ══════════════════════════════════════════════════════════════════════

    sectionHeading("3. Comprehensive Symptom Log");

    // Build symptom frequency map
    const symMap: Record<string, { count: number; totalSev: number }> = {};
    filteredEntries.forEach(e => {
      e.symptoms.forEach(s => {
        if (!symMap[s]) symMap[s] = { count: 0, totalSev: 0 };
        symMap[s].count++;
        symMap[s].totalSev += e.severity;
      });
    });
    const symRanked = Object.entries(symMap)
      .map(([sym, d]) => ({ sym, count: d.count, avgSev: d.totalSev / d.count }))
      .sort((a, b) => b.count - a.count);

    const maxSymCount = symRanked[0]?.count ?? 1;

    tableHeader([
      { label: "Symptom", x: 0, w: 70 },
      { label: "Episodes", x: 70, w: 30 },
      { label: "Prevalence", x: 100, w: 30 },
      { label: "Avg severity", x: 130, w: 30 },
    ]);

    symRanked.forEach((row, i) => {
      newPageIfNeeded(6.5);
      const pct = Math.round((row.count / filteredEntries.length) * 100);
      setFill(i % 2 === 0 ? C.bg1 : [255,255,255]);
      setDraw(C.light);
      pdf.rect(M, y, CW, 6.5, "FD");

      pdf.setFontSize(7.8);
      pdf.setFont("helvetica", "normal");
      setTxt(C.dark);
      pdf.text(row.sym, M + 1, y + 4.3);
      pdf.text(String(row.count), M + 71, y + 4.3);
      pdf.text(`${pct}%`, M + 101, y + 4.3);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.8);
      setTxt(sevColor(Math.round(row.avgSev)));
      pdf.text(row.avgSev.toFixed(1), M + 131, y + 4.3);

      y += 6.5;
    });

    y += SECTION_GAP;

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 4 — TRIGGER ANALYSIS
    // ══════════════════════════════════════════════════════════════════════

    sectionHeading("4. Trigger Analysis & Correlations");

    const allTriggers = Object.entries(
      filteredEntries.flatMap(e => e.triggers).reduce((acc, t) => {
        acc[t] = (acc[t] ?? 0) + 1; return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]);

    const maxTrigCount = allTriggers[0]?.[1] ?? 1;

    tableHeader([
      { label: "Trigger", x: 0, w: 64 },
      { label: "Episodes", x: 64, w: 24 },
      { label: "% of Total", x: 88, w: 24 },
      { label: "Avg severity", x: 112, w: 28 },
      { label: "Skip meal?", x: 140, w: 24 },
    ]);

    allTriggers.forEach(([trig, cnt], i) => {
      newPageIfNeeded(6.5);
      const affected = filteredEntries.filter(e => e.triggers.includes(trig));
      const avgSev = (affected.reduce((a, e) => a + e.severity, 0) / affected.length).toFixed(1);
      const skipMealPct = Math.round((affected.filter(e => e.skippedMeal).length / affected.length) * 100);
      const pct = Math.round((cnt / filteredEntries.length) * 100);

      setFill(i % 2 === 0 ? C.bg1 : [255,255,255]);
      setDraw(C.light);
      pdf.rect(M, y, CW, 6.5, "FD");

      pdf.setFontSize(7.8);
      pdf.setFont("helvetica", "normal");
      setTxt(C.dark);
      pdf.text(trig, M + 1, y + 4.3);
      pdf.text(String(cnt), M + 65, y + 4.3);
      pdf.text(`${pct}%`, M + 89, y + 4.3);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.8);
      setTxt(sevColor(parseFloat(avgSev)));
      pdf.text(avgSev, M + 113, y + 4.3);

      setTxt(skipMealPct > 50 ? C.sevHigh : C.mid);
      pdf.text(`${skipMealPct}%`, M + 141, y + 4.3);

      y += 6.5;
    });

    y += SECTION_GAP;

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 5 — LIFESTYLE CORRELATIONS
    // ══════════════════════════════════════════════════════════════════════

    const withSleep    = filteredEntries.filter(e => e.sleep != null);
    const withCaffeine = filteredEntries.filter(e => e.caffeine != null);
    const withStress   = filteredEntries.filter(e => e.stress);

    if (withSleep.length || withCaffeine.length || withStress.length) {
      sectionHeading("5. Lifestyle Factor Correlations");

      // Sleep buckets
      if (withSleep.length) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        setTxt(C.black);
        pdf.text("Sleep Duration vs. Severity", M, y + 4);
        y += 7;

        const sleepBuckets: Record<string, { count: number; totalSev: number }> = {
          "< 5h": { count: 0, totalSev: 0 },
          "5-6h": { count: 0, totalSev: 0 },
          "6-7h": { count: 0, totalSev: 0 },
          "7-8h": { count: 0, totalSev: 0 },
          "> 8h": { count: 0, totalSev: 0 },
        };
        withSleep.forEach(e => {
          const s = e.sleep!;
          const k = s < 5 ? "< 5h" : s < 6 ? "5-6h" : s < 7 ? "6-7h" : s < 8 ? "7-8h" : "> 8h";
          sleepBuckets[k].count++;
          sleepBuckets[k].totalSev += e.severity;
        });

        tableHeader([
          { label: "Sleep range", x: 0, w: 40 },
          { label: "Episodes", x: 40, w: 30 },
          { label: "Avg severity", x: 70, w: 30 },
        ]);

        Object.entries(sleepBuckets).filter(([,d]) => d.count > 0).forEach(([k, d], i) => {
          const avg = (d.totalSev / d.count).toFixed(1);
          tableRow([
            { text: k, x: 0, w: 40 },
            { text: String(d.count), x: 40, w: 30 },
            { text: avg, x: 70, w: 30, bold: true, color: sevColor(parseFloat(avg)) },
          ], i);
        });
        y += 3;
      }

      // Caffeine buckets
      if (withCaffeine.length) {
        newPageIfNeeded(40);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        setTxt(C.black);
        pdf.text("Caffeine Intake vs. Severity", M, y + 4);
        y += 7;

        const cafBuckets: Record<string, { count: number; totalSev: number }> = {
          "0mg": { count: 0, totalSev: 0 },
          "1-100mg": { count: 0, totalSev: 0 },
          "101-200mg": { count: 0, totalSev: 0 },
          "201-300mg": { count: 0, totalSev: 0 },
          "> 300mg": { count: 0, totalSev: 0 },
        };
        withCaffeine.forEach(e => {
          const c = e.caffeine!;
          const k = c === 0 ? "0mg" : c <= 100 ? "1-100mg" : c <= 200 ? "101-200mg" : c <= 300 ? "201-300mg" : "> 300mg";
          cafBuckets[k].count++;
          cafBuckets[k].totalSev += e.severity;
        });

        tableHeader([
          { label: "Caffeine range", x: 0, w: 44 },
          { label: "Episodes", x: 44, w: 30 },
          { label: "Avg severity", x: 74, w: 30 },
        ]);

        Object.entries(cafBuckets).filter(([,d]) => d.count > 0).forEach(([k, d], i) => {
          const avg = (d.totalSev / d.count).toFixed(1);
          tableRow([
            { text: k, x: 0, w: 44 },
            { text: String(d.count), x: 44, w: 30 },
            { text: avg, x: 74, w: 30, bold: true, color: sevColor(parseFloat(avg)) },
          ], i);
        });
        y += 3;
      }

      // Stress
      if (withStress.length) {
        newPageIfNeeded(40);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        setTxt(C.black);
        pdf.text("Stress Level vs. Severity", M, y + 4);
        y += 7;

        const stressMap: Record<string, { count: number; totalSev: number }> = {};
        withStress.forEach(e => {
          const k = e.stress!;
          if (!stressMap[k]) stressMap[k] = { count: 0, totalSev: 0 };
          stressMap[k].count++;
          stressMap[k].totalSev += e.severity;
        });

        tableHeader([
          { label: "Stress level", x: 0, w: 44 },
          { label: "Episodes", x: 44, w: 30 },
          { label: "Avg severity", x: 74, w: 30 },
        ]);

        Object.entries(stressMap).sort((a,b) => b[1].count - a[1].count).forEach(([k, d], i) => {
          const avg = (d.totalSev / d.count).toFixed(1);
          tableRow([
            { text: k, x: 0, w: 44 },
            { text: String(d.count), x: 44, w: 30 },
            { text: avg, x: 74, w: 30, bold: true, color: sevColor(parseFloat(avg)) },
          ], i);
        });
        y += 3;
      }

      y += SECTION_GAP;
    }

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 6 — HORMONAL STATUS
    // ══════════════════════════════════════════════════════════════════════

    const hormoralEntries = filteredEntries.filter(e => e.hormonalStatus?.length);
    if (hormoralEntries.length) {
      sectionHeading("6. Hormonal Status During Episodes");

      const horMap: Record<string, { count: number; totalSev: number }> = {};
      hormoralEntries.forEach(e => {
        e.hormonalStatus!.forEach(h => {
          if (!horMap[h]) horMap[h] = { count: 0, totalSev: 0 };
          horMap[h].count++;
          horMap[h].totalSev += e.severity;
        });
      });

      tableHeader([
        { label: "Hormonal status", x: 0, w: 70 },
        { label: "Episodes", x: 70, w: 30 },
        { label: "% of logged", x: 100, w: 36 },
        { label: "Avg severity", x: 136, w: 30 },
      ]);

      Object.entries(horMap).sort((a,b) => b[1].count - a[1].count).forEach(([h, d], i) => {
        const avg = (d.totalSev / d.count).toFixed(1);
        const pct = Math.round((d.count / filteredEntries.length) * 100);
        tableRow([
          { text: h, x: 0, w: 70 },
          { text: String(d.count), x: 70, w: 30 },
          { text: `${pct}%`, x: 100, w: 36 },
          { text: avg, x: 136, w: 30, bold: true, color: sevColor(parseFloat(avg)) },
        ], i);
      });

      y += SECTION_GAP;
    }

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 7 — MEDICATION USAGE
    // ══════════════════════════════════════════════════════════════════════

    const allMeds = filteredEntries.flatMap(e => e.meds);
    if (allMeds.length) {
      sectionHeading("7. Medication Usage");

      const medMap: Record<string, { count: number; totalSev: number }> = {};
      filteredEntries.forEach(e => {
        e.meds.forEach(m => {
          if (!medMap[m]) medMap[m] = { count: 0, totalSev: 0 };
          medMap[m].count++;
          medMap[m].totalSev += e.severity;
        });
      });

      tableHeader([
        { label: "Medication", x: 0, w: 70 },
        { label: "Times used", x: 70, w: 30 },
        { label: "% of episodes", x: 100, w: 40 },
        { label: "Avg severity at use", x: 140, w: 42 },
      ]);

      Object.entries(medMap).sort((a,b) => b[1].count - a[1].count).forEach(([med, d], i) => {
        const avg = (d.totalSev / d.count).toFixed(1);
        const pct = Math.round((d.count / filteredEntries.length) * 100);
        tableRow([
          { text: med, x: 0, w: 70 },
          { text: String(d.count), x: 70, w: 30 },
          { text: `${pct}%`, x: 100, w: 40 },
          { text: avg, x: 140, w: 42, bold: true, color: sevColor(parseFloat(avg)) },
        ], i);
      });

      y += SECTION_GAP;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 8 — FULL EPISODE LOG
  // ══════════════════════════════════════════════════════════════════════════

  sectionHeading("8. Full Migraine Episode Log");

  const chronoLog = filteredEntries.slice().reverse();
  chronoLog.forEach((entry, i) => {
    newPageIfNeeded(30);

    const sev = entry.severity;
    const sc = sevColor(sev);

    // Episode header card with severity bar
    setFill(i % 2 === 0 ? [250, 250, 250] : [245, 245, 245]);
    setDraw(C.light);
    pdf.rect(M, y, CW, 7, "FD");

    // Left severity color bar
    setFill(sc);
    pdf.rect(M, y, 4, 7, "F");

    // Episode title: date, area, severity
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    setTxt(C.black);
    pdf.text(`Episode: ${entry.date}`, M + 6, y + 4.5);

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    setTxt(C.mid);
    pdf.text(`Location: ${entry.area}`, M + 70, y + 3.5);

    pdf.setFont("helvetica", "bold");
    setTxt(sc);
    pdf.text(`Severity: ${sev}/10`, M + 70, y + 6);

    y += 8;

    // Episode details - organized rows
    const episodeDetails = [
      ["Duration", minToHm(entry.durationMin)],
      ["Sleep prior (hours)", entry.sleep ? String(entry.sleep) : "Not logged"],
      ["Caffeine intake (mg)", entry.caffeine !== undefined && entry.caffeine !== null ? String(entry.caffeine) : "Not logged"],
      ["Stress level", entry.stress || "Not logged"],
      ["Skipped meal?", entry.skippedMeal ? "Yes" : "No"],
    ];

    episodeDetails.forEach((detail, di) => {
      setFill(di % 2 === 0 ? [250, 250, 250] : [255, 255, 255]);
      setDraw(C.light);
      pdf.rect(M, y, CW, 5, "FD");

      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      setTxt(C.mid);
      pdf.text(detail[0], M + 3, y + 3.5);

      pdf.setFont("helvetica", "normal");
      setTxt(C.dark);
      pdf.text(detail[1], M + 60, y + 3.5);

      y += 5;
    });

    y += 2;

    // Symptoms
    if (entry.symptoms.length > 0) {
      setFill(C.bg2);
      setDraw(C.light);
      pdf.rect(M, y, CW, 5, "FD");
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      setTxt(C.black);
      pdf.text("Symptoms", M + 3, y + 3.5);
      y += 5;

      const symWrapped = pdf.splitTextToSize(entry.symptoms.join(", "), CW - 6);
      symWrapped.forEach((symLine: string, si: number) => {
        setFill(si % 2 === 0 ? [250, 250, 250] : [255, 255, 255]);
        setDraw(C.light);
        pdf.rect(M, y, CW, 5, "FD");
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        setTxt(C.dark);
        pdf.text(symLine, M + 3, y + 3.5);
        y += 5;
      });
      y += 1;
    }

    // Triggers
    if (entry.triggers.length > 0) {
      setFill(C.bg2);
      setDraw(C.light);
      pdf.rect(M, y, CW, 5, "FD");
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      setTxt(C.black);
      pdf.text("Triggers", M + 3, y + 3.5);
      y += 5;

      const trigWrapped = pdf.splitTextToSize(entry.triggers.join(", "), CW - 6);
      trigWrapped.forEach((trigLine: string, ti: number) => {
        setFill(ti % 2 === 0 ? [250, 250, 250] : [255, 255, 255]);
        setDraw(C.light);
        pdf.rect(M, y, CW, 5, "FD");
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        setTxt(C.dark);
        pdf.text(trigLine, M + 3, y + 3.5);
        y += 5;
      });
      y += 1;
    }

    // Medications used
    if (entry.meds.length > 0) {
      setFill(C.bg2);
      setDraw(C.light);
      pdf.rect(M, y, CW, 5, "FD");
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      setTxt(C.black);
      pdf.text("Medications Used", M + 3, y + 3.5);
      y += 5;

      entry.meds.forEach((med: string, mi: number) => {
        const effectiveness = entry.medEffectiveness?.[med];
        let effectiveness_text = "";
        if (effectiveness) {
          const helped = effectiveness.helped || "not tracked";
          const timeToRelief = effectiveness.timeToReliefMin
            ? ` - ${minToHm(effectiveness.timeToReliefMin)} to relief`
            : "";
          effectiveness_text = ` (${helped}${timeToRelief})`;
        }

        setFill(mi % 2 === 0 ? [250, 250, 250] : [255, 255, 255]);
        setDraw(C.light);
        pdf.rect(M, y, CW, 5, "FD");
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        setTxt(C.dark);
        const medText = med + effectiveness_text;
        pdf.text(medText, M + 3, y + 3.5);
        y += 5;
      });
      y += 1;
    }

    // Hormonal status
    if (entry.hormonalStatus?.length) {
      setFill(C.bg2);
      setDraw(C.light);
      pdf.rect(M, y, CW, 5, "FD");
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      setTxt(C.black);
      pdf.text("Hormonal Status", M + 3, y + 3.5);
      y += 5;

      const horWrapped = pdf.splitTextToSize(entry.hormonalStatus.join(", "), CW - 6);
      horWrapped.forEach((horLine: string, hi: number) => {
        setFill(hi % 2 === 0 ? [250, 250, 250] : [255, 255, 255]);
        setDraw(C.light);
        pdf.rect(M, y, CW, 5, "FD");
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        setTxt(C.dark);
        pdf.text(horLine, M + 3, y + 3.5);
        y += 5;
      });
      y += 1;
    }

    // Patient notes
    if (entry.notes) {
      setFill(C.bg2);
      setDraw(C.light);
      pdf.rect(M, y, CW, 5, "FD");
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      setTxt(C.black);
      pdf.text("Notes", M + 3, y + 3.5);
      y += 5;

      const notesWrapped = pdf.splitTextToSize(entry.notes, CW - 6);
      notesWrapped.forEach((noteLine: string, ni: number) => {
        setFill(ni % 2 === 0 ? [250, 250, 250] : [255, 255, 255]);
        setDraw(C.light);
        pdf.rect(M, y, CW, 5, "FD");
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "italic");
        setTxt(C.dark);
        pdf.text(noteLine, M + 3, y + 3.5);
        y += 5;
      });
      y += 1;
    }

    y += 3;
  });

  y += SECTION_GAP;

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 9 — AI CLINICAL NARRATIVE
  // ══════════════════════════════════════════════════════════════════════════

  if (aiReport) {
    sectionHeading("9. AI Clinical Narrative");

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "italic");
    setTxt(C.muted);
    pdf.text("AI-assisted - for clinical context only - not a substitute for professional medical assessment", M, y);
    y += 6;

    const aiSections: [string, string | string[], boolean?][] = [
      ["Executive Summary", aiReport.executiveSummary],
      ["Pattern Insights", aiReport.patternInsights],
      ["Trigger Analysis", aiReport.triggerAnalysis],
      ["Medication Summary", aiReport.medicationSummary],
      ...(aiReport.hormonalNotes ? [["Hormonal Patterns", aiReport.hormonalNotes] as [string, string]] : []),
      ...(aiReport.anomalies?.length ? [["Anomalies / Red Flags", aiReport.anomalies] as [string, string[]]] : []),
      ...(aiReport.clinicalRecommendations?.length ? [["Clinical Recommendations", aiReport.clinicalRecommendations, true] as [string, string[], boolean]] : []),
    ];

    aiSections.forEach(([title, content, numbered]) => {
      if (!content || (Array.isArray(content) && !content.length)) return;
      newPageIfNeeded(12);

      // Sub-heading
      rule();
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "bold");
      setTxt(C.black);
      pdf.text(title, M, y);
      y += 5;

      if (Array.isArray(content)) {
        bulletList(content, numbered);
      } else {
        bodyText(content);
      }
      y += 2;
    });

    y += SECTION_GAP;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATIENT NOTES
  // ══════════════════════════════════════════════════════════════════════════

  if (patientNotes) {
    sectionHeading("Patient Notes");
    newPageIfNeeded(20);
    setFill(C.bg1);
    setDraw(C.light);
    const noteLines = pdf.splitTextToSize(`"${patientNotes}"`, CW - 8);
    const boxH = 8 + noteLines.length * LH;
    pdf.rect(M, y, CW, boxH, "FD");
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    setTxt(C.dark);
    noteLines.forEach((line: string, i: number) => {
      pdf.text(line, M + 4, y + 6 + i * LH);
    });
    y += boxH + SECTION_GAP;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER — all pages
  // ══════════════════════════════════════════════════════════════════════════

  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    setFill(C.black);
    pdf.rect(0, A4_H - 10, A4_W, 10, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    setTxt([200, 200, 200]);
    pdf.text(
      `Migraine Clinical Report  |  ${format(dateFrom, "MMM d, yyyy")} - ${format(dateTo, "MMM d, yyyy")}  |  ${filteredEntries.length} episodes`,
      M,
      A4_H - 4
    );
    setTxt([140, 140, 140]);
    const pageText = `Page ${p} of ${totalPages}`;
    const pageTextWidth = pdf.getTextWidth(pageText);
    pdf.text(pageText, A4_W - M - pageTextWidth, A4_H - 4);
  }

  pdf.save(`migraine-report-${format(dateFrom, "yyyy-MM-dd")}-to-${format(dateTo, "yyyy-MM-dd")}.pdf`);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
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

  // Default date range: 3 months in the past from today
  const defaultFrom = useMemo(() => {
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return threeMonthsAgo;
  }, [today]);

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
    const interval = { start: startOfDay(dateFrom), end: endOfDay(dateTo) };
    const matched = entries.filter((e) => {
      const raw = e.date;
      try {
        // ISO format: "2026-02-01"
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
          return isWithinInterval(parseISO(raw), interval);
        }
        // "MMM d" format: "Mar 26" — try the year that contains the interval midpoint first,
        // then one year back and one year forward, picking whichever falls within the interval.
        const midYear = new Date((dateFrom.getTime() + dateTo.getTime()) / 2).getFullYear();
        for (const yr of [midYear, midYear - 1, midYear + 1]) {
          const d = parse(raw, "MMM d", new Date(yr, 0, 1));
          if (!isNaN(d.getTime()) && isWithinInterval(d, interval)) return true;
        }
        return false;
      } catch {
        return true;
      }
    });

    // If no entries match the chosen date range but we do have entries (e.g. demo data
    // that uses month/day strings), fall back to showing all entries so actions like
    // Export PDF remain available to the user.
    if (matched.length === 0 && entries.length > 0) return entries;
    return matched;
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
    setError(null);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export PDF");
      console.error("PDF export error:", e);
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
