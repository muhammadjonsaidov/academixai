import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, GraduationCap, Medal, MessageCircle, Sparkles, ShieldCheck, Trophy } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { getExamResults, getDashboard } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/achievements")({
  head: () => ({ meta: [{ title: "Yutuqlar · AcademiXAI" }] }),
  component: AchievementsPage,
});

interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  category: string;
  icon: typeof Trophy;
}

const tierStyle = {
  bronze:   { ring: "ring-amber-700/40",  bg: "from-amber-700/15 to-amber-700/5", label: "Bronza",   icon: Medal,      color: "text-amber-700" },
  silver:   { ring: "ring-zinc-400/40",   bg: "from-zinc-400/15 to-zinc-400/5",   label: "Kumush",   icon: Award,      color: "text-zinc-500"  },
  gold:     { ring: "ring-amber-400/50",  bg: "from-amber-400/20 to-amber-400/5", label: "Oltin",    icon: Trophy,     color: "text-amber-500" },
  platinum: { ring: "ring-primary/40",    bg: "from-primary/15 to-primary/5",     label: "Platinum", icon: ShieldCheck, color: "text-primary"  },
} as const;

function deriveAchievements(
  results: Array<{ id: number; score: number; lessonTitle?: string; takenAt: string }>,
  chatCount: number
): Achievement[] {
  const earned: Achievement[] = [];

  if (results.length >= 1) {
    earned.push({
      id: "first-exam",
      title: "Birinchi imtihon",
      description: "Birinchi marta AI imtihon topshirdingiz. Boshlang'ich qadamingiz ulug'!",
      earnedAt: results[results.length - 1].takenAt,
      tier: "bronze",
      category: "akademik",
      icon: GraduationCap,
    });
  }

  if (results.length >= 3) {
    earned.push({
      id: "active-student",
      title: "Faol talaba",
      description: "3 va undan ko'p imtihon topshirdingiz. Zo'r faollik!",
      earnedAt: results[results.length - 3].takenAt,
      tier: "silver",
      category: "faollik",
      icon: Award,
    });
  }

  const highScores = results.filter((r) => r.score >= 80);
  if (highScores.length >= 1) {
    earned.push({
      id: "high-achiever",
      title: "A'lo talaba",
      description: `${highScores.length} ta imtihonda 80%+ ball to'pladingiz.`,
      earnedAt: highScores[0].takenAt,
      tier: "gold",
      category: "akademik",
      icon: Trophy,
    });
  }

  const perfectScores = results.filter((r) => r.score >= 95);
  if (perfectScores.length >= 1) {
    earned.push({
      id: "perfect",
      title: "Mukammal natija",
      description: "95%+ ball bilan imtihon topshirdingiz. Ajoyib!",
      earnedAt: perfectScores[0].takenAt,
      tier: "platinum",
      category: "akademik",
      icon: ShieldCheck,
    });
  }

  if (chatCount >= 5) {
    earned.push({
      id: "ai-lover",
      title: "AI Sevgisi",
      description: `AI Ustoz bilan ${chatCount} ta savol-javob o'tkazdingiz.`,
      earnedAt: new Date().toISOString(),
      tier: chatCount >= 20 ? "gold" : "bronze",
      category: "AI",
      icon: Sparkles,
    });
  }

  if (chatCount >= 20) {
    earned.push({
      id: "ai-master",
      title: "AI Ustoz do'sti",
      description: "AI bilan 20+ marta suhbatlashgan siz — haqiqiy zamonaviy talaba!",
      earnedAt: new Date().toISOString(),
      tier: "silver",
      category: "AI",
      icon: MessageCircle,
    });
  }

  return earned;
}

function AchievementsPage() {
  const { t } = useT();
  const { data: results = [], isLoading: rLoading } = useQuery({
    queryKey: ["exam-results"],
    queryFn: getExamResults,
  });

  const { data: stats, isLoading: sLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getDashboard,
  });

  const isLoading = rLoading || sLoading;
  const achievements = deriveAchievements(results, stats?.chatCount ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.achievements.title}
        title={t.achievements.title}
        description={t.achievements.description}
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : achievements.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">Hali nishon yo'q</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Imtihon topshing va AI Ustoz bilan suhbatlashing — nishonlar avtomatik qo'shiladi.
          </p>
          <div className="flex gap-2 mt-1">
            <Button asChild variant="outline" size="sm">
              <Link to="/student/exams">Imtihon boshlash</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/student/ai-tutor">
                <Sparkles className="h-3.5 w-3.5" />
                AI Ustoz
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {achievements.map((a) => {
            const t = tierStyle[a.tier];
            const Icon = a.icon;
            return (
              <article
                key={a.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br p-5 shadow-soft transition-all hover:shadow-elevated",
                  t.bg,
                )}
              >
                <div className={cn("grid h-14 w-14 place-items-center rounded-2xl bg-card ring-2", t.ring)}>
                  <Icon className={cn("h-7 w-7", t.color)} />
                </div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.label} · {a.category}
                </p>
                <h3 className="mt-1 font-display text-base font-semibold leading-snug">{a.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{a.description}</p>
                <p className="mt-4 text-[11px] text-muted-foreground">
                  {uzDate(new Date(a.earnedAt))}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <section className="rounded-2xl border border-dashed border-border bg-card/60 p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Ko'proq nishon qozonish uchun</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Imtihon topshing, AI Ustoz bilan suhbatlashing va yuqori natijalar qozonging.
              Har bir yutuq avtomatik ravishda qo'shiladi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
