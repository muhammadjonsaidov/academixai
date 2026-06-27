import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GraduationCap, Sparkles, User } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/Markdown";
import { getChildInfo, generateChildReport } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/parent/ai-report")({
  head: () => ({ meta: [{ title: "AI hisobot · AcademiXAI" }] }),
  component: AiReportPage,
});

function AiReportPage() {
  const { t } = useT();
  const [report, setReport] = useState<{ narrative: string; avgScore: number } | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["child-info"],
    queryFn: getChildInfo,
  });

  const child = data?.children?.[0];

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => generateChildReport(child?.id ?? 0),
    onSuccess: (res) => {
      setReport(res);
      setGeneratedAt(new Date().toISOString());
      toast.success(t.parent.aiReport);
    },
    onError: () => toast.error(t.error.aiError),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data?.hasChildren || !child) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={t.nav.aiReport} title={t.parent.aiReport} description="" />
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card text-center">
          <User className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">{t.parent.noChild}</p>
        </div>
      </div>
    );
  }

  const initials = child.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.aiReport}
        title={t.parent.aiReport}
        description={t.parent.description}
      />

      {/* Child summary */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 font-display text-lg font-semibold text-primary">
          {initials}
        </div>
        <div className="flex-1">
          <p className="font-semibold">{child.fullName}</p>
          <p className="text-sm text-muted-foreground">{child.email}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            child.avgScore >= 80
              ? "bg-success/15 text-success"
              : child.avgScore >= 60
              ? "bg-warning/15 text-warning"
              : child.avgScore > 0
              ? "bg-destructive/15 text-destructive"
              : "bg-muted text-muted-foreground",
          )}
        >
          {child.avgScore > 0 ? `${t.parent.avgScore}: ${child.avgScore}%` : t.parent.noExams}
        </span>
      </div>

      {/* Generate button */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">{t.parent.generateReport}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t.parent.askAIDesc}</p>
          </div>
        </div>
        <Button onClick={() => generate()} disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              {t.parent.generatingReport}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t.parent.generateReport}
            </>
          )}
        </Button>
      </div>

      {/* Report result */}
      {report && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-primary">{t.parent.aiReport}</p>
              {generatedAt && (
                <p className="text-xs text-muted-foreground">{uzDate(generatedAt)}</p>
              )}
            </div>
            {report.avgScore > 0 && (
              <span
                className={cn(
                  "ml-auto rounded-full px-3 py-1 text-xs font-semibold",
                  report.avgScore >= 80
                    ? "bg-success/15 text-success"
                    : report.avgScore >= 60
                    ? "bg-warning/15 text-warning"
                    : "bg-destructive/15 text-destructive",
                )}
              >
                {report.avgScore}%
              </span>
            )}
          </div>
          <div className="rounded-xl bg-background/60 border border-primary/10 p-4">
            <Markdown className="text-foreground">{report.narrative}</Markdown>
          </div>
        </section>
      )}

      {/* Latest narrative from data */}
      {!report && child.latestNarrative && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-display text-base font-semibold mb-3">{t.parent.aiReport}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{child.latestNarrative}</p>
        </section>
      )}
    </div>
  );
}
