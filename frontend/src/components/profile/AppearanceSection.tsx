import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useT, type Lang } from "@/lib/i18n";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useT();
  const s = t.settings;

  const themes = [
    { value: "light", label: s.light, icon: Sun },
    { value: "dark", label: s.dark, icon: Moon },
    { value: "system", label: s.system, icon: Monitor },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold mb-1">{s.appearance}</h3>
        <p className="text-sm text-muted-foreground mb-4">{s.appearanceDesc}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {themes.map((th) => {
            const Icon = th.icon;
            const active = theme === th.value;
            return (
              <button
                key={th.value}
                onClick={() => setTheme(th.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-medium">{th.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-display text-base font-semibold mb-3">{s.interfaceLang}</h3>
        <div className="flex gap-2 max-w-xs">
          {(["uz", "en", "ru"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all",
                lang === l
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/40",
              )}
            >
              {l === "uz" ? "🇺🇿 UZ" : l === "en" ? "🇬🇧 EN" : "🇷🇺 RU"}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
