import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Users, BarChart3, Sparkles, ChevronDown, ChevronUp,
  Plus, PlusCircle, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import {
  getTeacherCourses, getCourseAnalytics, createCourse, createLesson, type Course,
} from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Analytics ─────────────────────────────────────────────────────────────────

const DAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

function buildWeeklyData(seed: number) {
  return DAYS.map((day, i) => ({
    day,
    faollik: 40 + ((seed * (i + 1) * 13) % 40),
    davomat: 60 + ((seed * (i + 2) * 7) % 30),
  }));
}

interface CourseBar { name: string; talabalar: number; ball: number }

function AnalyticsSection({ courses, analytics }: {
  courses: Course[];
  analytics: Record<number, { studentCount: number; avgScore: number }>;
}) {
  const weekData = buildWeeklyData(courses.length + 3);
  const courseBarData: CourseBar[] = courses.slice(0, 6).map((c) => ({
    name: (c.coverEmoji ?? "📚") + " " + ((c.titleUz ?? c.title ?? "").slice(0, 10)),
    talabalar: analytics[c.id]?.studentCount ?? 0,
    ball: analytics[c.id]?.avgScore ?? 0,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Weekly engagement area chart */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Haftalik ko'rsatkich
            </p>
            <p className="font-display text-base font-semibold text-foreground">O'quvchi faolligi</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            +12%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-faollik" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-davomat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="faollik" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad-faollik)" name="Faollik" dot={false} />
            <Area type="monotone" dataKey="davomat" stroke="hsl(var(--secondary))" strokeWidth={2} fill="url(#grad-davomat)" name="Davomat" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Faollik</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary" /> Davomat</span>
        </div>
      </div>

      {/* Per-course bar chart */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Kurs bo'yicha
          </p>
          <p className="font-display text-base font-semibold text-foreground">O'quvchilar soni</p>
        </div>
        {courseBarData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Kurslar mavjud emas
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={courseBarData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="talabalar" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="O'quvchilar" />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {courses.slice(0, 3).map((c) => {
            const score = analytics[c.id]?.avgScore ?? 0;
            return (
              <div key={c.id} className="rounded-lg bg-muted/50 px-2 py-2 text-center">
                <p className="text-sm font-bold" style={{ color: score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444" }}>
                  {score.toFixed(0)}%
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{c.coverEmoji ?? "📚"} {c.titleUz ?? c.title}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/teacher/")({
  head: () => ({ meta: [{ title: "O'qituvchi paneli · AcademiXAI" }] }),
  component: TeacherDashboard,
});

interface Analytics {
  studentCount: number;
  avgScore: number;
  aiInsight: string;
}

const EMOJIS = ["📚", "🔬", "🧮", "🌍", "📖", "🎨", "🏋️", "🎵", "🖥️", "🧪"];

function CreateCourseModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { t } = useT();
  const [form, setForm] = useState({ titleUz: "", subject: "", gradeLevel: 5, descriptionUz: "", coverEmoji: "📚" });
  const { mutate, isPending } = useMutation({
    mutationFn: () => createCourse(form),
    onSuccess: () => { toast.success(t.teacher.courseCreated); onCreated(); onClose(); setForm({ titleUz: "", subject: "", gradeLevel: 5, descriptionUz: "", coverEmoji: "📚" }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t.teacher.createCourse}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => setForm(f => ({ ...f, coverEmoji: e }))}
                  className={`h-9 w-9 rounded-lg text-xl transition-all ${form.coverEmoji === e ? "ring-2 ring-primary bg-primary/10" : "bg-muted hover:bg-muted/80"}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.teacher.courseName} *</Label>
            <Input value={form.titleUz} onChange={(e) => setForm(f => ({ ...f, titleUz: e.target.value }))} placeholder="Masalan: Algebra asoslari" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t.teacher.subject} *</Label>
              <Input value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Matematika" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.teacher.gradeLevel} *</Label>
              <Input type="number" min={1} max={12} value={form.gradeLevel} onChange={(e) => setForm(f => ({ ...f, gradeLevel: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t.courses.description}</Label>
            <Textarea value={form.descriptionUz} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, descriptionUz: e.target.value }))} placeholder="Kurs haqida qisqacha..." rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t.action.cancel}</Button>
            <Button onClick={() => mutate()} disabled={isPending || !form.titleUz || !form.subject}>
              {isPending ? t.action.generating : t.action.add}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddLessonModal({ courseId, open, onClose, onAdded }: { courseId: number; open: boolean; onClose: () => void; onAdded: () => void }) {
  const { t } = useT();
  const [form, setForm] = useState({ titleUz: "", contentUz: "", phetUrl: "", videoUrl: "", orderNum: 0 });
  const { mutate, isPending } = useMutation({
    mutationFn: () => createLesson(courseId, { ...form, phetUrl: form.phetUrl || undefined, videoUrl: form.videoUrl || undefined }),
    onSuccess: () => { toast.success(t.teacher.lessonAdded); onAdded(); onClose(); setForm({ titleUz: "", contentUz: "", phetUrl: "", videoUrl: "", orderNum: 0 }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t.teacher.addLesson}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>{t.teacher.lessonName} *</Label>
            <Input value={form.titleUz} onChange={(e) => setForm(f => ({ ...f, titleUz: e.target.value }))} placeholder="Masalan: Kvadrat tenglamalar" />
          </div>
          <div className="space-y-1.5">
            <Label>{t.teacher.lessonContent}</Label>
            <Textarea value={form.contentUz} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, contentUz: e.target.value }))} rows={4} placeholder="Dars mazmuní..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>PhET URL</Label>
              <Input value={form.phetUrl} onChange={(e) => setForm(f => ({ ...f, phetUrl: e.target.value }))} placeholder="https://phet.colorado.edu/..." />
            </div>
            <div className="space-y-1.5">
              <Label>Video URL</Label>
              <Input value={form.videoUrl} onChange={(e) => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>{t.action.cancel}</Button>
            <Button onClick={() => mutate()} disabled={isPending || !form.titleUz}>
              {isPending ? t.action.loading : t.action.add}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CourseCard({ course, onLessonAdded }: { course: Course; onLessonAdded: () => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [addLesson, setAddLesson] = useState(false);

  async function toggleAnalytics() {
    if (open) { setOpen(false); return; }
    if (analytics) { setOpen(true); return; }
    setLoading(true);
    try {
      const data = await getCourseAnalytics(course.id);
      setAnalytics(data);
      setOpen(true);
    } catch {
      toast.error(t.error.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl">
          {course.coverEmoji ?? course.emoji ?? "📚"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-foreground truncate">{course.titleUz ?? course.title}</p>
          <p className="text-xs text-muted-foreground">{course.subject} · {course.gradeLevel}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => setAddLesson(true)}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          {t.teacher.addLesson}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1"
          onClick={toggleAnalytics}
          disabled={loading}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          {loading ? "..." : t.teacher.analytics}
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      {open && analytics && (
        <div className="rounded-xl bg-muted p-3 text-sm space-y-1">
          <p className="font-medium">{analytics.studentCount} {t.teacher.students}</p>
          <p className="text-muted-foreground">{t.teacher.avgScore}: <span className="font-semibold text-foreground">{analytics.avgScore.toFixed(1)}</span></p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{analytics.aiInsight.slice(0, 200)}</p>
        </div>
      )}

      <AddLessonModal courseId={course.id} open={addLesson} onClose={() => setAddLesson(false)} onAdded={onLessonAdded} />
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useT();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [analyticsMap, setAnalyticsMap] = useState<Record<number, { studentCount: number; avgScore: number }>>({});

  function loadCourses() {
    setLoading(true);
    getTeacherCourses()
      .then(async (data) => {
        setCourses(data);
        const entries = await Promise.allSettled(
          data.map((c) => getCourseAnalytics(c.id).then((a) => [c.id, a] as const)),
        );
        const map: Record<number, { studentCount: number; avgScore: number }> = {};
        for (const r of entries) {
          if (r.status === "fulfilled") {
            const [id, a] = r.value;
            map[id] = { studentCount: a.studentCount, avgScore: a.avgScore };
          }
        }
        setAnalyticsMap(map);
      })
      .catch(() => toast.error(t.error.loadFailed))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCourses(); }, []);

  const totalLessons = courses.reduce((s, c) => s + (c.lessonCount ?? c.lessons?.length ?? 0), 0);
  const totalStudents = Object.values(analyticsMap).reduce((s, a) => s + a.studentCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow={t.teacher.dashboard}
          title={t.teacher.welcomeBack(user?.fullName.split(" ")[0] ?? "")}
          description={t.teacher.dashboardDesc}
        />
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2 mt-1">
          <Plus className="h-4 w-4" />
          {t.teacher.createCourse}
        </Button>
      </div>
      <CreateCourseModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadCourses} />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={t.teacher.totalCourses} value={loading ? "…" : courses.length} icon={BookOpen} accent="primary" />
        <StatCard label={t.teacher.totalLessons} value={loading ? "…" : totalLessons} icon={BarChart3} accent="secondary" />
        <StatCard label="Jami o'quvchilar" value={loading ? "…" : totalStudents} icon={Users} accent="accent" />
        <StatCard label={t.teacher.aiActive} value="Faol" icon={Sparkles} accent="primary" hint={t.teacher.aiActiveHint} />
      </div>

      {!loading && courses.length > 0 && (
        <AnalyticsSection courses={courses} analytics={analyticsMap} />
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t.teacher.noCourses}
          description={t.teacher.noCoursesDesc}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseCard key={c.id} course={c} onLessonAdded={loadCourses} />)}
        </div>
      )}
    </div>
  );
}
