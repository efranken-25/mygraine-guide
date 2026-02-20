import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn(email, password);
    if (result.success) {
      navigate("/");
    } else {
      toast({ title: "Login failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2.5">
            <div className="rounded-xl p-2" style={{ background: "linear-gradient(135deg, hsl(252 55% 60%), hsl(280 50% 65%))" }}>
              <Brain className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif" style={{ background: "linear-gradient(120deg, hsl(252 48% 45%), hsl(280 45% 50%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              MyGraine Guide
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Migraine tracking & insurance navigation</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to access your health data</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
