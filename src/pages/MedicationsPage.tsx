import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, GitCompareArrows } from "lucide-react";
import MedicationTracker from "@/pages/MedicationTracker";
import CompareMedications from "@/pages/CompareMedications";

export default function MedicationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
        <p className="text-muted-foreground">Manage your medications and compare options</p>
      </div>

      <Tabs defaultValue="mymeds" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="mymeds" className="flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5" /> My Meds
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-1.5">
            <GitCompareArrows className="h-3.5 w-3.5" /> Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mymeds" className="mt-4">
          <MedicationTracker hideHeader />
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          <CompareMedications />
        </TabsContent>
      </Tabs>
    </div>
  );
}
