import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function CalendarView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Visualize your migraine patterns</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Calendar dashboard coming in Phase 3</p>
        </CardContent>
      </Card>
    </div>
  );
}
