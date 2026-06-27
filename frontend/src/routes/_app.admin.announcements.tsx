import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/admin/announcements")({
  head: () => ({ meta: [{ title: "E'lonlar · AcademiXAI" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={t.admin.announcements}
        description={t.admin.announcementsDesc}
      />
      <EmptyState
        icon={Bell}
        title={t.admin.comingSoon}
        description={t.admin.comingSoonDesc}
      />
    </div>
  );
}
