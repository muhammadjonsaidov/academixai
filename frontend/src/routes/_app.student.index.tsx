import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  GraduationCap,
  MessageCircle,
  Sparkles,
  Trophy,
} from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getCourses, getDashboard } from "@/lib/api";
import { uzDate, uzLongDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Xayrli tun";
  if (h < 12) return "Xayrli ertalab";
  if (h < 18) return "Xayrli kun";
  return "Xayrli kechqurun";
}

export const Route = createFileRoute("/_app/student/")({
  head: () => ({ meta: [{ title: "Bosh sahifa · AcademiXAI" }] }),
  component: StudentHome,
});

function StudentHome() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getDashboard,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });

  const avgScore = stats?.avgScore ?? 0;
  const enrolledCount = stats?.enrolledCount ?? 0;
  const chatCount = stats?.chatCount ?? 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        eyebrow={greeting()}
        title={`${user?.fullName.split(" ")[0]}, ishni davom ettiramizmi?`}
        description="Bugungi kurs darslari, AI tavsiyalari va so'nggi imtihon natijalari pastda."
        actions={
          <Button asChild className="h-10">
            <Link to="/student/ai-ustoz">
              <Sparkles className="h-4 w-4" />
              AI Ustoz bilan suhbatlashish
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Yozilgan kurslar"
          value={statsLoading ? "…" : enrolledCount}
          icon={CalendarCheck}
          accent="primary"
          hint="Faol kurslar"
        />
        <StatCard
          label="O'rtacha ball"
          value={statsLoading ? "…" : avgScore > 0 ? `${avgScore}%` : "—"}
          icon={Trophy}
          accent="secondary"
          hint="Barcha imtihonlar bo'yicha"
        />
        <StatCard
          label="AI muloqotlar"
          value={statsLoading ? "…" : chatCount}
          icon={MessageCircle}
          accent="accent"
          hint="Jami AI savollari"
        />
        <StatCard
          label="Imtihonlar"
          value={statsLoading ? "…" : stats?.recentExams?.length ?? 0}
          icon={GraduationCap}
          accent="primary"
          hint="Topshirilgan imtihonlar"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Enrolled courses */}
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-soft">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Mening kurslarim</h2>
              <p className="text-xs text-muted-foreground">{uzLongDate()}</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/student/kurslar">
                Barchasini ko'rish
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </header>
          {coursesLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-center px-4">
              <BookOpen className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Hali hech qanday kurslarga yozilmagan</p>
              <Button asChild size="sm" variant="outline">
                <Link to="/student/kurslar">Kurslarga qaralsin</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {courses.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    to="/student/kurslar"
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl">
                      {c.emoji ?? "📚"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{c.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.subject}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* AI recommendation */}
        <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 shadow-soft">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" />
            AI Tavsiya
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug">
            AI Ustoz bilan mashq qiling
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Har kuni AI Ustoz Amir bilan suhbatlashing. Mavzuni tushuntirib beradi, savollarga javob
            beradi va imtihonga tayyorlaydi.
          </p>
          <Button asChild variant="default" size="sm" className="mt-5">
            <Link to="/student/ai-ustoz">
              Suhbatni boshlash
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </section>
      </div>

      {/* Recent exam results */}
      {stats && stats.recentExams.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <header className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">So'nggi imtihon natijalari</h2>
              <p className="text-xs text-muted-foreground">AI tomonidan baholangan</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/student/imtihonlar">
                Hammasi
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recentExams.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                <div
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-xl font-bold text-sm",
                    e.score >= 80
                      ? "bg-success/15 text-success"
                      : e.score >= 60
                      ? "bg-warning/15 text-warning"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {e.score}%
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.lessonTitle}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.courseName}</p>
                  <p className="text-[11px] text-muted-foreground">{uzDate(new Date(e.takenAt))}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Enrolled courses subject progress */}
      {courses.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <header className="mb-5">
            <h2 className="font-display text-lg font-semibold">Fanlar bo'yicha kurslar</h2>
            <p className="text-xs text-muted-foreground">Yozilgan barcha kurslar</p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link
                key={c.id}
                to="/student/kurslar"
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 hover:border-primary/40 transition-colors"
              >
                <span className="text-2xl">{c.emoji ?? "📚"}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.subject}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
