import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, TrendingUp, Lightbulb, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/predictions", icon: TrendingUp, label: "Predict" },
  { to: "/recommendations", icon: Lightbulb, label: "Solutions" },
  { to: "/medications", icon: Pill, label: "Meds" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight font-serif">NeuroGuard</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/90 backdrop-blur-lg safe-area-bottom">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs transition-colors",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
