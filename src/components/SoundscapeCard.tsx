import { useState } from "react";
import { ExternalLink, Music, Wind, Waves, Volume2 } from "lucide-react";

const PODCASTS = [
  {
    title: "Huberman Lab – Sleep & Stress",
    desc: "Science-backed tools for reducing pain & nervous system regulation",
    url: "https://open.spotify.com/show/79CkJF3UJTHFV8Dse3Oy0P",
    tag: "Science",
    color: "hsl(252 50% 90%)",
    textColor: "hsl(252 50% 38%)",
  },
  {
    title: "Calm Meditation",
    desc: "Guided breathing & mindfulness to ease tension headaches",
    url: "https://open.spotify.com/show/0vXBzWPLDtNnEwqQ1jyLfx",
    tag: "Meditation",
    color: "hsl(178 45% 88%)",
    textColor: "hsl(178 55% 28%)",
  },
  {
    title: "On Being with Krista Tippett",
    desc: "Deep, slow conversations on meaning, healing & being human",
    url: "https://open.spotify.com/show/2K34B1DF5HiQeY6ZQKVKLb",
    tag: "Reflective",
    color: "hsl(318 40% 90%)",
    textColor: "hsl(318 45% 38%)",
  },
  {
    title: "Nothing Much Happens",
    desc: "Bedtime stories for a quiet mind — helps with migraine recovery",
    url: "https://open.spotify.com/show/6zEBUjTGMdI3C2G3bNoJMH",
    tag: "Sleep",
    color: "hsl(38 70% 90%)",
    textColor: "hsl(38 65% 32%)",
  },
];

const WHITENOISE = [
  {
    title: "Brown Noise – 10 Hours",
    desc: "Deep, low rumble that soothes migraine pain & light sensitivity",
    url: "https://open.spotify.com/track/1mTlm9BqrPQOBCpNzKinIv",
    icon: Wind,
    color: "hsl(28 50% 88%)",
    textColor: "hsl(28 55% 32%)",
  },
  {
    title: "Rain on Window",
    desc: "Soft rainfall — one of the most effective migraine comfort sounds",
    url: "https://open.spotify.com/track/3bJ4MZyKQ8CGGwA6ZLxL1Z",
    icon: Waves,
    color: "hsl(205 55% 88%)",
    textColor: "hsl(205 55% 28%)",
  },
  {
    title: "Delta Waves – Deep Focus",
    desc: "Binaural 2–4 Hz tones that support pain-reducing deep rest",
    url: "https://open.spotify.com/search/delta%20waves%20sleep",
    icon: Volume2,
    color: "hsl(255 50% 90%)",
    textColor: "hsl(255 50% 38%)",
  },
];

const CALMNESS_QUOTES = [
  { text: "This too shall pass. Rest, be gentle with yourself.", author: "Ancient Wisdom" },
  { text: "Your body is doing its best. Let it rest.", author: "Self-Compassion" },
  { text: "Stillness is not emptiness — it is presence.", author: "Thich Nhat Hanh" },
  { text: "Breathe. You have survived every difficult day so far.", author: "Unknown" },
  { text: "Healing is not linear. Be patient with the process.", author: "Mindfulness" },
];

export default function SoundscapeCard() {
  const [tab, setTab] = useState<"podcasts" | "sounds">("podcasts");
  const todayQuote = CALMNESS_QUOTES[new Date().getDate() % CALMNESS_QUOTES.length];

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Quote strip */}
      <div
        className="rounded-2xl px-5 py-4 relative overflow-hidden"
        style={{ background: "linear-gradient(120deg, hsl(252 60% 95%), hsl(178 45% 92%), hsl(318 40% 95%))" }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 animate-breathe"
          style={{ background: "radial-gradient(circle, hsl(var(--bloom-purple)), transparent)" }} />
        <div className="absolute -left-3 -bottom-3 h-16 w-16 rounded-full opacity-15 animate-breathe"
          style={{ background: "radial-gradient(circle, hsl(var(--bloom-green)), transparent)", animationDelay: "2s" }} />

        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "hsl(252 45% 55%)" }}>
          ✦ Today's Calm
        </p>
        <p className="text-base font-serif italic leading-snug" style={{ color: "hsl(240 30% 22%)" }}>
          "{todayQuote.text}"
        </p>
        <p className="text-[11px] mt-1.5" style={{ color: "hsl(240 20% 50%)" }}>
          — {todayQuote.author}
        </p>
      </div>

      {/* Soundscape section */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          <h3 className="font-serif font-semibold text-sm">Calmness Corner</h3>
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mb-3 rounded-xl overflow-hidden border border-border/50 bg-muted/40">
          {(["podcasts", "sounds"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium transition-all ${
                tab === t
                  ? "bg-primary text-primary-foreground rounded-xl"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "podcasts" ? "🎙 Podcasts" : "🌊 White Noise"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-4 pb-4 space-y-2">
          {tab === "podcasts" &&
            PODCASTS.map((p) => (
              <a
                key={p.title}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl p-3 hover:brightness-95 transition-all group"
                style={{ background: p.color }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-semibold truncate" style={{ color: p.textColor }}>{p.title}</p>
                    <span
                      className="text-[9px] rounded-full px-1.5 py-0.5 font-medium shrink-0"
                      style={{ background: "hsl(0 0% 100% / 0.5)", color: p.textColor }}
                    >
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: p.textColor, opacity: 0.8 }}>{p.desc}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: p.textColor }} />
              </a>
            ))}

          {tab === "sounds" &&
            WHITENOISE.map((s) => (
              <a
                key={s.title}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl p-3 hover:brightness-95 transition-all group"
                style={{ background: s.color }}
              >
                <s.icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: s.textColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold mb-0.5" style={{ color: s.textColor }}>{s.title}</p>
                  <p className="text-[10px] leading-relaxed" style={{ color: s.textColor, opacity: 0.8 }}>{s.desc}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: s.textColor }} />
              </a>
            ))}

          <p className="text-[9px] text-muted-foreground text-center pt-1">
            Opens in Spotify · Listening at low volume may reduce migraine severity
          </p>
        </div>
      </div>
    </div>
  );
}
