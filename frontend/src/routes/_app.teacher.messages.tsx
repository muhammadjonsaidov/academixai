import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/messages")({
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
        description={t.teacher.messagesDesc}
      />

      <div className="rounded-2xl border border-border bg-card p-12 shadow-soft">
        <EmptyState
          icon={MessageSquare}
          title={t.nav.messages + " — " + t.settings.comingSoon}
          description={t.teacher.messagesComingSoonDesc}
        />
      </div>
    </div>
  );
}
