import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Users, BarChart3, Sparkles, ChevronDown, ChevronUp,
  Upload, FileText, Trash2, Tag,
} from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  getTeacherCourses, getCourseAnalytics, type Course,
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

function DocumentPanel() {
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
    onError: () => toast.error("O'chirishda xato"),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Fayl 5 MB dan katta"); return; }

    setUploading(true);
    try {
      await uploadTeacherDocument(file, tag, subject || undefined);
      toast.success(`"${file.name}" yuklandi va AI baza yangilandi`);
      qc.invalidateQueries({ queryKey: ["teacher-docs"] });
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuklashda xato");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft">
      <header className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Bilim bazasi
        </h2>
        <p className="text-xs text-muted-foreground">
          PDF yoki TXT fayl yuklang — o'quvchi AI ustozi ulardan foydalanadi
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
            placeholder="Fan (masalan: Matematika)"
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
            {uploading ? "Yuklanmoqda..." : "Fayl yuklash"}
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
            <p className="text-sm text-muted-foreground">Hali hujjat yuklanmagan</p>
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
                      {doc.chunkCount} bo'lak · {uzDate(doc.createdAt)}
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
        description="Kurslaringiz, o'quvchilar, AI tahlil va bilim bazangiz."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Jami kurslar" value={loading ? "…" : courses.length} icon={BookOpen} accent="primary" />
        <StatCard label="Jami darslar" value={loading ? "…" : totalLessons} icon={Users} accent="secondary" />
        <StatCard label="AI tahlil" value="Faol" icon={Sparkles} accent="accent" hint="Gemini AI yoqilgan" />
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
