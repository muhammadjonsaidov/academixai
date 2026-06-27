import { useState, useEffect } from "react";
import { Save, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile, updateProfile } from "@/lib/api";
import { useT } from "@/lib/i18n";

export function ProfileEditSection({ queryKey = "profile" }: { queryKey?: string }) {
  const qc = useQueryClient();
  const { t } = useT();
  const s = t.settings;

  const { data: profile, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: getProfile,
  });

  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (profile?.fullName) setFullName(profile.fullName);
  }, [profile?.fullName]);

  const mut = useMutation({
    mutationFn: () => updateProfile(fullName.trim()),
    onSuccess: (updated) => {
      qc.setQueryData([queryKey], updated);
      toast.success(s.profileUpdated);
    },
    onError: () => toast.error(t.error.saveFailed),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <header className="mb-5 flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">{s.profileData}</h3>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-10 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 rounded-lg bg-muted animate-pulse" />
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (fullName.trim()) mut.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t.profile.fullName}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t.profile.email}</Label>
            <Input
              id="email"
              value={profile?.email ?? ""}
              readOnly
              disabled
              className="h-10 bg-muted/40 cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground">{s.emailChangeContact}</p>
          </div>

          <div className="space-y-1.5">
            <Label>{s.roleLabel}</Label>
            <div className="flex h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
              {profile?.role ? ({
                SCHOOL_ADMIN: "Maktab admini",
                TEACHER: "O'qituvchi",
                STUDENT: "O'quvchi",
                PARENT: "Ota-ona",
                SUPER_ADMIN: "Super admin",
              }[profile.role] ?? profile.role) : "—"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{s.subscriptionLabel}</Label>
            <div className="flex h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
              {profile?.subscriptionTier ?? "—"}
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={mut.isPending || !fullName.trim()}>
              {mut.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mut.isPending ? t.action.loading : t.action.save}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
