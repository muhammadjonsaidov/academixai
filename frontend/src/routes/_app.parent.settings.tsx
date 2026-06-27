import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ProfileEditSection } from "@/components/profile/ProfileEditSection";
import { AppearanceSection } from "@/components/profile/AppearanceSection";
import { ChangePasswordSection } from "@/components/profile/ChangePasswordSection";
import { NotificationsSection } from "@/components/profile/NotificationsSection";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/parent/settings")({
  head: () => ({ meta: [{ title: "Sozlamalar · AcademiXAI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t.parent.title} title={t.settings.title} description={t.settings.description} />
      <ProfileEditSection queryKey="parent-profile" />
      <AppearanceSection />
      <NotificationsSection />
      <ChangePasswordSection />
    </div>
  );
}
