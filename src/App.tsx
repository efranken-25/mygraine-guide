import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import MigraineTracker from "@/pages/MigraineTracker";
import MigraineCalendar from "@/pages/MigraineCalendar";
import Predictions from "@/pages/Predictions";
import Recommendations from "@/pages/Recommendations";
import MedicationTracker from "@/pages/MedicationTracker";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><MigraineTracker /></AppLayout>} />
          <Route path="/calendar" element={<AppLayout><MigraineCalendar /></AppLayout>} />
          <Route path="/predictions" element={<AppLayout><Predictions /></AppLayout>} />
          <Route path="/recommendations" element={<AppLayout><Recommendations /></AppLayout>} />
          <Route path="/medications" element={<AppLayout><MedicationTracker /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
