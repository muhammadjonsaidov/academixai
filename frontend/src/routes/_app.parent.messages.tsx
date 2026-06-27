import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/parent/messages")({
  head: () => ({ meta: [{ title: "Xabarlar · AcademiXAI" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.messages}
        title={t.nav.messages}
        description={t.parent.description}
      />
      <EmptyState
        icon={MessageSquare}
        title={t.settings.comingSoon}
        description={t.admin.comingSoonDesc}
      />
    </div>
  );
}
