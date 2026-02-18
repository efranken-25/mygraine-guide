import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Pill, ShieldCheck, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/medications", icon: Pill, label: "Medications" },
  { to: "/find-care", icon: Stethoscope, label: "Find Care" },
  { to: "/insurance", icon: ShieldCheck, label: "Insurance" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-xl"
        style={{ boxShadow: "0 1px 12px hsl(252 48% 56% / 0.06)" }}>
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl p-1.5" style={{ background: "linear-gradient(135deg, hsl(252 55% 60%), hsl(280 50% 65%))" }}>
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight font-serif" style={{ background: "linear-gradient(120deg, hsl(252 48% 45%), hsl(280 45% 50%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              MyGraineGuide
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-28">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-card/90 backdrop-blur-xl safe-area-bottom"
        style={{ boxShadow: "0 -1px 16px hsl(252 48% 56% / 0.07)" }}>
        <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-1.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-xs transition-all duration-200",
                  isActive
                    ? "text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={isActive ? {
                  background: "linear-gradient(135deg, hsl(252 55% 60%), hsl(270 50% 62%))",
                  boxShadow: "0 2px 10px hsl(252 55% 55% / 0.3)",
                } : {}}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-white")} />
                <span className={isActive ? "text-white" : ""}>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

