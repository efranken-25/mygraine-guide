import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Zap, AlertTriangle, ChevronRight, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LogMigraineForm, { UserEntry } from "@/components/LogMigraineForm";
import SoundscapeCard from "@/components/SoundscapeCard";
import { Droplets } from "lucide-react";
import MedicalAlertDialog, { checkMedicalAlert, AlertResult } from "@/components/MedicalAlertDialog";
import { useEntries } from "@/lib/entriesContext";

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

const MIGRAINE_KEYWORDS = ["migraine", "headache", "head hurts", "pain", "throbbing", "pounding", "aura", "nausea", "head ache"];

function WelcomeBanner({ onMigraineDetected }: { onMigraineDetected: () => void }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const quoteIdx = new Date().getDate() % CALM_QUOTES.length;
  const quote = CALM_QUOTES[quoteIdx];
  const [userInput, setUserInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!userInput.trim()) return;
    const lower = userInput.toLowerCase();
    const hasMigraine = MIGRAINE_KEYWORDS.some((kw) => lower.includes(kw));
    setSubmitted(true);
    if (hasMigraine) {
      setTimeout(() => onMigraineDetected(), 600);
    }
  };

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

        {submitted ? (
          <div className="rounded-xl px-3.5 py-2.5" style={{ background: "hsl(0 0% 100% / 0.55)", backdropFilter: "blur(4px)" }}>
            <p className="text-[12.5px] leading-relaxed" style={{ color: "hsl(262 35% 28%)" }}>
              "{userInput}"
            </p>
            <button
              onClick={() => { setSubmitted(false); setUserInput(""); }}
              className="text-[10px] mt-1 font-medium underline"
              style={{ color: "hsl(262 25% 50%)" }}
            >
              Update
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-xl px-3.5 py-2.5" style={{ background: "hsl(0 0% 100% / 0.48)", backdropFilter: "blur(4px)" }}>
              <p className="text-[12.5px] font-serif italic leading-relaxed" style={{ color: "hsl(262 35% 28%)" }}>
                "{quote.text}"
              </p>
              <p className="text-[10px] mt-1 font-medium" style={{ color: "hsl(262 25% 50%)" }}>
                — {quote.author}
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Tell me how you feel…"
                className="flex-1 rounded-xl px-3.5 py-2 text-[12.5px] border-0 outline-none"
                style={{
                  background: "hsl(0 0% 100% / 0.6)",
                  backdropFilter: "blur(4px)",
                  color: "hsl(262 35% 20%)",
                }}
              />
              {userInput.trim() && (
                <button
                  onClick={handleSubmit}
                  className="rounded-xl px-3 py-2 text-[11px] font-semibold transition-all"
                  style={{
                    background: "hsl(262 45% 50%)",
                    color: "white",
                  }}
                >
                  Share
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RiskBanner() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/predictions")}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-opacity hover:opacity-90"
      style={{
        background: "linear-gradient(135deg, hsl(0 68% 96%), hsl(38 100% 96%))",
        boxShadow: "0 1px 8px hsl(0 68% 50% / 0.10)",
      }}
    >
      <div className="flex-shrink-0 rounded-full p-2" style={{ background: "hsl(0 68% 90%)" }}>
        <AlertTriangle className="h-4 w-4" style={{ color: "hsl(0 68% 45%)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "hsl(0 60% 30%)" }}>72% migraine risk today</p>
        <p className="text-xs mt-0.5" style={{ color: "hsl(0 45% 45%)" }}>
          Pressure drop · Low sleep · Low hydration
        </p>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(0 45% 55%)" }} />
    </button>
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

function MedEffectivenessInsights({ entries }: { entries: UserEntry[] }) {
  const insights = useMemo(() => {
    const stats: Record<string, { totalTime: number; count: number; helped: number; total: number }> = {};
    entries.forEach((entry) => {
      if (!entry.medEffectiveness) return;
      Object.entries(entry.medEffectiveness).forEach(([med, eff]) => {
        if (!stats[med]) stats[med] = { totalTime: 0, count: 0, helped: 0, total: 0 };
        stats[med].total += 1;
        if (eff.helped === "yes" || eff.helped === "partial") {
          stats[med].helped += 1;
          if (eff.timeToReliefMin) {
            stats[med].totalTime += eff.timeToReliefMin;
            stats[med].count += 1;
          }
        }
      });
    });
    return Object.entries(stats)
      .filter(([, s]) => s.total >= 1)
      .map(([med, s]) => ({
        med,
        avgTime: s.count > 0 ? Math.round(s.totalTime / s.count) : null,
        helpRate: Math.round((s.helped / s.total) * 100),
        total: s.total,
      }));
  }, [entries]);

  if (insights.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: "linear-gradient(135deg, hsl(262 55% 94%), hsl(195 50% 91%))" }}>
        <Zap className="h-4 w-4" style={{ color: "hsl(265 50% 48%)" }} />
        <p className="text-sm font-semibold" style={{ color: "hsl(262 40% 24%)" }}>Your medication insights</p>
      </div>
      <div className="divide-y divide-border">
        {insights.map(({ med, avgTime, helpRate, total }) => (
          <div key={med} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{med}</p>
              {avgTime ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Relieves pain within <span className="font-semibold text-foreground">{avgTime} mins</span> on average
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">No relief time logged yet</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-bold ${helpRate >= 70 ? "text-[hsl(var(--severity-low))]" : helpRate >= 40 ? "text-[hsl(var(--warning))]" : "text-destructive"}`}>
                {helpRate}%
              </p>
              <p className="text-[10px] text-muted-foreground">effective ({total}x)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function durationStr(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function MigraineTracker() {
  const { entries, addEntry, loadDemoData, isDemoLoaded } = useEntries();
  const [showForm, setShowForm] = useState(false);
  const [alertResult, setAlertResult] = useState<AlertResult | null>(null);

  const handleSave = useCallback((entry: UserEntry) => {
    addEntry(entry);
    setShowForm(false);

    const medStr = entry.meds.length ? ` · ${entry.meds.join(", ")}` : "";
    toast.success("Migraine logged", {
      description: `Severity ${entry.severity}/10 · ${durationStr(entry.durationMin)}${medStr}`,
    });

    const muted = localStorage.getItem("mute-medical-alerts") === "true";
    if (!muted) {
      const result = checkMedicalAlert(entry);
      if (result.triggered) {
        setTimeout(() => setAlertResult(result), 50);
      }
    }
  }, [addEntry]);

  return (
    <div className="space-y-5">
      <WelcomeBanner onMigraineDetected={() => setShowForm(true)} />

      <RiskBanner />

      <WaterReminderCard />

      <Button
        className="w-full flex items-center gap-2 py-6 text-base rounded-2xl"
        style={{ boxShadow: "var(--shadow-soft)" }}
        onClick={() => setShowForm(true)}
      >
        <Plus className="h-5 w-5" /> Log a Migraine
      </Button>

      {entries.length === 0 && !isDemoLoaded && (
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 rounded-2xl"
          onClick={loadDemoData}
        >
          <FlaskConical className="h-4 w-4" /> Load Demo Data
        </Button>
      )}

      {showForm && (
        <LogMigraineForm
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}

      {alertResult && (
        <MedicalAlertDialog
          open={true}
          onClose={() => setAlertResult(null)}
          result={alertResult}
        />
      )}

      <MedEffectivenessInsights entries={entries} />

      <SoundscapeCard />
    </div>
  );
}
