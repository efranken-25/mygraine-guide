import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { UserEntriesProvider } from "@/lib/userEntriesContext";
import AppLayout from "@/components/AppLayout";
import MigraineTracker from "@/pages/MigraineTracker";
import MigraineHistory from "@/pages/MigraineHistory";
import MigraineCalendar from "@/pages/MigraineCalendar";
import Predictions from "@/pages/Predictions";
import Recommendations from "@/pages/Recommendations";
import MedicationsPage from "@/pages/MedicationsPage";
import PriorAuthHub from "@/pages/PriorAuthHub";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<RequireAuth><AppLayout><MigraineTracker /></AppLayout></RequireAuth>} />
    <Route path="/history" element={<RequireAuth><AppLayout><MigraineHistory /></AppLayout></RequireAuth>} />
    <Route path="/calendar" element={<RequireAuth><AppLayout><MigraineCalendar /></AppLayout></RequireAuth>} />
    <Route path="/predictions" element={<RequireAuth><AppLayout><Predictions /></AppLayout></RequireAuth>} />
    <Route path="/recommendations" element={<RequireAuth><AppLayout><Recommendations /></AppLayout></RequireAuth>} />
    <Route path="/medications" element={<RequireAuth><AppLayout><MedicationsPage /></AppLayout></RequireAuth>} />
    <Route path="/prior-auth" element={<RequireAuth><AppLayout><PriorAuthHub /></AppLayout></RequireAuth>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <UserEntriesProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </UserEntriesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
