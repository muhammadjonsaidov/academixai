import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Wand2, Copy, Check } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Markdown } from "@/components/ui/Markdown";
import { generateLessonDraft } from "@/lib/api";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/lesson-draft")({
  head: () => ({ meta: [{ title: "Dars loyihasi · AcademiXAI" }] }),
  component: LessonDraftPage,
});

function LessonDraftPage() {
  const { t } = useT();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState(7);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => generateLessonDraft(topic, subject, gradeLevel),
    onSuccess: (data) => setDraft(data.draft ?? data as unknown as string),
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleCopy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        eyebrow={t.nav.aiAssistant}
        title={t.teacher.lessonDraft}
        description={t.teacher.lessonDraftDesc}
      />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>{t.teacher.lessonTopic} *</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.teacher.lessonTopicPlaceholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.teacher.subject} *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.teacher.subjectPlaceholder}
            />
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="w-32 space-y-1.5">
            <Label>{t.teacher.gradeLevel}</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={gradeLevel}
              onChange={(e) => setGradeLevel(Number(e.target.value))}
            />
          </div>
          <Button
            onClick={() => mutate()}
            disabled={isPending || !topic.trim() || !subject.trim()}
            className="gap-2"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {isPending ? t.action.generating : t.teacher.generateLesson}
          </Button>
        </div>
      </div>

      {draft && (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="font-semibold text-sm">{t.teacher.generatedDraft}</p>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t.action.copied : t.action.copy}
            </Button>
          </div>
          <div className="p-5">
            <Markdown>{draft}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
