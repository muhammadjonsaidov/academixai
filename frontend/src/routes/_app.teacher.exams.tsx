import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Star } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/exams")({
  head: () => ({ meta: [{ title: "Imtihon natijalari · AcademiXAI" }] }),
  component: ExamsPage,
});

interface ExamResult {
  id: number;
  studentName: string;
  lessonTitle: string;
  courseName: string;
  score: number;
  feedbackUz: string;
  takenAt: string;
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        score >= 80
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : score >= 60
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      )}
    >
      <Star className="h-2.5 w-2.5" />
      {score}%
    </span>
  );
}

function ExamsPage() {
  const { t } = useT();
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["teacher-exam-results"],
    queryFn: () =>
      api.get<ExamResult[]>("/api/teacher/exam-results"),
  });

  // Group by course
  const grouped = results.reduce<Record<string, ExamResult[]>>((acc, r) => {
    const key = r.courseName ?? "Boshqa";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const avgScore =
    results.length > 0
      ? results.reduce((s, r) => s + r.score, 0) / results.length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.exams}
        title={t.exams.title}
        description={t.exams.description}
      />

      {!isLoading && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">{t.exams.result}</p>
            <p className="mt-1 text-3xl font-bold">{results.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">{t.teacher.avgScore}</p>
            <p className="mt-1 text-3xl font-bold">{avgScore.toFixed(1)}%</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">{t.nav.courses}</p>
            <p className="mt-1 text-3xl font-bold">{Object.keys(grouped).length}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t.exams.noResults}
          description={t.exams.description}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([courseName, courseResults]) => (
            <section
              key={courseName}
              className="rounded-2xl border border-border bg-card shadow-soft"
            >
              <header className="border-b border-border px-5 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold">{courseName}</h2>
                  <p className="text-xs text-muted-foreground">{courseResults.length} ta natija</p>
                </div>
                <Badge variant="secondary">
                  O'rtacha:{" "}
                  {(
                    courseResults.reduce((s, r) => s + r.score, 0) /
                    courseResults.length
                  ).toFixed(1)}
                  %
                </Badge>
              </header>

              <div className="divide-y divide-border">
                {courseResults.map((r) => (
                  <div key={r.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{r.studentName}</p>
                        <span className="text-muted-foreground text-xs">·</span>
                        <p className="text-xs text-muted-foreground">{r.lessonTitle}</p>
                      </div>
                      {r.feedbackUz && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                          {r.feedbackUz}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ScoreBadge score={r.score} />
                      <span className="text-xs text-muted-foreground">
                        {uzDate(r.takenAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
