import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function PAInsurance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PA Insurance</h1>
        <p className="text-muted-foreground">Prior authorization tracking & predictions</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">PA Insurance module coming in Phase 5</p>
        </CardContent>
      </Card>
    </div>
  );
}
