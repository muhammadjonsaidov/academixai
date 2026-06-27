import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, GraduationCap, BarChart3, AlertTriangle, Plus } from "lucide-react";
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

  let riskText = analytics?.atRiskAnalysis ?? "";
  try {
    riskText = JSON.stringify(JSON.parse(riskText), null, 2);
  } catch {
    // not JSON, use as-is
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

      {riskText && (
        <div className="rounded-2xl border border-warning/40 bg-warning/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="font-display font-semibold text-sm">{t.admin.riskAnalysis}</h2>
          </div>
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-40 overflow-y-auto">{riskText}</pre>
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
