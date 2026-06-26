import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle, BookOpen, GraduationCap, MessageCircle, Sparkles, Trophy, User,
} from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { Button } from "@/components/ui/button";
import { getChildInfo } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/parent/")({
  head: () => ({ meta: [{ title: "Ota-ona paneli · AcademiXAI" }] }),
  component: ParentDashboard,
});

function ParentDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["child-info"],
    queryFn: getChildInfo,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data?.hasChild) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Ota-ona paneli"
          title="Farzandingiz ta'limini kuzating"
          description="Farzandingizning kunlik faolligi, baholari va AI tahlillari shu yerda."
        />
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-center">
          <User className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">Farzand ma'lumoti topilmadi</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Sizning profilingizga bog'liq farzand topilmadi. Administrator bilan bog'laning.
          </p>
        </div>
      </div>
    );
  }

  const child = data.child!;
  const avgScore = data.avgScore ?? 0;
  const chatCount = data.chatCount ?? 0;
  const recentExams = data.recentExams ?? [];
  const courses = data.enrolledCourses ?? [];

  const initials = child.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ota-ona paneli"
        title="Farzandingiz ta'limi"
        description="Farzandingizning o'quv natijalari va AI faoliyati haqida to'liq ma'lumot."
      />

      {/* Child info card */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 font-display text-xl font-semibold text-primary">
          {initials}
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">{child.fullName}</h2>
          <p className="text-sm text-muted-foreground">{child.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            avgScore >= 80 ? "bg-success/15 text-success" :
            avgScore >= 60 ? "bg-warning/15 text-warning" :
            avgScore > 0 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
          )}>
            {avgScore > 0 ? `O'rtacha: ${avgScore}%` : "Imtihon yo'q"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Yozilgan kurslar"
          value={courses.length}
          icon={BookOpen}
          accent="primary"
        />
        <StatCard
          label="O'rtacha ball"
          value={avgScore > 0 ? `${avgScore}%` : "—"}
          icon={Trophy}
          accent="secondary"
          hint="Barcha imtihonlar bo'yicha"
        />
        <StatCard
          label="AI muloqotlar"
          value={chatCount}
          icon={MessageCircle}
          accent="accent"
          hint="AI Ustoz bilan savollar"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent exams */}
        <section className="rounded-2xl border border-border bg-card shadow-soft">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">So'nggi imtihonlar</h2>
          </header>
          {recentExams.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-center px-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Hali imtihon topshirilmagan</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentExams.map((r) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
                    r.score >= 80 ? "bg-success/15 text-success" :
                    r.score >= 60 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                  )}>
                    {r.score}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{r.lessonTitle ?? "Imtihon"}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.courseName ?? ""}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.takenAt ? uzDate(new Date(r.takenAt)) : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Enrolled courses */}
        <section className="rounded-2xl border border-border bg-card shadow-soft">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">O'qiyotgan kurslar</h2>
          </header>
          {courses.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-center px-4">
              <BookOpen className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Hali kurslarga yozilmagan</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {courses.map((c) => (
                <li key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="text-2xl">{c.emoji ?? "📚"}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{c.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.subject}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* AI insight */}
      {recentExams.length > 0 && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">AI tahlil</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {avgScore >= 80
                  ? `${child.fullName.split(" ")[0]} ajoyib natijalar ko'rsatmoqda! O'rtacha ball ${avgScore}% — zo'r ishlayapti.`
                  : avgScore >= 60
                  ? `${child.fullName.split(" ")[0]} yaxshi natijalar ko'rsatmoqda, lekin ${100 - avgScore}% yaxshilash imkoni bor. AI Ustoz bilan ko'proq mashq qilish tavsiya etiladi.`
                  : `${child.fullName.split(" ")[0]} qo'shimcha yordam va mashqqa muhtoj. AI Ustoz bilan kundalik suhbatni oshirish tavsiya etiladi.`}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
