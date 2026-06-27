import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Users, GraduationCap, BarChart3, AlertTriangle, Plus, ShieldAlert, HeartPulse, ArrowRight } from "lucide-react";
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

  let overallHealth: number | null = null;
  let riskCount = 0;
  if (analytics?.atRiskAnalysis) {
    try {
      const cleaned = analytics.atRiskAnalysis.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      riskCount = (parsed.atRiskStudents ?? []).length;
      overallHealth = parsed.overallHealthPercent ?? null;
    } catch { /* raw text — ignore */ }
  }

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

      {analytics?.atRiskAnalysis && (
        <Link to="/admin/reports">
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 px-5 py-4 flex items-center gap-4 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 grid place-items-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">AI Xavf Tahlili</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5">
                {riskCount > 0 ? `${riskCount} ta xavf ostidagi o'quvchi aniqlandi` : "Tahlil tayyor — ko'rish uchun bosing"}
              </p>
            </div>
            {overallHealth !== null && (
              <div className="text-right mr-2">
                <p className={cn("text-2xl font-bold", overallHealth >= 80 ? "text-green-600" : overallHealth >= 60 ? "text-amber-600" : "text-red-600")}>
                  {overallHealth}%
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <HeartPulse className="h-3 w-3" /> Salomatlik
                </p>
              </div>
            )}
            <ArrowRight className="h-4 w-4 text-amber-500 shrink-0" />
          </div>
        </Link>
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
