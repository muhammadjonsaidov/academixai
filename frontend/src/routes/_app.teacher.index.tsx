import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Users, BarChart3, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getTeacherCourses, getCourseAnalytics, type Course } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/teacher/")({
  head: () => ({ meta: [{ title: "O'qituvchi paneli · AcademiXAI" }] }),
  component: TeacherDashboard,
});

interface Analytics {
  studentCount: number;
  avgScore: number;
  aiInsight: string;
}

function CourseCard({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggleAnalytics() {
    if (open) { setOpen(false); return; }
    if (analytics) { setOpen(true); return; }
    setLoading(true);
    try {
      const data = await getCourseAnalytics(course.id);
      setAnalytics(data);
      setOpen(true);
    } catch {
      toast.error("Analitika yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl">
          {course.emoji ?? "📚"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-foreground truncate">{course.title}</p>
          <p className="text-xs text-muted-foreground">{course.subject} · {course.gradeLevel}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => toast.info("Kurs tafsilotlari — tez orada")}
        >
          Ko'rish
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1"
          onClick={toggleAnalytics}
          disabled={loading}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          {loading ? "..." : "Analitika"}
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {open && analytics && (
        <div className="rounded-xl bg-muted p-3 text-sm space-y-1">
          <p className="font-medium">{analytics.studentCount} o'quvchi</p>
          <p className="text-muted-foreground">O'rtacha ball: <span className="font-semibold text-foreground">{analytics.avgScore.toFixed(1)}</span></p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{analytics.aiInsight.slice(0, 200)}</p>
        </div>
      )}
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherCourses()
      .then(setCourses)
      .catch(() => toast.error("Ma'lumotlar yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  const totalLessons = courses.reduce((s, c) => s + (c.lessons?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="O'qituvchi paneli"
        title={`Xush kelibsiz, ${user?.fullName.split(" ")[0]}!`}
        description="Kurslaringiz, o'quvchilar va AI tahlil natijalari pastda jamlangan."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Jami kurslar" value={loading ? "…" : courses.length} icon={BookOpen} accent="primary" />
        <StatCard label="Jami darslar" value={loading ? "…" : totalLessons} icon={Users} accent="secondary" />
        <StatCard label="AI tahlil" value="Faol" icon={Sparkles} accent="accent" hint="Gemini AI yoqilgan" />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Hali kurs qo'shilmagan"
          description="Kurslar bo'limida yangi kurs yarating."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  );
}
