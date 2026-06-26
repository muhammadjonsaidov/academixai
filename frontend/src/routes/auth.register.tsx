import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Ro'yxatdan o'tish · AcademiXAI" },
      { name: "description", content: "AcademiXAI platformasida bepul hisob oching va AI yordamida o'qishni boshlang." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Parollar mos kelmadi");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (!agree) {
      toast.error("Foydalanish shartlarini qabul qiling");
      return;
    }
    setLoading(true);
    try {
      await register({ fullName: form.fullName, email: form.email, password: form.password });
      toast.success("Hisob yaratildi. Pochtangizni tasdiqlang.");
      navigate({ to: "/auth/verify", search: { email: form.email } });
    } catch {
      toast.error("Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Yangi hisob oching</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bir necha daqiqada ro'yxatdan o'ting va AI ustozingiz bilan ishlashni boshlang.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">To'liq ism-sharifingiz</Label>
            <Input
              id="fullName"
              placeholder="Ism Familiya"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Elektron pochta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ism.familiya@maktab.uz"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                placeholder="Kamida 8 ta belgi"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Parolni tasdiqlang</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Parolni qayta kiriting"
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
              Men <a className="text-primary hover:underline" href="#">foydalanish shartlari</a> va{" "}
              <a className="text-primary hover:underline" href="#">maxfiylik siyosati</a> bilan
              tanishdim va roziman.
            </span>
          </label>

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Hisob yaratish
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hisobingiz bormi?{" "}
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          Tizimga kirish
        </Link>
      </p>
    </div>
  );
}
