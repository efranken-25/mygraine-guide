import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Stethoscope, FileText } from "lucide-react";
import Insurance from "@/pages/Insurance";
import FindCare from "@/pages/FindCare";
import PAInsurance from "@/pages/PAInsurance";

export default function PriorAuthHub() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prior Authorization</h1>
        <p className="text-muted-foreground">Insurance, providers & PA tracking</p>
      </div>

      <Tabs defaultValue="insurance" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="insurance" className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Insurance
          </TabsTrigger>
          <TabsTrigger value="find-care" className="flex items-center gap-1.5 text-xs">
            <Stethoscope className="h-3.5 w-3.5" /> Find Care
          </TabsTrigger>
          <TabsTrigger value="pa" className="flex items-center gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> PA Tracker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insurance" className="mt-4">
          <Insurance />
        </TabsContent>
        <TabsContent value="find-care" className="mt-4">
          <FindCare />
        </TabsContent>
        <TabsContent value="pa" className="mt-4">
          <PAInsurance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
