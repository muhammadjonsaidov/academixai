import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users, GraduationCap, BarChart3, AlertTriangle, FileText,
  ShieldAlert, HeartPulse, Lightbulb, CheckCircle2, RefreshCw,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/shell/PageHeader";
import { getAdminAnalytics } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin/reports")({
  head: () => ({ meta: [{ title: "Hisobotlar · AcademiXAI" }] }),
  component: ReportsPage,
});

interface RiskStudent {
  name: string;
  reason?: string;
  recommendation?: string;
}

function HealthGauge({ value }: { value: number }) {
  const color = value >= 80 ? "#22c55e" : value >= 60 ? "#f59e0b" : "#ef4444";
  const label = value >= 80 ? "Yaxshi" : value >= 60 ? "O'rtacha" : "Past";
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{value}%</span>
          <span className="text-xs text-muted-foreground">salomatlik</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function RiskCard({ student, index }: { student: RiskStudent; index: number }) {
  const [open, setOpen] = useState(false);
  const severity = index === 0 ? "yuqori" : index < 3 ? "o'rta" : "past";
  const colors = {
    yuqori: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800/40", badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", dot: "bg-red-500" },
    "o'rta": { bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-800/40", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", dot: "bg-orange-500" },
    past: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/40", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", dot: "bg-amber-400" },
  }[severity];

  return (
    <div className={cn("rounded-xl border p-4 transition-all", colors.bg, colors.border)}>
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className={cn("h-8 w-8 rounded-full grid place-items-center shrink-0 text-xs font-bold", colors.badge)}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{student.name}</p>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colors.badge)}>
              {severity} xavf
            </span>
          </div>
          {!open && student.reason && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{student.reason}</p>
          )}
        </div>
        <button className="shrink-0 text-muted-foreground hover:text-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 pl-11">
          {student.reason && (
            <div className="flex gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Sabab</p>
                <p className="text-sm">{student.reason}</p>
              </div>
            </div>
          )}
          {student.recommendation && (
            <div className="flex gap-2">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Tavsiya</p>
                <p className="text-sm">{student.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportsPage() {
  const { data: analytics, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: getAdminAnalytics,
  });

  let riskStudents: RiskStudent[] = [];
  let overallHealth: number | null = null;
  let riskRaw = "";
  const hasAnalysis = !!analytics?.atRiskAnalysis;

  if (hasAnalysis) {
    try {
      const cleaned = analytics!.atRiskAnalysis.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      riskStudents = parsed.atRiskStudents ?? [];
      overallHealth = parsed.overallHealthPercent ?? null;
    } catch {
      riskRaw = analytics!.atRiskAnalysis;
    }
  }

  const highRisk = riskStudents.slice(0, 1);
  const medRisk = riskStudents.slice(1, 3);
  const lowRisk = riskStudents.slice(3);

  const avgScore = analytics?.avgScore ?? 0;
  const scoreColor = avgScore >= 75 ? "text-green-600" : avgScore >= 55 ? "text-amber-600" : "text-red-600";
  const ScoreIcon = avgScore >= 75 ? TrendingUp : avgScore >= 55 ? Minus : TrendingDown;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Maktab Hisoboti"
        description="AI yordamida tayyorlangan umumiy tahlil va xavf baholash"
      />

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "O'qituvchilar", value: analytics?.teacherCount ?? 0, icon: GraduationCap, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
          { label: "O'quvchilar", value: analytics?.studentCount ?? 0, icon: Users, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
          { label: "O'rtacha ball", value: `${avgScore.toFixed(1)}%`, icon: BarChart3, color: "bg-green-100 text-green-600 dark:bg-green-900/30" },
          { label: "Qoldirilgan darslar", value: analytics?.totalAbsences ?? 0, icon: AlertTriangle, color: "bg-red-100 text-red-600 dark:bg-red-900/30" },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-soft flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl grid place-items-center shrink-0", c.color)}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-display">{isLoading ? "…" : c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Score + Health overview */}
      {!isLoading && analytics && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Score card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft flex items-center gap-6">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">O'rtacha test natijasi</p>
              <p className={cn("text-5xl font-bold font-display", scoreColor)}>{avgScore.toFixed(1)}%</p>
              <div className={cn("flex items-center gap-1 mt-2 text-sm", scoreColor)}>
                <ScoreIcon className="h-4 w-4" />
                {avgScore >= 75 ? "Yaxshi daraja" : avgScore >= 55 ? "O'rtacha daraja" : "Yaxshilash kerak"}
              </div>
            </div>
            <div className="h-20 w-20 rounded-2xl grid place-items-center shrink-0"
              style={{ background: `conic-gradient(${avgScore >= 75 ? "#22c55e" : avgScore >= 55 ? "#f59e0b" : "#ef4444"} ${avgScore}%, #e5e7eb ${avgScore}%)` }}>
              <div className="h-14 w-14 rounded-xl bg-card grid place-items-center">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Health gauge */}
          {overallHealth !== null ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft flex items-center gap-6">
              <HealthGauge value={overallHealth} />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">Maktab salomatligi</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">80%+ — Yaxshi</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">60–79% — O'rtacha</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">60% dan past — Muammo</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft flex items-center justify-center text-muted-foreground gap-2">
              <HeartPulse className="h-5 w-5" />
              <span className="text-sm">Salomatlik tahlili yuklanmoqda…</span>
            </div>
          )}
        </div>
      )}

      {/* AI Risk Analysis */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 grid place-items-center shrink-0">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">AI Xavf Tahlili</p>
            <p className="text-xs text-muted-foreground">Xavf ostidagi o'quvchilar va tavsiyalar</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Yangilash
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : !hasAnalysis ? (
          <div className="p-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Tahlil hali tayyor emas</p>
            <p className="text-xs text-muted-foreground mt-1">AI fon rejimida ishlayapti. Bir ozdan keyin yangilang.</p>
          </div>
        ) : riskStudents.length > 0 ? (
          <div className="p-5 space-y-6">
            {highRisk.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Yuqori xavf — {highRisk.length} ta</p>
                </div>
                <div className="space-y-2">
                  {highRisk.map((s, i) => <RiskCard key={i} student={s} index={i} />)}
                </div>
              </div>
            )}
            {medRisk.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">O'rta xavf — {medRisk.length} ta</p>
                </div>
                <div className="space-y-2">
                  {medRisk.map((s, i) => <RiskCard key={i} student={s} index={i + 1} />)}
                </div>
              </div>
            )}
            {lowRisk.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Past xavf — {lowRisk.length} ta</p>
                </div>
                <div className="space-y-2">
                  {lowRisk.map((s, i) => <RiskCard key={i} student={s} index={i + 3} />)}
                </div>
              </div>
            )}

            {riskStudents.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-200">Barcha o'quvchilar yaxshi holatda!</p>
              </div>
            )}
          </div>
        ) : riskRaw ? (
          <div className="p-6">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{riskRaw}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
