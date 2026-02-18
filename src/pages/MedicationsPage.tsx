import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, GitCompareArrows, Search } from "lucide-react";
import MedicationTracker from "@/pages/MedicationTracker";
import CompareMedications from "@/pages/CompareMedications";
import MedLookup from "@/components/MedLookup";

export default function MedicationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
        <p className="text-muted-foreground">Manage, look up, and compare your medications</p>
      </div>

      <Tabs defaultValue="mymeds" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="mymeds" className="flex items-center gap-1">
            <Pill className="h-3.5 w-3.5" /> My Meds
          </TabsTrigger>
          <TabsTrigger value="lookup" className="flex items-center gap-1">
            <Search className="h-3.5 w-3.5" /> Lookup
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-1">
            <GitCompareArrows className="h-3.5 w-3.5" /> Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mymeds" className="mt-4">
          <MedicationTracker hideHeader />
        </TabsContent>

        <TabsContent value="lookup" className="mt-4">
          <MedLookup />
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          <CompareMedications />
        </TabsContent>
      </Tabs>
    </div>
  );
}
