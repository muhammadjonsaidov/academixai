import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, GraduationCap, BarChart3, AlertTriangle, Plus } from "lucide-react";

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
        placeholder="Ism Familiya"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9 text-sm"
        required
      />
      <Input
        placeholder="email@maktab.uz"
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
  if (loading) return <div className="text-sm text-muted-foreground py-4 text-center">Yuklanmoqda…</div>;
  if (!users.length) return <div className="text-sm text-muted-foreground py-4 text-center">Hali qo'shilmagan</div>;
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
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    getAdminAnalytics()
      .then(setAnalytics)
      .catch(() => toast.error("Analitika yuklanmadi"))
      .finally(() => setLoadingAnalytics(false));

    getAdminTeachers()
      .then(setTeachers)
      .catch(() => toast.error("O'qituvchilar yuklanmadi"))
      .finally(() => setLoadingTeachers(false));

    getAdminStudents()
      .then(setStudents)
      .catch(() => toast.error("O'quvchilar yuklanmadi"))
      .finally(() => setLoadingStudents(false));
  }, []);

  async function handleAddTeacher(fullName: string, email: string) {
    try {
      const u = await addTeacher(fullName, email);
      setTeachers((t) => [...t, u]);
      toast.success(`O'qituvchi qo'shildi: ${fullName}`);
    } catch {
      toast.error("Qo'shib bo'lmadi");
    }
  }

  async function handleAddStudent(fullName: string, email: string) {
    try {
      const u = await addStudent(fullName, email);
      setStudents((s) => [...s, u]);
      toast.success(`O'quvchi qo'shildi: ${fullName}`);
    } catch {
      toast.error("Qo'shib bo'lmadi");
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
        eyebrow="Maktab admini"
        title="Maktab boshqaruv markazi"
        description="O'qituvchilar, o'quvchilar va AI analitika natijalari."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="O'qituvchilar" value={loadingAnalytics ? "…" : (analytics?.teacherCount ?? 0)} icon={GraduationCap} accent="primary" />
        <StatCard label="O'quvchilar" value={loadingAnalytics ? "…" : (analytics?.studentCount ?? 0)} icon={Users} accent="secondary" />
        <StatCard label="O'rtacha ball" value={loadingAnalytics ? "…" : `${analytics?.avgScore?.toFixed(1) ?? 0}%`} icon={BarChart3} accent="accent" />
        <StatCard label="Jami davomatsizlik" value={loadingAnalytics ? "…" : (analytics?.totalAbsences ?? 0)} icon={AlertTriangle} accent="default" />
      </div>

      {riskText && (
        <div className="rounded-2xl border border-warning/40 bg-warning/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="font-display font-semibold text-sm">AI Xavf tahlili</h2>
          </div>
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-40 overflow-y-auto">{riskText}</pre>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display font-semibold mb-3">O'qituvchilar ({teachers.length})</h2>
          <UserList users={teachers} loading={loadingTeachers} />
          <AddForm label="Qo'shish" onAdd={handleAddTeacher} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display font-semibold mb-3">O'quvchilar ({students.length})</h2>
          <UserList users={students} loading={loadingStudents} />
          <AddForm label="Qo'shish" onAdd={handleAddStudent} />
        </div>
      </div>
    </div>
  );
}
