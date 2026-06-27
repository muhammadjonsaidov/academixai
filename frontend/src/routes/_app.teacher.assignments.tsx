import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/assignments")({
  head: () => ({ meta: [{ title: "Topshiriqlar · AcademiXAI" }] }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.assignments}
        title={t.assignments.title}
        description={t.assignments.description}
      />

      <div className="rounded-2xl border border-border bg-card p-12 shadow-soft">
        <EmptyState
          icon={ClipboardList}
          title={t.assignments.comingSoon}
          description={t.assignments.noAssignments}
        />
      </div>
    </div>
  );
}
