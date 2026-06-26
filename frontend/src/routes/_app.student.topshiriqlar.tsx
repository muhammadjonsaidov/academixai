import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, GraduationCap, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/EmptyState";

export const Route = createFileRoute("/_app/student/topshiriqlar")({
  head: () => ({ meta: [{ title: "Topshiriqlar · AcademiXAI" }] }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Topshiriqlar"
        description="O'qituvchilar tomonidan berilgan uy vazifalari va topshiriqlar."
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState
          icon={ClipboardList}
          title="Topshiriqlar tez orada"
          description="O'qituvchi tomonidan berilgan topshiriqlar bu yerda ko'rinadi. Hozircha AI imtihonlari orqali bilimingizni sinab ko'ring."
          action={
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/student/imtihonlar">
                  <GraduationCap className="h-4 w-4" />
                  Imtihonlar
                </Link>
              </Button>
              <Button asChild>
                <Link to="/student/ai-ustoz">
                  <Sparkles className="h-4 w-4" />
                  AI Ustoz bilan mashq
                </Link>
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
