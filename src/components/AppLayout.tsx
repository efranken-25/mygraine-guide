import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Brain, Calendar, Droplets, Pill, FileText, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Brain, label: "Migraine" },
  { to: "/triggers", icon: Droplets, label: "Triggers" },
  { to: "/medications", icon: Pill, label: "Meds" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/pa-insurance", icon: FileText, label: "PA" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight font-serif">NeuroGuard</span>
          </div>
          <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors" aria-label="Sign out">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom nav (mobile-first) */}
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
