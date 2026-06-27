import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/ui/Markdown";
import { askAboutChild } from "@/lib/api";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/parent/ai-suggestions")({
  head: () => ({ meta: [{ title: "AI maslahat · AcademiXAI" }] }),
  component: AiSuggestionsPage,
});

function AiSuggestionsPage() {
  const { t } = useT();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<{ answer: string; childName: string } | null>(null);

  const { mutate: ask, isPending } = useMutation({
    mutationFn: () => askAboutChild(question.trim()),
    onSuccess: (res) => {
      setResult(res);
      setQuestion("");
    },
    onError: () => toast.error(t.error.aiError),
  });

  const handleAsk = () => {
    if (!question.trim() || isPending) return;
    ask();
  };

  const quickQuestions = [
    "Matematikada qanday?",
    "O'qishda qiyinchilik bormi?",
    "Kelgusi oyda nima qilish kerak?",
    "Farzandim kayfiyati qanday?",
    "Qaysi fanlar bo'yicha yordam kerak?",
    "Bu hafta qanday natijalar ko'rsatdi?",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.aiSuggestions}
        title={t.parent.askAI}
        description={t.parent.askAIDesc}
      />

      {/* Question input */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t.parent.askAI}</h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder={t.parent.askPlaceholder}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            className="flex-1"
          />
          <Button onClick={handleAsk} disabled={isPending || !question.trim()} className="shrink-0">
            {isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                {t.action.asking}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t.parent.askAI}
              </>
            )}
          </Button>
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Answer */}
      {result && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-primary text-sm">{t.parent.aiAnswer}</p>
              {result.childName && (
                <p className="text-xs text-muted-foreground">{result.childName}</p>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-background/60 border border-primary/10 p-4">
            <Markdown className="text-foreground">{result.answer}</Markdown>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResult(null)}
            className="text-xs text-muted-foreground"
          >
            {t.parent.askAI}
          </Button>
        </section>
      )}
    </div>
  );
}
