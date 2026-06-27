import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { generateExam, gradeExam, type ExamQuestion } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/exam/$lessonId")({
  head: () => ({ meta: [{ title: "Imtihon · AcademiXAI" }] }),
  component: ExamTakingPage,
});

type Screen = "generating" | "quiz" | "result";

function ExamTakingPage() {
  const { t } = useT();
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lId = Number(lessonId);

  const [screen, setScreen] = useState<Screen>("generating");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; feedbackUz: string } | null>(null);

  // Generate questions on mount
  useEffect(() => {
    generateExam(lId, 5)
      .then((qs) => {
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(-1));
        setTimeLeft(qs.length * 60);
        setScreen("quiz");
      })
      .catch(() => {
        toast.error(t.error.aiError);
        navigate({ to: "/student/exams" });
      });
  }, [lId]);

  // Countdown
  useEffect(() => {
    if (screen !== "quiz" || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); submitExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [screen, timeLeft]);

  async function submitExam() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answerStrings = answers.map((idx, qi) =>
        idx >= 0 && questions[qi]?.options[idx]
          ? questions[qi].options[idx]
          : "Javob berilmadi"
      );
      const res = await gradeExam({
        studentId: Number(user?.id ?? 0),
        lessonId: lId,
        answers: answerStrings,
      });
      setResult(res);
      setScreen("result");
    } catch {
      toast.error(t.error.saveFailed);
      setScreen("result");
      setResult({ score: 0, feedbackUz: t.error.generic });
    } finally {
      setSubmitting(false);
    }
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const answered = answers.filter((a) => a >= 0).length;

  // ── Generating screen ──
  if (screen === "generating") {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-7 w-7 animate-pulse" />
        </div>
        <h2 className="font-display text-xl font-semibold">{t.exams.generating}</h2>
        <p className="text-sm text-muted-foreground">{t.aiTutor.subtitle}</p>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  // ── Result screen ──
  if (screen === "result" && result) {
    const passed = result.score >= 60;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          eyebrow={t.exams.result}
          title={passed ? t.exams.excellentResult : t.exams.keepGoing}
          description={t.exams.feedback}
        />

        <div className={cn(
          "rounded-2xl border p-8 text-center shadow-soft",
          passed ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
        )}>
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-card shadow">
            {passed
              ? <Trophy className="h-10 w-10 text-success" />
              : <AlertCircle className="h-10 w-10 text-warning" />}
          </div>
          <p className="font-display text-5xl font-bold text-foreground">{result.score}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {answered}/{questions.length} {t.exams.questions}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            {t.exams.feedback}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.feedbackUz}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate({ to: "/student/exams" })}>
            <ArrowLeft className="h-4 w-4" />
            {t.exams.goCourses}
          </Button>
          <Button className="flex-1" onClick={() => navigate({ to: "/student/ai-tutor" })}>
            <Sparkles className="h-4 w-4" />
            {t.student.askAI}
          </Button>
        </div>
      </div>
    );
  }

  // ── Quiz screen ──
  const q = questions[current];
  if (!q) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-3 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GraduationCap className="h-4 w-4 text-primary" />
          {t.exams.question} {current + 1}/{questions.length}
        </div>
        <div className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
          timeLeft < 60 ? "bg-destructive/15 text-destructive" : "bg-muted text-foreground"
        )}>
          <Clock className="h-3.5 w-3.5" />
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
        <div className="text-xs text-muted-foreground">
          {answered} {t.exams.result}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <p className="font-display text-lg font-semibold leading-relaxed text-foreground">
          {q.question}
        </p>

        <ul className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => (
            <li key={i}>
              <button
                onClick={() => {
                  const next = [...answers];
                  next[current] = i;
                  setAnswers(next);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  answers[current] === i
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:border-primary/40 hover:bg-muted/60"
                )}
              >
                <span className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold",
                  answers[current] === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex-1"
        >
          ← {t.action.prev}
        </Button>

        {current < questions.length - 1 ? (
          <Button
            onClick={() => setCurrent((c) => c + 1)}
            className="flex-1"
            disabled={answers[current] < 0}
          >
            {t.action.next} →
          </Button>
        ) : (
          <Button
            onClick={submitExam}
            disabled={submitting}
            className="flex-1 bg-success hover:bg-success/90"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t.action.submit}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "h-7 w-7 rounded-full text-xs font-semibold transition-all",
              i === current
                ? "bg-primary text-primary-foreground"
                : answers[i] >= 0
                ? "bg-success/20 text-success"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
