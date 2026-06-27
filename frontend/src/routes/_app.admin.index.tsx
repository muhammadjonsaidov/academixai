import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, GraduationCap, BarChart3, AlertTriangle, Plus, ChevronDown, ChevronUp, ShieldAlert, HeartPulse, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/shell/PageHeader";
import { StatCard } from "@/components/shell/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAdminAnalytics,
  getAdminStudents,
  getAdminTeachers,
  addTeacher,
  addStudent,
  type AdminUser,
} from "@/lib/api";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Maktab admini · AcademiXAI" }] }),
  component: AdminDashboard,
});

interface Analytics {
  teacherCount: number;
  studentCount: number;
  avgScore: number;
  totalAbsences: number;
  atRiskAnalysis: string;
}

function AddForm({
  label,
  onAdd,
}: {
  label: string;
  onAdd: (name: string, email: string) => Promise<void>;
}) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      await onAdd(name.trim(), email.trim());
      setName("");
      setEmail("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2 mt-3">
      <Input
        placeholder={t.auth.fullName}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9 text-sm"
        required
      />
      <Input
        placeholder={t.admin.email}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-9 text-sm"
        required
      />
      <Button type="submit" size="sm" disabled={loading} className="shrink-0">
        <Plus className="h-4 w-4" />
        {label}
      </Button>
    </form>
  );
}

function UserList({ users, loading }: { users: AdminUser[]; loading: boolean }) {
  const { t } = useT();
  if (loading) return <div className="text-sm text-muted-foreground py-4 text-center">{t.action.loading}</div>;
  if (!users.length) return <div className="text-sm text-muted-foreground py-4 text-center">{t.admin.noStudents}</div>;
  return (
    <ul className="divide-y divide-border max-h-64 overflow-y-auto">
      {users.map((u) => (
        <li key={u.id} className="px-1 py-2.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{u.fullName}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AdminDashboard() {
  const { t } = useT();
  const qc = useQueryClient();

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: getAdminAnalytics,
    staleTime: 60_000,
  });
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ["admin-teachers"],
    queryFn: getAdminTeachers,
  });
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["admin-students"],
    queryFn: getAdminStudents,
  });

  async function handleAddTeacher(fullName: string, email: string) {
    try {
      await addTeacher(fullName, email);
      qc.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast.success(`${t.admin.addTeacher}: ${fullName}`);
    } catch {
      toast.error(t.error.saveFailed);
    }
  }

  async function handleAddStudent(fullName: string, email: string) {
    try {
      await addStudent(fullName, email);
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      toast.success(`${t.admin.addStudent}: ${fullName}`);
    } catch {
      toast.error(t.error.saveFailed);
    }
  }

  let riskStudents: { name: string; reason?: string; recommendation?: string }[] = [];
  let overallHealth: number | null = null;
  let riskRaw = "";
  if (analytics?.atRiskAnalysis) {
    try {
      // Strip markdown code fences if AI wrapped JSON in ```
      const cleaned = analytics.atRiskAnalysis.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      riskStudents = parsed.atRiskStudents ?? [];
      overallHealth = parsed.overallHealthPercent ?? null;
    } catch {
      riskRaw = analytics.atRiskAnalysis;
    }
  }
  const [riskExpanded, setRiskExpanded] = useState(false);
  const PREVIEW = 4;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.admin.title}
        title={t.admin.description}
        description={t.admin.aiInsight}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.admin.totalTeachers} value={loadingAnalytics ? "…" : (analytics?.teacherCount ?? 0)} icon={GraduationCap} accent="primary" />
        <StatCard label={t.admin.totalStudents} value={loadingAnalytics ? "…" : (analytics?.studentCount ?? 0)} icon={Users} accent="secondary" />
        <StatCard label={t.admin.avgScore} value={loadingAnalytics ? "…" : `${analytics?.avgScore?.toFixed(1) ?? 0}%`} icon={BarChart3} accent="accent" />
        <StatCard label={t.admin.totalAbsences} value={loadingAnalytics ? "…" : (analytics?.totalAbsences ?? 0)} icon={AlertTriangle} accent="default" />
      </div>

      {(riskStudents.length > 0 || riskRaw) && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-200 dark:border-amber-800/40">
            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 grid place-items-center shrink-0">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">{t.admin.riskAnalysis}</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70">AI tahlili — xavf ostidagi o'quvchilar</p>
            </div>
            {overallHealth !== null && (
              <div className="text-right">
                <p className={cn("text-xl font-bold", overallHealth >= 80 ? "text-green-600" : overallHealth >= 60 ? "text-amber-600" : "text-red-600")}>
                  {overallHealth}%
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <HeartPulse className="h-3 w-3" /> Umumiy salomatlik
                </p>
              </div>
            )}
          </div>

          {riskStudents.length > 0 ? (
            <>
              <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
                {(riskExpanded ? riskStudents : riskStudents.slice(0, PREVIEW)).map((s, i) => (
                  <div key={i} className="px-5 py-3 flex gap-3 items-start">
                    <div className={cn("h-7 w-7 rounded-full grid place-items-center shrink-0 text-xs font-bold mt-0.5",
                      i === 0 ? "bg-red-100 text-red-700" :
                      i < 3 ? "bg-orange-100 text-orange-700" :
                      "bg-amber-100 text-amber-700")}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">{s.name}</p>
                      {s.reason && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 flex gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                          {s.reason}
                        </p>
                      )}
                      {s.recommendation && (
                        <p className="text-xs text-muted-foreground mt-1 flex gap-1">
                          <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-blue-500" />
                          {s.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {riskStudents.length > PREVIEW && (
                <button
                  onClick={() => setRiskExpanded(v => !v)}
                  className="w-full py-2.5 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-1 border-t border-amber-200 dark:border-amber-800/40"
                >
                  {riskExpanded
                    ? <><ChevronUp className="h-3.5 w-3.5" /> Kamroq ko'rsatish</>
                    : <><ChevronDown className="h-3.5 w-3.5" /> Yana {riskStudents.length - PREVIEW} ta ko'rsatish</>}
                </button>
              )}
            </>
          ) : (
            <div className="px-5 py-4">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{riskRaw}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display font-semibold mb-3">{t.admin.teacherList} ({teachers.length})</h2>
          <UserList users={teachers} loading={loadingTeachers} />
          <AddForm label={t.action.add} onAdd={handleAddTeacher} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display font-semibold mb-3">{t.admin.studentList} ({students.length})</h2>
          <UserList users={students} loading={loadingStudents} />
          <AddForm label={t.action.add} onAdd={handleAddStudent} />
        </div>
      </div>
    </div>
  );
}
