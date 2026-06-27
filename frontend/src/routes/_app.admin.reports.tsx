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

  let riskText = analytics?.atRiskAnalysis ?? "";
  try {
    riskText = JSON.stringify(JSON.parse(riskText), null, 2);
  } catch {
    // not JSON, use as-is
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

      {!isLoading && riskText && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display font-semibold">{t.admin.aiReportTitle}</h2>
          </div>
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed max-h-96 overflow-y-auto bg-muted/30 rounded-xl p-4">
            {riskText}
          </pre>
        </div>
      )}

      {!isLoading && !riskText && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t.admin.riskEmpty}</p>
        </div>
      )}
    </div>
  );
}
