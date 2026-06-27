import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, GraduationCap, BarChart3, AlertTriangle, FileText } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { getAdminAnalytics } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/admin/reports")({
  head: () => ({ meta: [{ title: "Hisobotlar · AcademiXAI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { t } = useT();
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: getAdminAnalytics,
  });

  let riskStudents: { name: string; reason?: string }[] = [];
  let riskText = "";
  if (analytics?.atRiskAnalysis) {
    try {
      const parsed = JSON.parse(analytics.atRiskAnalysis);
      riskStudents = parsed.atRiskStudents ?? [];
    } catch {
      riskText = analytics.atRiskAnalysis;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.dashboard}
        title={t.nav.reports}
        description={t.admin.reportsDesc}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.admin.totalTeachers}
          value={isLoading ? "…" : (analytics?.teacherCount ?? 0)}
          icon={GraduationCap}
          accent="primary"
        />
        <StatCard
          label={t.admin.totalStudents}
          value={isLoading ? "…" : (analytics?.studentCount ?? 0)}
          icon={Users}
          accent="secondary"
        />
        <StatCard
          label={t.admin.avgScore}
          value={isLoading ? "…" : `${analytics?.avgScore?.toFixed(1) ?? 0}%`}
          icon={BarChart3}
          accent="accent"
        />
        <StatCard
          label={t.admin.totalAbsences}
          value={isLoading ? "…" : (analytics?.totalAbsences ?? 0)}
          icon={AlertTriangle}
          accent="default"
        />
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground py-8 text-center">{t.action.loading}</div>
      )}

      {!isLoading && (riskStudents.length > 0 || riskText) && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display font-semibold">{t.admin.aiReportTitle}</h2>
          </div>
          {riskStudents.length > 0 ? (
            <ul className="space-y-2">
              {riskStudents.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm p-2 rounded-lg bg-muted/40">
                  <span className="font-medium">{s.name}</span>
                  {s.reason && <span className="text-muted-foreground">— {s.reason}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-4">{riskText}</p>
          )}
        </div>
      )}

      {!isLoading && !riskStudents.length && !riskText && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t.admin.riskEmpty}</p>
        </div>
      )}
    </div>
  );
}
