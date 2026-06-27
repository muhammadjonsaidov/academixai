import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, GraduationCap, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/EmptyState";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/assignments")({
  head: () => ({ meta: [{ title: "Topshiriqlar · AcademiXAI" }] }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t.assignments.title}
        description={t.assignments.description}
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState
          icon={ClipboardList}
          title={t.assignments.comingSoon}
          description={t.assignments.noAssignments}
          action={
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/student/exams">
                  <GraduationCap className="h-4 w-4" />
                  {t.nav.exams}
                </Link>
              </Button>
              <Button asChild>
                <Link to="/student/ai-tutor">
                  <Sparkles className="h-4 w-4" />
                  {t.student.askAI}
                </Link>
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
