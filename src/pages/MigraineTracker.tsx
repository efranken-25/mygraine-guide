import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, Zap, TrendingUp, Calendar } from "lucide-react";

const MOCK_ENTRIES = [
  { id: 1, date: "Feb 16", severity: 8, duration: "4h 20m", area: "Left", symptoms: ["Aura", "Nausea", "Light sensitivity"], status: "ended" },
  { id: 2, date: "Feb 14", severity: 5, duration: "2h 10m", area: "Front", symptoms: ["Neck pain", "Fatigue"], status: "ended" },
  { id: 3, date: "Feb 11", severity: 9, duration: "6h 45m", area: "Full", symptoms: ["Aura", "Vomiting", "Sound sensitivity", "Visual disturbance"], status: "ended" },
  { id: 4, date: "Feb 8", severity: 3, duration: "1h 15m", area: "Right", symptoms: ["Eye pain"], status: "ended" },
  { id: 5, date: "Feb 5", severity: 7, duration: "3h 30m", area: "Back", symptoms: ["Nausea", "Dizziness", "Brain fog"], status: "ended" },
];

function severityColor(s: number) {
  if (s <= 3) return "bg-[hsl(var(--severity-low))] text-white";
  if (s <= 6) return "bg-[hsl(var(--severity-mid))] text-[hsl(var(--warning-foreground))]";
  return "bg-[hsl(var(--severity-high))] text-white";
}

export default function MigraineTracker() {
  const avgSeverity = (MOCK_ENTRIES.reduce((a, e) => a + e.severity, 0) / MOCK_ENTRIES.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Migraine Tracker</h1>
        <p className="text-muted-foreground">Your recent migraine history</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Zap className="mx-auto h-5 w-5 text-primary mb-1" />
            <p className="text-2xl font-bold font-serif">{MOCK_ENTRIES.length}</p>
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
            <p className="text-2xl font-bold font-serif">3.5h</p>
            <p className="text-xs text-muted-foreground">Avg duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Severity trend mini chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Severity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-24">
            {MOCK_ENTRIES.slice().reverse().map((e) => (
              <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-md ${severityColor(e.severity)} transition-all`}
                  style={{ height: `${(e.severity / 10) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{e.date.split(" ")[1]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entry list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Entries</h2>
        {MOCK_ENTRIES.map((entry) => (
          <Card key={entry.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-medium">{entry.date}</span>
                  <span className="text-sm text-muted-foreground">· {entry.area}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{entry.duration}</Badge>
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${severityColor(entry.severity)}`}>
                    {entry.severity}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.symptoms.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
