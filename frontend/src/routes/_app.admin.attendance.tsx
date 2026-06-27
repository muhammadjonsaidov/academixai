import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { StatCard } from "@/components/shell/StatCard";
import { getAdminAnalytics } from "@/lib/api";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/admin/attendance")({
  head: () => ({ meta: [{ title: "Davomat · AcademiXAI" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const { t } = useT();
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: getAdminAnalytics,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={t.admin.attendance}
        description={t.admin.attendanceDesc}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t.admin.totalAbsences}
          value={isLoading ? "…" : (analytics?.totalAbsences ?? 0)}
          icon={AlertTriangle}
          accent="default"
          hint={t.admin.allStudents}
        />
      </div>

      <EmptyState
        icon={CalendarCheck}
        title={t.admin.comingSoon}
        description={t.admin.comingSoonDesc}
      />
    </div>
  );
}
