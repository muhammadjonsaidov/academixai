import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, dashboardPathForRole } from "@/lib/auth";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Tizimga kirish · AcademiXAI" },
      { name: "description", content: "AcademiXAI hisobingizga kiring va shaxsiy AI ustozingiz bilan o'qishni davom ettiring." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate({ to: dashboardPathForRole(user.role) });
    }
  }, [isAuthenticated, user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Iltimos, elektron pochta va parolni kiriting");
      return;
    }
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Xush kelibsiz, ${u.fullName}!`);
      navigate({ to: dashboardPathForRole(u.role) });
    } catch {
      toast.error("Kirish amalga oshmadi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Hisobingizga kiring
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Shaxsiy AI ustozingiz va o'quv jarayoningiz sizni kutmoqda.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Elektron pochta</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ism.familiya@maktab.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Parol</Label>
              <Link
                to="/auth/forgot"
                className="text-xs font-medium text-primary hover:underline"
              >
                Parolni unutdingizmi?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Kamida 8 ta belgi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(!!v)}
            />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
              Meni eslab qol
            </Label>
          </div>

          <Button type="submit" className="h-11 w-full text-sm" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Kirish
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo hisoblar — parol: <span className="font-mono">AcademiX2026!</span></p>
          <ul className="mt-1.5 space-y-0.5">
            <li>• <span className="font-mono">jasur@academixai.uz</span> — O'quvchi</li>
            <li>• <span className="font-mono">nozima@academixai.uz</span> — Ota-ona</li>
            <li>• <span className="font-mono">sardor@academixai.uz</span> — O'qituvchi</li>
            <li>• <span className="font-mono">dilshod@academixai.uz</span> — Maktab admini</li>
          </ul>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        AcademiXAI'da hisobingiz yo'qmi?{" "}
        <Link to="/auth/register" className="font-medium text-primary hover:underline">
          Ro'yxatdan o'tish
        </Link>
      </p>
    </div>
  );
}
