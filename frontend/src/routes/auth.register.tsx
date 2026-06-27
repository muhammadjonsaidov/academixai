import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, dashboardPathForRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [{ title: "Ro'yxatdan o'tish · AcademiXAI" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useT();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error(t.auth.passwordMismatch); return; }
    if (form.password.length < 8) { toast.error(t.auth.passwordTooShort); return; }
    if (!agree) { toast.error(t.auth.agreeRequired); return; }
    setLoading(true);
    try {
      const u = await register({ fullName: form.fullName, email: form.email, password: form.password, role: "SCHOOL_ADMIN" });
      toast.success(t.auth.registerSuccess);
      navigate({ to: dashboardPathForRole(u.role) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.registerError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t.auth.registerTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.auth.registerSubtitle}</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
          {t.auth.adminOnly}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t.auth.fullName}</Label>
            <Input
              id="fullName"
              placeholder={t.auth.fullNamePlaceholder}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t.auth.emailPlaceholder}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t.auth.confirmPassword}</Label>
              <Input
                id="confirm"
                type="password"
                placeholder={t.auth.confirmPasswordPlaceholder}
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                required
                className="h-11"
              />
            </div>
          </div>
          <label className="flex items-start gap-2 pt-1 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            <span>
              {t.auth.agreeTerms.split(t.auth.terms)[0]}
              <a className="text-primary hover:underline" href="#">{t.auth.terms}</a>
              {" va "}
              <a className="text-primary hover:underline" href="#">{t.auth.privacy}</a>
            </span>
          </label>
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {t.auth.createAccount}
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.auth.haveAccount}{" "}
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          {t.auth.login}
        </Link>
      </p>
    </div>
  );
}
