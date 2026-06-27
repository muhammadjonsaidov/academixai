import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Users, BarChart3, Sparkles, ChevronDown, ChevronUp,
  Upload, FileText, Trash2, Tag, Plus, PlusCircle,
} from "lucide-react";
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
  getTeacherCourses, getCourseAnalytics, createCourse, createLesson, type Course, type Lesson,
  getTeacherDocuments, uploadTeacherDocument, deleteTeacherDocument, type TeacherDocument,
} from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/teacher/")({
  head: () => ({ meta: [{ title: "O'qituvchi paneli · AcademiXAI" }] }),
  component: TeacherDashboard,
});

interface Analytics {
  studentCount: number;
  avgScore: number;
  aiInsight: string;
}

const DOC_TAGS = [
  { value: "lesson_plan",  label: "Dars rejasi" },
  { value: "exam_prep",   label: "Imtihon tayyorgarligi" },
  { value: "homework",    label: "Uy vazifasi" },
  { value: "extra",       label: "Qo'shimcha material" },
] as const;

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

function DocumentPanel() {
  const { t } = useT();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tag, setTag] = useState<string>("lesson_plan");
  const [subject, setSubject] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["teacher-docs"],
    queryFn: getTeacherDocuments,
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteTeacherDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-docs"] }),
    onError: () => toast.error(t.error.deleteFailed),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t.error.fileTooLarge); return; }

    setUploading(true);
    try {
      await uploadTeacherDocument(file, tag, subject || undefined);
      toast.success(t.teacher.fileUploaded);
      qc.invalidateQueries({ queryKey: ["teacher-docs"] });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.error.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <header className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t.teacher.knowledgeBase}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t.teacher.knowledgeBaseDesc}
        </p>
      </header>

      <div className="p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {DOC_TAGS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <Input
            placeholder={t.teacher.subject}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-44"
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? t.action.loading : t.teacher.uploadFile}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">{t.teacher.noDocuments}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(docs as TeacherDocument[]).map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-3">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.fileName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      "bg-primary/10 text-primary",
                    )}>
                      <Tag className="inline h-2.5 w-2.5 mr-0.5" />
                      {DOC_TAGS.find((t) => t.value === doc.tag)?.label ?? doc.tag}
                    </span>
                    {doc.subject && (
                      <span className="text-[10px] text-muted-foreground">{doc.subject}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {doc.chunkCount} {t.teacher.chunks} · {uzDate(doc.createdAt)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(doc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useT();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  function loadCourses() {
    setLoading(true);
    getTeacherCourses()
      .then(setCourses)
      .catch(() => toast.error(t.error.loadFailed))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCourses(); }, []);

  const totalLessons = courses.reduce((s, c) => s + (c.lessonCount ?? c.lessons?.length ?? 0), 0);

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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t.teacher.totalCourses} value={loading ? "…" : courses.length} icon={BookOpen} accent="primary" />
        <StatCard label={t.teacher.totalLessons} value={loading ? "…" : totalLessons} icon={Users} accent="secondary" />
        <StatCard label={t.teacher.aiActive} value="Faol" icon={Sparkles} accent="accent" hint={t.teacher.aiActiveHint} />
      </div>

      <DocumentPanel />

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
