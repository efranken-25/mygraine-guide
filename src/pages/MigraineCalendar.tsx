import { useState } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Plus, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

type MigraineDay = {
  date: Date;
  severity: number;
  duration: string;
  notes: string;
};

const MOCK_MIGRAINE_DAYS: MigraineDay[] = [
  { date: new Date(2026, 1, 16), severity: 8, duration: "4h 20m", notes: "Aura, nausea" },
  { date: new Date(2026, 1, 14), severity: 5, duration: "2h 10m", notes: "Neck pain" },
  { date: new Date(2026, 1, 11), severity: 9, duration: "6h 45m", notes: "Severe with vomiting" },
  { date: new Date(2026, 1, 8), severity: 3, duration: "1h 15m", notes: "Mild eye pain" },
  { date: new Date(2026, 1, 5), severity: 7, duration: "3h 30m", notes: "Nausea, brain fog" },
  { date: new Date(2026, 0, 28), severity: 6, duration: "3h", notes: "Light sensitivity" },
  { date: new Date(2026, 0, 20), severity: 4, duration: "1h 50m", notes: "Mild" },
  { date: new Date(2026, 0, 12), severity: 8, duration: "5h", notes: "Aura, sound sensitivity" },
];

function severityDot(s: number) {
  if (s <= 3) return "bg-[hsl(var(--severity-low))]";
  if (s <= 6) return "bg-[hsl(var(--severity-mid))]";
  return "bg-[hsl(var(--severity-high))]";
}

function severityLabel(s: number) {
  if (s <= 3) return "Mild";
  if (s <= 6) return "Moderate";
  return "Severe";
}

export default function MigraineCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [migraineDays, setMigraineDays] = useState<MigraineDay[]>(MOCK_MIGRAINE_DAYS);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getMigraineForDay = (day: Date) => migraineDays.find((m) => isSameDay(m.date, day));

  const monthMigraines = migraineDays.filter(
    (m) => m.date >= monthStart && m.date <= monthEnd
  );

  const toggleMigraineDay = (day: Date) => {
    const existing = getMigraineForDay(day);
    if (existing) {
      setMigraineDays(migraineDays.filter((m) => !isSameDay(m.date, day)));
      if (selectedDay && isSameDay(selectedDay, day)) setSelectedDay(null);
    } else {
      const newEntry: MigraineDay = { date: day, severity: 5, duration: "", notes: "" };
      setMigraineDays([...migraineDays, newEntry]);
      setSelectedDay(day);
    }
  };

  const selectedMigraine = selectedDay ? getMigraineForDay(selectedDay) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Migraine Calendar</h1>
        <p className="text-muted-foreground">Tap days to mark migraines</p>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold font-serif">{monthMigraines.length}</p>
            <p className="text-xs text-muted-foreground">Migraine days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold font-serif">
              {monthMigraines.length > 0
                ? (monthMigraines.reduce((a, m) => a + m.severity, 0) / monthMigraines.length).toFixed(1)
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Avg severity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold font-serif">
              {daysInMonth.length - monthMigraines.length}
            </p>
            <p className="text-xs text-muted-foreground">Clear days</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {daysInMonth.map((day) => {
              const migraine = getMigraineForDay(day);
              const isSelected = selectedDay && isSameDay(selectedDay, day);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    if (migraine) {
                      setSelectedDay(isSelected ? null : day);
                    } else {
                      toggleMigraineDay(day);
                    }
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg py-2 text-sm transition-all",
                    isSelected && "ring-2 ring-primary",
                    isToday && !migraine && "bg-muted font-bold",
                    migraine ? "bg-destructive/10 hover:bg-destructive/20" : "hover:bg-muted",
                  )}
                >
                  <span className={cn("leading-none", migraine && "font-semibold")}>
                    {format(day, "d")}
                  </span>
                  {migraine && (
                    <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", severityDot(migraine.severity))} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--severity-low))]" /> Mild
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--severity-mid))]" /> Moderate
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--severity-high))]" /> Severe
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected day detail */}
      {selectedMigraine && selectedDay && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-destructive" />
                <span className="font-medium">{format(selectedDay, "EEEE, MMM d")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{severityLabel(selectedMigraine.severity)}</Badge>
                <span className={cn("inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold text-white", severityDot(selectedMigraine.severity))}>
                  {selectedMigraine.severity}
                </span>
              </div>
            </div>
            {selectedMigraine.duration && (
              <p className="text-sm text-muted-foreground">Duration: {selectedMigraine.duration}</p>
            )}
            {selectedMigraine.notes && (
              <p className="text-sm text-muted-foreground">{selectedMigraine.notes}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:text-destructive"
              onClick={() => toggleMigraineDay(selectedDay)}
            >
              Remove migraine entry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tip */}
      <p className="text-xs text-muted-foreground text-center">
        Tap any day to add a migraine. Tap a marked day to view details or remove it.
      </p>
    </div>
  );
}
