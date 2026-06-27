import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  BookOpen, GraduationCap, MessageCircle, Send, Sparkles, Trophy, User, TrendingUp, TrendingDown,
} from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChildInfo, askAboutChild, generateChildReport } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/parent/")({
  head: () => ({ meta: [{ title: "Ota-ona paneli · AcademiXAI" }] }),
  component: ParentDashboard,
});

function SentimentBadge({ score, t }: { score: number; t: ReturnType<typeof useT>["t"] }) {
  if (score > 0.3) return <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">{t.parent.sentiment.positive}</span>;
  if (score < -0.2) return <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">{t.parent.sentiment.negative}</span>;
  return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{t.parent.sentiment.neutral}</span>;
}

function ParentDashboard() {
  const { t } = useT();
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["child-info"],
    queryFn: getChildInfo,
  });

  const { mutate: ask, isPending: asking } = useMutation({
    mutationFn: () => askAboutChild(question),
    onSuccess: (res) => {
      setAiAnswer(res.answer);
      setQuestion("");
    },
    onError: () => toast.error(t.error.aiError),
  });

  const { mutate: genReport, isPending: generatingReport } = useMutation({
    mutationFn: () => generateChildReport(child?.id ?? 0),
    onSuccess: (res) => {
      toast.success(t.parent.aiReport);
      setAiAnswer(res.narrative);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data?.hasChildren || data.children.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={t.parent.title} title={t.parent.description} description="" />
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-center">
          <User className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">{t.parent.noChild}</p>
          <p className="text-sm text-muted-foreground max-w-xs">{t.parent.noChildDesc}</p>
        </div>
      </div>
    );
  }

  const children = data.children;
  const child = children[selectedChildIdx] ?? children[0];
  const initials = child.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const avgSentiment = child.sentimentTrend.length > 0
    ? child.sentimentTrend.slice(0, 10).reduce((a, b) => a + b.score, 0) / Math.min(10, child.sentimentTrend.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.parent.title}
        title={t.parent.description}
        description={t.parent.sentimentDesc}
      />

      {/* Child selector if multiple */}
      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelectedChildIdx(i)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                i === selectedChildIdx ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
              )}
            >
              {c.fullName.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Child card */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 font-display text-xl font-semibold text-primary">
          {initials}
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">{child.fullName}</h2>
          <p className="text-sm text-muted-foreground">{child.email}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SentimentBadge score={avgSentiment} t={t} />
          <span className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            child.avgScore >= 80 ? "bg-success/15 text-success" :
            child.avgScore >= 60 ? "bg-warning/15 text-warning" :
            child.avgScore > 0 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground",
          )}>
            {child.avgScore > 0 ? `O'rtacha: ${child.avgScore}%` : "Imtihon yo'q"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t.parent.enrolledCourses} value={child.enrolledCourses.length} icon={BookOpen} accent="primary" />
        <StatCard label={t.parent.avgScore} value={child.avgScore > 0 ? `${child.avgScore}%` : "—"} icon={Trophy} accent="secondary" hint={t.parent.allExams} />
        <StatCard label={t.parent.aiChats} value={child.chatCount} icon={MessageCircle} accent="accent" hint={t.parent.aiChats} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent exams */}
        <section className="rounded-2xl border border-border bg-card shadow-soft">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">{t.parent.recentExams}</h2>
          </header>
          {child.recentExams.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">{t.parent.noExams}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {child.recentExams.map((r) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
                    r.score >= 80 ? "bg-success/15 text-success" :
                    r.score >= 60 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive",
                  )}>
                    {r.score}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.lessonTitle ?? "Imtihon"}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.courseName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.takenAt ? uzDate(r.takenAt) : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Sentiment trend */}
        <section className="rounded-2xl border border-border bg-card shadow-soft">
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">{t.parent.sentimentAnalysis}</h2>
            <p className="text-xs text-muted-foreground">{t.parent.sentimentDesc}</p>
          </header>
          {child.sentimentTrend.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">{t.parent.noSentiment}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-56 overflow-y-auto">
              {child.sentimentTrend.slice(0, 8).map((s, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-2.5">
                  {s.score > 0.2
                    ? <TrendingUp className="h-4 w-4 text-success shrink-0" />
                    : s.score < -0.1
                    ? <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
                    : <div className="h-4 w-4 shrink-0" />}
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                    s.label === "curious" || s.label === "confident" ? "bg-success/10 text-success" :
                    s.label === "frustrated" || s.label === "anxious" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground",
                  )}>{s.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{uzDate(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Enrolled courses */}
      {child.enrolledCourses.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold mb-4">{t.parent.enrolledCourses}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {child.enrolledCourses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                <span className="text-2xl">{c.emoji ?? "📚"}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{c.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.subject}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI narrative */}
      {child.latestNarrative && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{t.parent.aiReport}</p>
              <p className="mt-1 text-sm text-muted-foreground">{child.latestNarrative}</p>
            </div>
          </div>
        </section>
      )}

      {/* Parent AI chat */}
      <section className="rounded-2xl border border-border bg-card shadow-soft">
        <header className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t.parent.askAI}
          </h2>
          <p className="text-xs text-muted-foreground">{t.parent.askAIDesc}</p>
        </header>
        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder={t.parent.askPlaceholder}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !asking && question.trim() && ask()}
              className="flex-1"
            />
            <Button onClick={() => ask()} disabled={asking || !question.trim()} className="shrink-0">
              {asking ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {asking ? t.action.asking : t.parent.askAI}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              "Farzandim matematikada qanday?",
              "Bu hafta qanday imtihon topshirdi?",
              "Kayfiyati qanday?",
              "Nima qiynalmoqda?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground hover:border-primary/40 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {aiAnswer && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm text-foreground">
              <p className="font-semibold text-primary text-xs mb-1 uppercase tracking-wide">{t.parent.aiAnswer}</p>
              {aiAnswer}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => genReport()}
            disabled={generatingReport}
            className="w-full"
          >
            {generatingReport ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            ) : (
              <GraduationCap className="h-4 w-4" />
            )}
            {generatingReport ? t.parent.generatingReport : t.parent.generateReport}
          </Button>
        </div>
      </section>
    </div>
  );
}
