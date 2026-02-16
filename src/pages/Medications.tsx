import { Card, CardContent } from "@/components/ui/card";
import { Pill } from "lucide-react";

export default function Medications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
        <p className="text-muted-foreground">Track your preventive & rescue meds</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Pill className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Medication tracking coming in Phase 2</p>
        </CardContent>
      </Card>
    </div>
  );
}
