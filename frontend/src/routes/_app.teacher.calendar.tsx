import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/calendar")({
  head: () => ({ meta: [{ title: "Kalendar · AcademiXAI" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.calendar}
        title={t.nav.calendar}
        description="Darslar, imtihonlar va tadbirlar jadvali."
      />

      <div className="rounded-2xl border border-border bg-card p-12 shadow-soft">
        <EmptyState
          icon={Calendar}
          title={t.nav.calendar + " — " + t.settings.comingSoon}
          description="Bu bo'limda dars jadvali, imtihon sanalari va muhim tadbirlarni belgilash imkoniyati bo'ladi."
        />
      </div>
    </div>
  );
}
