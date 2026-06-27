import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  FlaskConical,
  PlayCircle,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCourses, getCourse, enrollCourse, type Course, type Lesson } from "@/lib/api";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/courses")({
  head: () => ({ meta: [{ title: "Kurslarim · AcademiXAI" }] }),
  component: CoursesPage,
});

// ── PhET modal (inline) ──────────────────────────────────────────────────────
function PhetModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
          <FlaskConical className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{title}</span>
          <Badge variant="secondary" className="text-[11px]">PhET Simulatsiyasi</Badge>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 hover:bg-muted transition-colors"
            aria-label="Yopish"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </header>
        <iframe
          src={url}
          title={title}
          className="flex-1 w-full border-0"
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}

// ── Course detail panel ──────────────────────────────────────────────────────
function CourseDetail({ courseId, onBack }: { courseId: number; onBack: () => void }) {
  const { t } = useT();
  const [phet, setPhet] = useState<{ url: string; title: string } | null>(null);
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourse(courseId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← {t.action.back}
      </button>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{(course as any).coverEmoji ?? "📚"}</span>
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground">
              {(course as any).titleUz ?? course.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {course.subject} · {course.gradeLevel}-sinf · {(course as any).teacherName ?? ""}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {(course as any).descriptionUz ?? ""}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold mb-4">
          {t.courses.lessons}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({course.lessons?.length ?? 0})
          </span>
        </h2>

        {!course.lessons || course.lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t.courses.noCourses}
            description={t.courses.noContent}
          />
        ) : (
          <ul className="space-y-3">
            {course.lessons.map((lesson: Lesson, idx: number) => (
              <li
                key={lesson.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {(lesson as any).titleUz ?? lesson.title}
                  </p>
                  {lesson.phetUrl && (
                    <p className="flex items-center gap-1 text-[11px] text-primary mt-0.5">
                      <FlaskConical className="h-3 w-3" />
                      {t.courses.interactive}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lesson.phetUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-primary border-primary/30"
                      onClick={() => setPhet({ url: lesson.phetUrl!, title: (lesson as any).titleUz ?? lesson.title })}
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      {t.courses.interactive}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate({ to: `/student/courses/${courseId}/lessons/${lesson.id}` as never })}
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    {t.courses.startLesson}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {phet && (
        <PhetModal url={phet.url} title={phet.title} onClose={() => setPhet(null)} />
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
function CoursesPage() {
  const { t } = useT();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["student-courses"],
    queryFn: getCourses,
  });

  const { mutate: enroll, isPending: enrolling } = useMutation({
    mutationFn: enrollCourse,
    onSuccess: () => {
      toast.success(t.courses.startLesson);
      qc.invalidateQueries({ queryKey: ["student-courses"] });
    },
    onError: () => toast.error(t.error.saveFailed),
  });

  if (selectedId !== null) {
    return <CourseDetail courseId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.courses}
        title={t.courses.title}
        description={t.courses.description}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t.courses.noCourses}
          description={t.courses.noCoursesDesc}
        />
      ) : (
        <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.slice(page * 20, (page + 1) * 20).map((course: Course) => (
            <button
              key={course.id}
              onClick={() => setSelectedId(course.id)}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated hover:border-primary/30"
            >
              <div className="text-4xl mb-4">{(course as any).coverEmoji ?? "📚"}</div>
              <h3 className="font-display font-semibold text-foreground leading-snug">
                {(course as any).titleUz ?? course.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {course.subject} · {course.gradeLevel}-sinf
              </p>
              {(course as any).descriptionUz && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
                  {(course as any).descriptionUz}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {(course as any).lessonCount ?? course.lessons?.length ?? 0} {t.courses.lessons}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs border-primary/30 text-primary"
                    disabled={enrolling}
                    onClick={(e) => { e.stopPropagation(); enroll(course.id); }}
                  >
                    + {t.action.add}
                  </Button>
                  <span className="flex items-center gap-1.5 text-primary font-medium group-hover:underline">
                    {t.action.view}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <Pagination page={page} total={courses.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
