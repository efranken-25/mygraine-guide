import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, CloudRain, Moon, Coffee, Activity, Droplets, TrendingDown, AlertTriangle } from "lucide-react";

const TRIGGER_CORRELATIONS = [
  { trigger: "Barometric pressure drop", icon: CloudRain, correlation: 82, risk: "high", details: "Strong link with 4 of 5 recent migraines" },
  { trigger: "Poor sleep (<6h)", icon: Moon, correlation: 68, risk: "high", details: "3 migraines followed nights under 6 hours" },
  { trigger: "High stress days", icon: Activity, correlation: 55, risk: "medium", details: "Stress level 4-5 preceded 2 migraines" },
  { trigger: "Low water intake", icon: Droplets, correlation: 45, risk: "medium", details: "Fewer than 4 glasses on migraine days" },
  { trigger: "Excess caffeine", icon: Coffee, correlation: 30, risk: "low", details: "Mild pattern with 3+ cups per day" },
];

const RISK_FORECAST = {
  today: 72,
  factors: [
    "Barometric pressure dropping 8 hPa since yesterday",
    "Only 3 glasses of water logged today",
    "Sleep last night: 5h 20m (below your 7h average)",
  ],
};

function riskColor(risk: string) {
  if (risk === "high") return "text-destructive border-destructive/30 bg-destructive/5";
  if (risk === "medium") return "text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5";
  return "text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/30 bg-[hsl(var(--severity-low))]/5";
}

function progressColor(val: number) {
  if (val >= 60) return "[&>div]:bg-destructive";
  if (val >= 40) return "[&>div]:bg-[hsl(var(--warning))]";
  return "[&>div]:bg-[hsl(var(--severity-low))]";
}

export default function Predictions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trigger Predictions</h1>
        <p className="text-muted-foreground">AI-powered migraine risk analysis</p>
      </div>

      {/* Today's risk */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Today's Migraine Risk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex-shrink-0">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(var(--destructive))"
                  strokeWidth="3"
                  strokeDasharray={`${RISK_FORECAST.today}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold font-serif text-destructive">
                {RISK_FORECAST.today}%
              </span>
            </div>
            <div className="space-y-1.5">
              {RISK_FORECAST.factors.map((f, i) => (
                <p key={i} className="text-sm text-muted-foreground flex gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  {f}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trigger correlations */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> Detected Trigger Patterns
        </h2>
        {TRIGGER_CORRELATIONS.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.trigger}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{t.trigger}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs capitalize ${riskColor(t.risk)}`}>
                    {t.risk} risk
                  </Badge>
                </div>
                <Progress value={t.correlation} className={`h-2 ${progressColor(t.correlation)}`} />
                <p className="text-xs text-muted-foreground">{t.details} — {t.correlation}% correlation</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
