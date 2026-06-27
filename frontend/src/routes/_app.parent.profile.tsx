import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { CheckCircle2, Mail, Save, School, Sparkles } from "lucide-react";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { getProfile, updateProfile } from "@/lib/api";
import { roleLabel } from "@/lib/navigation";
import { uzDate } from "@/lib/format/date";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/parent/profile")({
  head: () => ({ meta: [{ title: "Profil · AcademiXAI" }] }),
  component: ParentProfilePage,
});

function ParentProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { t } = useT();

  const { data: profile } = useQuery({
    queryKey: ["parent-profile"],
    queryFn: getProfile,
  });

  const [fullName, setFullName] = useState(user?.fullName ?? "");

  useEffect(() => {
    if (profile?.fullName) setFullName(profile.fullName);
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => updateProfile(fullName.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent-profile"] });
      toast.success(t.student.profileSaved);
    },
    onError: () => toast.error(t.error.saveFailed),
  });

  const displayUser = profile ?? user;
  if (!displayUser) return null;

  const initials = (displayUser.fullName ?? "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const memberSince = profile?.createdAt ? uzDate(new Date(profile.createdAt)) : null;

  return (
    <div className="space-y-6">
      <PageHeader title={t.profile.myProfile} description={t.profile.myProfileDesc} />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <aside className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <AvatarUpload avatarUrl={profile?.avatarUrl} initials={initials} size="lg" />

          <h2 className="mt-4 font-display text-lg font-semibold">{displayUser.fullName}</h2>
          <p className="text-sm text-muted-foreground">
            {roleLabel(user?.role ?? "parent")}
          </p>

          <div className="mt-4 space-y-2 text-left text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> {displayUser.email}
            </p>
            {profile?.subscriptionTier && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                {profile.subscriptionTier === "FREE" ? t.profile.tierFree : profile.subscriptionTier === "PREMIUM" ? t.profile.tierPremium : t.profile.tierSchool} {t.profile.tierSuffix}
              </p>
            )}
            {memberSince && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <School className="h-4 w-4" /> {memberSince} {t.profile.memberSinceSuffix}
              </p>
            )}
          </div>
        </aside>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold">{t.settings.profileData}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t.profile.editNameDesc}</p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="fullName">{t.profile.fullName}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 max-w-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">{t.profile.email}</Label>
              <Input
                id="email"
                type="email"
                value={displayUser.email}
                disabled
                className="h-10 max-w-md bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">{t.settings.emailChangeContact}</p>
            </div>

            {profile?.role && (
              <div className="space-y-1.5">
                <Label>{t.settings.roleLabel}</Label>
                <div className="flex h-10 max-w-md items-center rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                  {roleLabel(user?.role ?? "parent")}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFullName(profile?.fullName ?? user?.fullName ?? "")}
              >
                {t.action.cancel}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !fullName.trim()}>
                {updateMutation.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t.action.save}
              </Button>
            </div>

            {updateMutation.isSuccess && (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                {t.profile.savedSuccess}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
