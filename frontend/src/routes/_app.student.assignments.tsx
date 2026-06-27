import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/assignments")({
  head: () => ({ meta: [{ title: "Topshiriqlar · AcademiXAI" }] }),
  component: AssignmentsPage,
});

interface Assignment {
  id: number; title: string; subject: string; deadline: string;
  status: "pending" | "submitted" | "overdue"; description: string;
}

const ASSIGNMENTS: Assignment[] = [
  { id: 1, title: "Kvadrat tenglamalar bo'yicha masalalar", subject: "Matematika", deadline: "2026-07-05", status: "pending", description: "Darslikdagi 3.1-3.5-masalalarni yeching. Barcha yechim qadamlarini ko'rsating." },
  { id: 2, title: "Kimyoviy reaksiyalar balansi", subject: "Kimyo", deadline: "2026-07-03", status: "pending", description: "10 ta kimyoviy reaksiyaning tenglamasini muvozanatlang." },
  { id: 3, title: "Ingliz tili esse", subject: "Ingliz tili", deadline: "2026-07-01", status: "submitted", description: "My future profession mavzusida 200-250 so'zli esse." },
  { id: 4, title: "Fizika: Nyuton qonunlari", subject: "Fizika", deadline: "2026-06-25", status: "overdue", description: "Nyutonning 3 qonunini misollar bilan izohlang." },
  { id: 5, title: "O'zbekiston tarixi taqdimot", subject: "Tarix", deadline: "2026-07-08", status: "pending", description: "Mustaqillik yillari haqida 10 slaydli taqdimot tayyorlang." },
  { id: 6, title: "Biologiya laboratoriya hisoboti", subject: "Biologiya", deadline: "2026-06-28", status: "submitted", description: "O'simlik hujayrasini mikroskopda kuzatish bo'yicha hisobot." },
];

const STATUS_MAP = {
  pending: { label: "Bajarilmagan", icon: Clock, cls: "text-amber-600 bg-amber-50" },
  submitted: { label: "Topshirilgan", icon: CheckCircle2, cls: "text-green-600 bg-green-50" },
  overdue: { label: "Muddati o'tgan", icon: AlertCircle, cls: "text-red-600 bg-red-50" },
};

function AssignmentsPage() {
  const { t } = useT();
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "overdue">("all");

  const filtered = filter === "all" ? ASSIGNMENTS : ASSIGNMENTS.filter(a => a.status === filter);
  const counts = {
    pending: ASSIGNMENTS.filter(a => a.status === "pending").length,
    submitted: ASSIGNMENTS.filter(a => a.status === "submitted").length,
    overdue: ASSIGNMENTS.filter(a => a.status === "overdue").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.assignments.title} description={t.assignments.description} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft text-center">
          <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Bajarilmagan</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft text-center">
          <p className="text-2xl font-bold text-green-600">{counts.submitted}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Topshirilgan</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft text-center">
          <p className="text-2xl font-bold text-red-600">{counts.overdue}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Muddati o'tgan</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "submitted", "overdue"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1 rounded-full text-sm border transition-colors",
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary")}>
            {f === "all" ? "Barchasi" : STATUS_MAP[f].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(a => {
          const st = STATUS_MAP[a.status];
          const Icon = st.icon;
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{a.title}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full flex items-center gap-1", st.cls)}>
                      <Icon className="h-3 w-3" /> {st.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.subject} · Muddat: {a.deadline}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                </div>
              </div>
              {a.status === "pending" && (
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link to="/student/ai-tutor">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI yordam
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
