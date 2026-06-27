import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, dashboardPathForRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [{ title: "Kirish · AcademiXAI" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const { t } = useT();
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
    if (!email || !password) return;
    setLoading(true);
    try {
      const u = await login(email, password, remember);
      toast.success(`${t.auth.welcomeBack}, ${u.fullName}!`);
      navigate({ to: dashboardPathForRole(u.role) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.loginError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {t.auth.loginTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.auth.loginSubtitle}</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t.auth.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Link to="/auth/forgot" className="text-xs font-medium text-primary hover:underline">
                {t.auth.forgotPassword}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
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
              {t.auth.rememberMe}
            </Label>
          </div>

          <Button type="submit" className="h-11 w-full text-sm" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                {t.auth.login}
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.auth.contactAdmin}
      </p>
    </div>
  );
}
