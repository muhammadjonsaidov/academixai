import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { AppearanceSection } from "@/components/profile/AppearanceSection";
import { NotificationsSection } from "@/components/profile/NotificationsSection";
import { ChangePasswordSection } from "@/components/profile/ChangePasswordSection";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/settings")({
  head: () => ({ meta: [{ title: "Sozlamalar · AcademiXAI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <PageHeader title={t.settings.title} description={t.profile.description} />
      <AppearanceSection />
      <NotificationsSection />
      <ChangePasswordSection />
    </div>
  );
}
