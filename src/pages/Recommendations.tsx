import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Moon, Pill, Brain, Bell, ShieldCheck, TrendingUp, Lightbulb, AlertCircle } from "lucide-react";

const RECOMMENDATIONS = [
  {
    icon: Droplets,
    title: "Increase water intake",
    description: "You averaged 3.2 glasses on migraine days vs. 6.1 on migraine-free days. Aim for 8 glasses daily.",
    priority: "high",
    category: "Hydration",
  },
  {
    icon: Moon,
    title: "Maintain consistent sleep schedule",
    description: "Your migraines correlate strongly with nights under 6 hours. Try a 10:30 PM bedtime to hit your 7h target.",
    priority: "high",
    category: "Sleep",
  },
  {
    icon: Pill,
    title: "Consider preventive medication",
    description: "With 5 migraines this month averaging severity 6.4, your neurologist may recommend a daily preventive.",
    priority: "medium",
    category: "Medication",
  },
  {
    icon: Brain,
    title: "Try stress-reduction techniques",
    description: "Stress level 4-5 preceded 40% of your migraines. Consider 10-min daily meditation or breathing exercises.",
    priority: "medium",
    category: "Lifestyle",
  },
];

const NOTIFICATIONS = [
  { icon: AlertCircle, message: "Barometric pressure dropping — elevated migraine risk today", time: "2h ago", type: "warning" },
  { icon: Droplets, message: "You've only logged 2 glasses of water today. Stay hydrated!", time: "4h ago", type: "reminder" },
  { icon: Pill, message: "Time for your evening preventive medication (Topiramate 50mg)", time: "6h ago", type: "medication" },
  { icon: TrendingUp, message: "Great news! Your migraine frequency decreased 20% compared to last month", time: "1d ago", type: "insight" },
  { icon: Moon, message: "You slept 5h 20m last night — below your recommended 7h", time: "1d ago", type: "warning" },
];

function priorityStyle(p: string) {
  if (p === "high") return "border-destructive/20 bg-destructive/5";
  if (p === "medium") return "border-[hsl(var(--warning))]/20 bg-[hsl(var(--warning))]/5";
  return "";
}

function notifStyle(type: string) {
  if (type === "warning") return "text-destructive";
  if (type === "medication") return "text-primary";
  if (type === "insight") return "text-[hsl(var(--severity-low))]";
  return "text-muted-foreground";
}

export default function Recommendations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
        <p className="text-muted-foreground">Personalized solutions & alerts</p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-0 pb-2">
          {NOTIFICATIONS.map((n, i) => {
            const Icon = n.icon;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${notifStyle(n.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" /> Personalized Solutions
        </h2>
        {RECOMMENDATIONS.map((rec) => {
          const Icon = rec.icon;
          return (
            <Card key={rec.title} className={priorityStyle(rec.priority)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{rec.title}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{rec.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tips card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm mb-1">Pro Tip</p>
            <p className="text-sm text-muted-foreground">
              Keeping a consistent daily log for 30+ days dramatically improves prediction accuracy. You're at 18 days — keep it up!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
