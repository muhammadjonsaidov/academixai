import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BookOpen,
  FlaskConical,
  GraduationCap,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLesson, sendChat, type Lesson } from "@/lib/api";
import { uzTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute(
  "/_app/student/courses/$courseId/lessons/$lessonId",
)({
  head: () => ({ meta: [{ title: "Dars · AcademiXAI" }] }),
  component: LessonDetailPage,
});

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

// ── PhET iframe modal ────────────────────────────────────────────────────────
function PhetModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <header className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
          <FlaskConical className="h-4 w-4 text-primary" />
          <span className="font-semibold">{title}</span>
          <Badge variant="secondary" className="text-[11px]">{t.courses.interactive}</Badge>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 hover:bg-muted transition-colors"
            aria-label={t.action.close}
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

// ── AI Chat sidebar ──────────────────────────────────────────────────────────
function AiChatSidebar({ lessonId, lessonTitle }: { lessonId: number; lessonTitle: string }) {
  const { t } = useT();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const now = uzTime(new Date());
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: text, time: now },
    ]);
    setInput("");
    setSending(true);
    try {
      const data = await sendChat(text, lessonId);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          time: uzTime(new Date()),
        },
      ]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      toast.error(t.error.aiError);
    } finally {
      setSending(false);
    }
  }

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-soft">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 shrink-0">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{t.aiTutor.title}</p>
          <p className="text-[11px] text-muted-foreground">{t.aiTutor.onlineStatus}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold">{t.aiTutor.startPrompt}</p>
            <p className="text-xs text-muted-foreground px-2">
              "{lessonTitle}" mavzusi bo'yicha har qanday savolga javob beraman
            </p>
            <div className="w-full space-y-1.5 text-left">
              {[
                "Bu mavzuni qisqacha tushuntir",
                "Misol keltir",
                "Uyga vazifa uchun maslahat ber",
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-left text-xs hover:border-primary/40 hover:bg-muted/60 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "assistant" && (
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary self-end">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-xs",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={cn("mt-1 text-[10px]", m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2 justify-start">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary self-end">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl bg-muted px-3 py-2.5 flex gap-1">
                  {[0, 200, 400].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={send} className="border-t border-border p-3 shrink-0">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t.aiTutor.placeholder}
            className="max-h-24 min-h-[2rem] flex-1 resize-none bg-transparent px-1 py-1 text-xs outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!input.trim() || sending}
            aria-label={t.action.send}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </aside>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
function LessonDetailPage() {
  const { t } = useT();
  const { courseId, lessonId } = Route.useParams();
  const navigate = useNavigate();
  const [phet, setPhet] = useState<{ url: string; title: string } | null>(null);

  const cId = Number(courseId);
  const lId = Number(lessonId);

  const { data: lesson, isLoading, error } = useQuery<Lesson>({
    queryKey: ["lesson", cId, lId],
    queryFn: () => getLesson(cId, lId),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate({ to: "/student/courses" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kurslarga qaytish
        </button>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">{t.error.generic}</p>
        </div>
      </div>
    );
  }

  const lessonTitle = (lesson as any).titleUz ?? lesson.title;
  const content = (lesson as any).contentUz ?? lesson.contentUz;

  return (
    <div className="space-y-4">
      {/* Back nav */}
      <button
        onClick={() => navigate({ to: "/student/courses" })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Kurslarga qaytish
      </button>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* Left: lesson content */}
        <div className="space-y-4">
          {/* Lesson header */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-semibold text-foreground">
                    {lessonTitle}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">{t.courses.lesson} #{(lesson.orderNum ?? lesson.orderIndex ?? 0)}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {lesson.phetUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-primary border-primary/30"
                    onClick={() => setPhet({ url: lesson.phetUrl!, title: lessonTitle })}
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    Laboratoriya
                  </Button>
                )}
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    navigate({
                      to: `/student/exams` as never,
                    })
                  }
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Imtihon
                </Button>
              </div>
            </div>
          </div>

          {/* Lesson content */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            {content ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {content}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {t.courses.noContent}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.student.askAI} →
                </p>
              </div>
            )}
          </div>

          {/* PhET lab panel (if url exists) */}
          {lesson.phetUrl && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">
                    Bu dars uchun virtual laboratoriya mavjud
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setPhet({ url: lesson.phetUrl!, title: lessonTitle })}
                >
                  Tajribani boshlash
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Chat sidebar — the WOW moment */}
        <div className="h-[calc(100vh-12rem)] min-h-[500px]">
          <AiChatSidebar lessonId={lId} lessonTitle={lessonTitle} />
        </div>
      </div>

      {phet && <PhetModal url={phet.url} title={phet.title} onClose={() => setPhet(null)} />}
    </div>
  );
}
