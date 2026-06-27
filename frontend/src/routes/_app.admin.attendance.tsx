import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { getAdminAnalytics, getAdminAttendance } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/admin/attendance")({
  head: () => ({ meta: [{ title: "Davomat · AcademiXAI" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const { t } = useT();
  const { data: analytics, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: getAdminAnalytics,
  });
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["admin-attendance"],
    queryFn: getAdminAttendance,
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title={t.admin.attendance} description={t.admin.attendanceDesc} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t.admin.totalAbsences}
          value={loadingStats ? "…" : (analytics?.totalAbsences ?? 0)}
          icon={AlertTriangle}
          accent="default"
          hint={t.admin.allStudents}
        />
        <StatCard
          label={t.admin.totalPresent}
          value={isLoading ? "…" : records.filter(r => r.present).length}
          icon={CheckCircle2}
          accent="primary"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <h2 className="font-display font-semibold text-sm">{t.admin.attendanceList}</h2>
          <span className="ml-auto text-xs text-muted-foreground">{records.length} ta yozuv</span>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t.admin.noAttendance}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.student}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.course}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.admin.date}</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t.admin.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.studentName}</p>
                      <p className="text-xs text-muted-foreground">{r.studentEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.courseName || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                    <td className="px-4 py-3 text-center">
                      {r.present ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 rounded-full px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Kelgan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-full px-2 py-0.5">
                          <XCircle className="h-3 w-3" /> Kelmagan
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
