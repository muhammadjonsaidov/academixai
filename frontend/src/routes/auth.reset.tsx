import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/auth/reset")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Yangi parol o'rnatish · AcademiXAI" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) { toast.error("Havola noto'g'ri. Qaytadan so'rov yuboring."); return; }
    if (password !== confirm) { toast.error("Parollar mos kelmadi"); return; }
    if (password.length < 8) { toast.error("Parol kamida 8 belgi bo'lishi kerak"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Xatolik yuz berdi");
      }
      setDone(true);
      toast.success("Parol muvaffaqiyatli yangilandi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="animate-fade-in text-center">
        <p className="text-sm text-muted-foreground">
          Havola noto'g'ri. <Link to="/auth/forgot" className="font-medium text-primary hover:underline">Qaytadan so'rov yuboring.</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Yangi parol o'rnatish</h1>
        <p className="mt-2 text-sm text-muted-foreground">Yangi parol kiriting.</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-foreground">Parol muvaffaqiyatli yangilandi. Endi yangi parol bilan kirishingiz mumkin.</p>
            <Button className="w-full h-11" onClick={() => navigate({ to: "/auth/login" })}>
              Kirish sahifasiga o'tish
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Yangi parol</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Kamida 8 belgi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Kamida 1 katta harf, 1 kichik harf va 1 raqam</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Parolni tasdiqlang</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Parolni qayta kiriting"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Parolni yangilash"}
            </Button>
          </form>
        )}
      </div>

      <Link
        to="/auth/login"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kirish sahifasiga qaytish
      </Link>
    </div>
  );
}
