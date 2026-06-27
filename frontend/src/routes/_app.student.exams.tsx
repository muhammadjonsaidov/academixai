import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertCircle, CheckCircle2, Clock, GraduationCap, Loader2, PlayCircle, Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getExamResults, getCourses, type ExamResultDetail } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/exams")({
  head: () => ({ meta: [{ title: "Imtihonlar · AcademiXAI" }] }),
  component: ExamsPage,
});

function ExamsPage() {
  const navigate = useNavigate();
  const { t } = useT();
  const [viewing, setViewing] = useState<ExamResultDetail | null>(null);

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["exam-results"],
    queryFn: getExamResults,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });

  const isLoading = resultsLoading || coursesLoading;

  // Completed exams from results
  const completedExamLessonIds = new Set(results.map((r) => r.lessonId).filter(Boolean));

  // Available lessons = enrolled course lessons not yet examined
  const availableLessons: Array<{ courseId: number; courseTitle: string; lessonId: number; lessonTitle: string }> = [];
  for (const course of courses) {
    for (const lesson of course.lessons ?? []) {
      if (!completedExamLessonIds.has(lesson.id)) {
        availableLessons.push({
          courseId: course.id,
          courseTitle: course.title ?? "",
          lessonId: lesson.id,
          lessonTitle: (lesson as any).titleUz ?? lesson.title,
        });
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.exams.title}
        description={t.exams.description}
      />

      {/* Available to take */}
      {availableLessons.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">{t.exams.available}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {availableLessons.slice(0, 6).map((l) => (
              <div
                key={l.lessonId}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-elevated transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/30 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    <PlayCircle className="h-3 w-3" />
                    {t.exams.availableBadge}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold">{l.lessonTitle}</h3>
                <p className="text-xs text-muted-foreground">{l.courseTitle}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.exams.questions}</p>
                    <p className="mt-0.5 text-sm font-semibold">5</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.exams.time}</p>
                    <p className="mt-0.5 text-sm font-semibold">5 min</p>
                  </div>
                </div>

                <Button
                  className="mt-4"
                  onClick={() => navigate({ to: `/student/exam/${l.lessonId}` as never })}
                >
                  {t.exams.start}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed exams */}
      {results.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">{t.exams.completed}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((r) => (
              <div
                key={r.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-elevated transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-success/10 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3 w-3" />
                    {t.exams.completedBadge}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold">
                  {r.lessonTitle ?? t.exams.title}
                </h3>
                <p className="text-xs text-muted-foreground">{r.courseName ?? ""}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.exams.score}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-lg font-bold",
                        r.score >= 80 ? "text-success" : r.score >= 60 ? "text-warning" : "text-destructive",
                      )}
                    >
                      {r.score}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.exams.date}</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {uzDate(new Date(r.takenAt))}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setViewing(r)}>
                    {t.exams.viewResult}
                  </Button>
                  {r.lessonId && (
                    <Button
                      variant="ghost"
                      className="gap-1.5"
                      onClick={() => navigate({ to: `/student/exam/${r.lessonId}` as never })}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {t.exams.retry}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {results.length === 0 && availableLessons.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t.exams.noExams}</p>
          <Button variant="outline" onClick={() => navigate({ to: "/student/courses" })}>
            {t.exams.goCourses}
          </Button>
        </div>
      )}

      {/* Result detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {viewing.lessonTitle ?? t.exams.result}
                </DialogTitle>
                <DialogDescription>
                  {t.exams.score}: <span className="font-semibold text-foreground">{viewing.score}%</span>
                  {viewing.courseName && ` · ${viewing.courseName}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2 text-sm">
                {viewing.feedbackUz ? (
                  <>
                    <div className={cn("rounded-xl p-4", viewing.score >= 60 ? "bg-success/10" : "bg-warning/10")}>
                      <p className={cn("font-medium mb-2", viewing.score >= 60 ? "text-success" : "text-warning")}>
                        {viewing.score >= 80 ? t.exams.excellentResult : viewing.score >= 60 ? t.exams.goodResult : t.exams.keepGoing}
                      </p>
                      <p className="text-foreground leading-relaxed">{viewing.feedbackUz}</p>
                    </div>
                    {viewing.lessonId && (
                      <Button className="w-full" onClick={() => {
                        setViewing(null);
                        navigate({ to: `/student/exam/${viewing.lessonId}` as never });
                      }}>
                        <Sparkles className="h-4 w-4" />
                        {t.exams.retake}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t.exams.noFeedback}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
