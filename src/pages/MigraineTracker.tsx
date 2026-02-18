import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import LogMigraineForm, { UserEntry } from "@/components/LogMigraineForm";
import SoundscapeCard from "@/components/SoundscapeCard";
import { Droplets } from "lucide-react";

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

  return (
    <div className="space-y-5">
      <WelcomeBanner />
      <WaterReminderCard />

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

      <SoundscapeCard />
    </div>
  );
}
