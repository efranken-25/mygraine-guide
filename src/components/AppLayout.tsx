import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, Pill, ShieldCheck, ClipboardList, Settings, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/history", icon: ClipboardList, label: "History" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/medications", icon: Pill, label: "Meds" },
  { to: "/prior-auth", icon: ShieldCheck, label: "Prior Auth" },
];


export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark";
    }
    return false;
  });
  const [muteAlerts, setMuteAlerts] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mute-medical-alerts") === "true";
    }
    return false;
  });

  const toggleMuteAlerts = (v: boolean) => {
    setMuteAlerts(v);
    localStorage.setItem("mute-medical-alerts", v ? "true" : "false");
    window.dispatchEvent(new Event("mute-medical-alerts-changed"));
  };

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

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
              MyGraine Guide
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-4 space-y-4">
                <p className="text-sm font-semibold">Settings</p>

                {/* User info */}
                {user && (
                  <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
                    <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.displayName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="dark-toggle" className="text-sm cursor-pointer">Dark mode</Label>
                  <Switch id="dark-toggle" checked={dark} onCheckedChange={setDark} />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Label htmlFor="mute-alerts" className="text-sm cursor-pointer">Mute severity alerts</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      Disable the "see a doctor" pop-up after logging
                    </p>
                  </div>
                  <Switch id="mute-alerts" checked={muteAlerts} onCheckedChange={toggleMuteAlerts} />
                </div>

                <Separator />

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => { signOut(); navigate("/auth"); }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </PopoverContent>
            </Popover>
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

