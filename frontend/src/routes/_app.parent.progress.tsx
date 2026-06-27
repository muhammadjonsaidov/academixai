import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart2, User } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { getChildInfo, api } from "@/lib/api";
import type { SentimentPoint } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/parent/progress")({
  head: () => ({ meta: [{ title: "O'quv jarayoni · AcademiXAI" }] }),
  component: ProgressPage,
});

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive",
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span
        className={cn(
          "w-10 text-right text-xs font-semibold",
          score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive",
        )}
      >
        {score}%
      </span>
    </div>
  );
}

function ProgressPage() {
  const { t } = useT();

  const { data: childData, isLoading: loadingChild } = useQuery({
    queryKey: ["child-info"],
    queryFn: getChildInfo,
  });

  const childId = childData?.children?.[0]?.id;

  const { data: sentimentData, isLoading: loadingSentiment } = useQuery({
    queryKey: ["child-sentiment", childId],
    queryFn: () => api.get<SentimentPoint[]>(`/api/parent/children/${childId}/sentiment`),
    enabled: !!childId,
  });

  const isLoading = loadingChild || loadingSentiment;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!childData?.hasChildren || childData.children.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={t.nav.progress} title={t.parent.title} description="" />
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-center">
          <User className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">{t.parent.noChild}</p>
        </div>
      </div>
    );
  }

  const child = childData.children[0];
  const sentiment: SentimentPoint[] = sentimentData ?? child.sentimentTrend;

  const positiveCount = sentiment.filter((s) => s.score > 0.3).length;
  const negativeCount = sentiment.filter((s) => s.score < -0.2).length;
  const neutralCount = sentiment.length - positiveCount - negativeCount;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.progress}
        title={t.parent.sentimentAnalysis}
        description={child.fullName}
      />

      {/* Sentiment summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft text-center">
          <p className="text-3xl font-bold text-success">{positiveCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.parent.sentiment.positive}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft text-center">
          <p className="text-3xl font-bold text-muted-foreground">{neutralCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.parent.sentiment.neutral}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft text-center">
          <p className="text-3xl font-bold text-destructive">{negativeCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.parent.sentiment.negative}</p>
        </div>
      </div>

      {/* Sentiment list */}
      <section className="rounded-2xl border border-border bg-card shadow-soft">
        <header className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{t.parent.sentimentAnalysis}</h2>
          <p className="text-xs text-muted-foreground">{t.parent.sentimentDesc}</p>
        </header>
        {sentiment.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t.parent.noSentiment}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sentiment.map((s, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-3.5">
                {s.score > 0.3 ? (
                  <TrendingUp className="h-5 w-5 text-success shrink-0" />
                ) : s.score < -0.2 ? (
                  <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
                ) : (
                  <BarChart2 className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      s.score > 0.3
                        ? "bg-success/10 text-success"
                        : s.score < -0.2
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      s.score > 0.3
                        ? "text-success"
                        : s.score < -0.2
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {s.score > 0 ? "+" : ""}
                    {s.score.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">{uzDate(s.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Academic progress */}
      <section className="rounded-2xl border border-border bg-card shadow-soft">
        <header className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{t.parent.recentExams}</h2>
          <p className="text-xs text-muted-foreground">
            {t.parent.avgScore}:{" "}
            <span
              className={cn(
                "font-semibold",
                child.avgScore >= 80
                  ? "text-success"
                  : child.avgScore >= 60
                  ? "text-warning"
                  : "text-destructive",
              )}
            >
              {child.avgScore > 0 ? `${child.avgScore}%` : t.parent.noExams}
            </span>
          </p>
        </header>
        {child.recentExams.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t.parent.noExams}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {child.recentExams.map((r) => (
              <li key={r.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="truncate font-medium text-sm">{r.lessonTitle ?? t.exams.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.courseName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {r.takenAt ? uzDate(r.takenAt) : ""}
                  </span>
                </div>
                <ScoreBar score={r.score} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
