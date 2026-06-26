import { cn } from "@/lib/utils";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  hint?: string;
  accent?: "primary" | "secondary" | "accent" | "default";
  className?: string;
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/15 text-secondary",
  accent: "bg-accent/25 text-accent-foreground",
  default: "bg-muted text-muted-foreground",
};

export function StatCard({ label, value, icon: Icon, trend, hint, accent = "primary", className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-elevated", className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend.positive ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={cn("font-medium", trend.positive ? "text-success" : "text-destructive")}>
            {trend.value}
          </span>
          <span className="text-muted-foreground">o'tgan haftaga nisbatan</span>
        </div>
      )}
    </div>
  );
}
