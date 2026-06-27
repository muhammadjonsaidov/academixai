import { createFileRoute } from "@tanstack/react-router";
import { School } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/admin/classes")({
  head: () => ({ meta: [{ title: "Sinflar · AcademiXAI" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={t.admin.classes}
        description={t.admin.classesDesc}
      />
      <EmptyState
        icon={School}
        title={t.admin.comingSoon}
        description={t.admin.comingSoonDesc}
      />
    </div>
  );
}
