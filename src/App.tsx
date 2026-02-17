import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Index from "@/pages/Index";
import Triggers from "@/pages/Triggers";
import Medications from "@/pages/Medications";
import CalendarView from "@/pages/CalendarView";
import PAInsurance from "@/pages/PAInsurance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout><Medications /></AppLayout>} />
            <Route path="/triggers" element={<AppLayout><Triggers /></AppLayout>} />
            <Route path="/medications" element={<AppLayout><Medications /></AppLayout>} />
            <Route path="/calendar" element={<AppLayout><CalendarView /></AppLayout>} />
            <Route path="/pa-insurance" element={<AppLayout><PAInsurance /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
