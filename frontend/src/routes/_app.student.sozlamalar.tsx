import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Globe, Lock, Monitor, Moon, ShieldCheck, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/student/sozlamalar")({
  head: () => ({ meta: [{ title: "Sozlamalar · AcademiXAI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState({
    emailNotif: true,
    pushNotif: true,
    weeklyReport: true,
    aiTips: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Sozlamalar" description="Hisob, ko'rinish va bildirishnoma sozlamalarini boshqaring." />

      {/* Appearance */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <header className="mb-4">
          <h3 className="font-display text-lg font-semibold">Ko'rinish</h3>
          <p className="text-sm text-muted-foreground">Sevimli rejimni tanlang.</p>
        </header>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { value: "light", label: "Yorug'", icon: Sun },
            { value: "dark", label: "Tungi", icon: Moon },
            { value: "system", label: "Tizim", icon: Monitor },
          ].map((t) => {
            const Icon = t.icon;
            const active = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <header className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Bildirishnomalar</h3>
        </header>
        <div className="divide-y divide-border">
          {[
            { key: "emailNotif", title: "Elektron pochta orqali", desc: "Muhim e'lonlar va eslatmalarni pochtangizga oling." },
            { key: "pushNotif", title: "Push bildirishnomalar", desc: "Brauzer va mobil ilovada darhol xabar oling." },
            { key: "weeklyReport", title: "Haftalik AI hisobot", desc: "Har dushanba ertalab haftalik tahlil yuboriladi." },
            { key: "aiTips", title: "AI maslahatlar", desc: "AI Ustozning shaxsiy maslahatlarini olib turing." },
          ].map((row) => (
            <div key={row.key} className="flex items-start justify-between gap-4 py-3.5">
              <div>
                <p className="text-sm font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.desc}</p>
              </div>
              <Switch
                checked={prefs[row.key as keyof typeof prefs]}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, [row.key]: v }))}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Language */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <header className="mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Til va hudud</h3>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Interfeys tili</Label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
              🇺🇿 O'zbek tili (lotin)
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Vaqt mintaqasi</Label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
              GMT+5 · Toshkent
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <header className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Xavfsizlik</h3>
        </header>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Parol yangilandi");
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="current">Joriy parol</Label>
            <Input id="current" type="password" placeholder="••••••••" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">Yangi parol</Label>
            <Input id="new" type="password" placeholder="Kamida 8 ta belgi" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Tasdiqlash</Label>
            <Input id="confirm" type="password" placeholder="Yangi parolni qayta kiriting" className="h-10" />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit">
              <Lock className="h-4 w-4" />
              Parolni yangilash
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
