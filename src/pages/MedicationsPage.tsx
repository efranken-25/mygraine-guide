import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, Sparkles } from "lucide-react";
import MedicationTracker from "@/pages/MedicationTracker";
import Pharmacology from "@/pages/Pharmacology";

export default function MedicationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
        <p className="text-muted-foreground">Manage your medications and get AI-powered analysis</p>
      </div>

      <Tabs defaultValue="mymeds" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="mymeds" className="flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5" /> My Meds
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> AI Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mymeds" className="mt-4">
          {/* Strip the page header since we have one above */}
          <MedicationTracker hideHeader />
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <Pharmacology hideHeader />
        </TabsContent>
      </Tabs>
    </div>
  );
}
