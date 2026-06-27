import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, MessageCircle, Trophy, User, TrendingUp, TrendingDown } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { getChildInfo } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/parent/child")({
  head: () => ({ meta: [{ title: "Farzand profili · AcademiXAI" }] }),
  component: ChildPage,
});

function ChildPage() {
  const { t } = useT();
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

  if (error || !data?.hasChildren || data.children.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={t.nav.myChild} title={t.parent.noChild} description="" />
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-center">
          <User className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">{t.parent.noChild}</p>
          <p className="text-sm text-muted-foreground max-w-xs">{t.parent.noChildDesc}</p>
        </div>
      </div>
    );
  }

  const child = data.children[0];
  const initials = child.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const avgSentiment =
    child.sentimentTrend.length > 0
      ? child.sentimentTrend.slice(0, 10).reduce((a, b) => a + b.score, 0) /
        Math.min(10, child.sentimentTrend.length)
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.myChild}
        title={t.parent.description}
        description={t.parent.sentimentDesc}
      />

      {/* Profile card */}
      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 font-display text-2xl font-semibold text-primary">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-semibold">{child.fullName}</h2>
          <p className="text-sm text-muted-foreground">{child.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              avgSentiment > 0.3
                ? "bg-success/15 text-success"
                : avgSentiment < -0.2
                ? "bg-destructive/15 text-destructive"
                : "bg-muted text-muted-foreground",
            )}
          >
            {avgSentiment > 0.3 ? t.parent.sentiment.positive : avgSentiment < -0.2 ? t.parent.sentiment.negative : t.parent.sentiment.neutral}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              child.avgScore >= 80
                ? "bg-success/15 text-success"
                : child.avgScore >= 60
                ? "bg-warning/15 text-warning"
                : child.avgScore > 0
                ? "bg-destructive/15 text-destructive"
                : "bg-muted text-muted-foreground",
            )}
          >
            {child.avgScore > 0 ? `${t.parent.avgScore}: ${child.avgScore}%` : t.parent.noExams}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t.parent.enrolledCourses} value={child.enrolledCourses.length} icon={BookOpen} accent="primary" />
        <StatCard
          label={t.parent.avgScore}
          value={child.avgScore > 0 ? `${child.avgScore}%` : "—"}
          icon={Trophy}
          accent="secondary"
          hint={t.parent.allExams}
        />
        <StatCard label={t.parent.aiChats} value={child.chatCount} icon={MessageCircle} accent="accent" hint={t.parent.aiChats} />
      </div>

      {/* Enrolled courses */}
      {child.enrolledCourses.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold mb-4">{t.parent.enrolledCourses}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {child.enrolledCourses.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                <span className="text-2xl">{c.emoji ?? "📚"}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{c.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.subject}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent exams */}
        <section className="rounded-2xl border border-border bg-card shadow-soft">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">{t.parent.recentExams}</h2>
          </header>
          {child.recentExams.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">{t.parent.noExams}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {child.recentExams.map((r) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
                      r.score >= 80
                        ? "bg-success/15 text-success"
                        : r.score >= 60
                        ? "bg-warning/15 text-warning"
                        : "bg-destructive/15 text-destructive",
                    )}
                  >
                    {r.score}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.lessonTitle ?? "Imtihon"}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.courseName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.takenAt ? uzDate(r.takenAt) : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Sentiment trend */}
        <section className="rounded-2xl border border-border bg-card shadow-soft">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">{t.parent.sentimentAnalysis}</h2>
            <p className="text-xs text-muted-foreground">{t.parent.sentimentDesc}</p>
          </header>
          {child.sentimentTrend.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">{t.parent.noSentiment}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-56 overflow-y-auto">
              {child.sentimentTrend.slice(0, 8).map((s, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-2.5">
                  {s.score > 0.2 ? (
                    <TrendingUp className="h-4 w-4 text-success shrink-0" />
                  ) : s.score < -0.1 ? (
                    <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <div className="h-4 w-4 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      s.label === "curious" || s.label === "confident"
                        ? "bg-success/10 text-success"
                        : s.label === "frustrated" || s.label === "anxious"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{uzDate(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
