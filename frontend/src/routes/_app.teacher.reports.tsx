import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, Sparkles, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { EmptyState } from "@/components/shell/EmptyState";
import { getTeacherCourses, getCourseAnalytics, type Course } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/reports")({
  head: () => ({ meta: [{ title: "Hisobotlar · AcademiXAI" }] }),
  component: ReportsPage,
});

interface CourseWithAnalytics extends Course {
  studentCount: number;
  avgScore: number;
  aiInsight: string;
  analyticsLoaded: boolean;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 80
              ? "bg-green-500"
              : pct >= 60
                ? "bg-yellow-500"
                : "bg-red-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold w-12 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function ReportsPage() {
  const { t } = useT();
  const [courses, setCourses] = useState<CourseWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rawCourses = await getTeacherCourses();
        const initial: CourseWithAnalytics[] = rawCourses.map((c) => ({
          ...c,
          studentCount: 0,
          avgScore: 0,
          aiInsight: "",
          analyticsLoaded: false,
        }));
        setCourses(initial);
        setLoading(false);

        // Load analytics for each course in parallel
        const updated = await Promise.all(
          rawCourses.map(async (c) => {
            try {
              const analytics = await getCourseAnalytics(c.id);
              return {
                ...c,
                studentCount: analytics.studentCount,
                avgScore: analytics.avgScore,
                aiInsight: analytics.aiInsight,
                analyticsLoaded: true,
              };
            } catch {
              return {
                ...c,
                studentCount: 0,
                avgScore: 0,
                aiInsight: "",
                analyticsLoaded: true,
              };
            }
          }),
        );
        setCourses(updated);
      } catch {
        toast.error(t.error.loadFailed);
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalStudents = courses.reduce((s, c) => s + c.studentCount, 0);
  const overallAvg =
    courses.length > 0
      ? courses.reduce((s, c) => s + c.avgScore, 0) / courses.length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.nav.reports}
        description="Barcha kurslar bo'yicha statistika va AI tahlillar."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.teacher.totalCourses}
          value={loading ? "…" : courses.length}
          icon={BookOpen}
          accent="primary"
        />
        <StatCard
          label={t.admin.totalStudents}
          value={loading ? "…" : totalStudents}
          icon={Users}
          accent="secondary"
        />
        <StatCard
          label={t.teacher.avgScore}
          value={loading ? "…" : overallAvg.toFixed(1) + "%"}
          icon={TrendingUp}
          accent="accent"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-52 rounded-2xl border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={t.teacher.noCourses}
          description={t.teacher.noCoursesDesc}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl">
                  {course.emoji ?? "📚"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold truncate">
                    {course.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {course.subject} · {course.gradeLevel}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold">{course.studentCount}</p>
                  <p className="text-xs text-muted-foreground">{t.teacher.students}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold">
                    {course.avgScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.teacher.avgScore}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {t.teacher.avgScore}
                </p>
                {course.analyticsLoaded ? (
                  <ScoreBar score={course.avgScore} />
                ) : (
                  <div className="h-2 rounded-full bg-muted animate-pulse" />
                )}
              </div>

              {course.aiInsight && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {course.aiInsight}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
