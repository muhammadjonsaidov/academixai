import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Camera, CheckCircle2, Mail, Save, School, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { getProfile, updateProfile, getDashboard } from "@/lib/api";
import { roleLabel } from "@/lib/navigation";
import { uzDate } from "@/lib/format/date";

export const Route = createFileRoute("/_app/student/profil")({
  head: () => ({ meta: [{ title: "Profil · AcademiXAI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const { data: stats } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getDashboard,
  });

  const [fullName, setFullName] = useState(user?.fullName ?? "");

  useEffect(() => {
    if (profile?.fullName) setFullName(profile.fullName);
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => updateProfile(fullName.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profil saqlandi");
    },
    onError: () => toast.error("Saqlashda xato"),
  });

  const displayUser = profile ?? user;
  if (!displayUser) return null;

  const initials = (displayUser.fullName ?? "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const memberSince = profile?.createdAt ? uzDate(new Date(profile.createdAt)) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Mening profilim" description="Shaxsiy ma'lumotlaringizni boshqaring." />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Sidebar */}
        <aside className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
          <div className="relative mx-auto h-24 w-24">
            <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 font-display text-2xl font-semibold text-primary">
              {initials}
            </div>
            <button
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground hover:scale-105 transition-transform"
              aria-label="Rasm o'zgartirish"
              onClick={() => toast.info("Rasm yuklash tez orada qo'shiladi")}
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <h2 className="mt-4 font-display text-lg font-semibold">{displayUser.fullName}</h2>
          <p className="text-sm text-muted-foreground">
            {roleLabel(user?.role ?? "student")}
          </p>

          <div className="mt-4 space-y-2 text-left text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> {displayUser.email}
            </p>
            {profile?.subscriptionTier && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                {profile.subscriptionTier === "FREE" ? "Bepul" : profile.subscriptionTier === "PREMIUM" ? "Premium" : "Maktab"} tarif
              </p>
            )}
            {memberSince && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <School className="h-4 w-4" /> {memberSince} dan beri
              </p>
            )}
          </div>

          {/* Stats mini */}
          {stats && (
            <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-border p-3 text-center">
              <div>
                <p className="font-semibold text-foreground">{stats.enrolledCount}</p>
                <p className="text-[10px] text-muted-foreground">Kurs</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{stats.avgScore > 0 ? `${stats.avgScore}%` : "—"}</p>
                <p className="text-[10px] text-muted-foreground">Ball</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{stats.chatCount}</p>
                <p className="text-[10px] text-muted-foreground">AI savol</p>
              </div>
            </div>
          )}
        </aside>

        {/* Edit form */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold">Shaxsiy ma'lumotlar</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ism-sharifingizni yangilashingiz mumkin.</p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="fullName">To'liq ism-sharif</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 max-w-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Elektron pochta</Label>
              <Input
                id="email"
                type="email"
                value={displayUser.email}
                disabled
                className="h-10 max-w-md bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Elektron pochta o'zgartirish mumkin emas</p>
            </div>

            {profile?.role && (
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <div className="flex h-10 max-w-md items-center rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                  {roleLabel(user?.role ?? "student")}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFullName(profile?.fullName ?? user?.fullName ?? "")}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !fullName.trim()}>
                {updateMutation.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Saqlash
              </Button>
            </div>

            {updateMutation.isSuccess && (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Profil muvaffaqiyatli saqlandi
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
