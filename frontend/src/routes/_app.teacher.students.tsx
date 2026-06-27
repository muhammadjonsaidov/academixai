import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { StatCard } from "@/components/shell/StatCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useState } from "react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/students")({
  head: () => ({ meta: [{ title: "O'quvchilar · AcademiXAI" }] }),
  component: StudentsPage,
});

interface TeacherStudent {
  id: number;
  fullName: string;
  email: string;
  avgScore: number;
  courseCount: number;
}

function ScoreBadge({ score }: { score: number }) {
  const variant =
    score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive";
  return <Badge variant={variant}>{score.toFixed(1)}</Badge>;
}

function StudentsPage() {
  const [search, setSearch] = useState("");
  const { t } = useT();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["teacher-students"],
    queryFn: () =>
      api.get<TeacherStudent[]>("/api/teacher/students"),
  });

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  const avgScore =
    students.length > 0
      ? students.reduce((sum, s) => sum + s.avgScore, 0) / students.length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.students}
        title={t.teacher.studentList}
        description={t.teacher.dashboardDesc}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.admin.totalStudents}
          value={isLoading ? "…" : students.length}
          icon={Users}
          accent="primary"
        />
        <StatCard
          label={t.teacher.avgScore}
          value={isLoading ? "…" : avgScore.toFixed(1)}
          icon={TrendingUp}
          accent="secondary"
        />
        <StatCard
          label={t.nav.courses}
          value={isLoading ? "…" : students.reduce((s, st) => s + (st.courseCount ?? 0), 0)}
          icon={Users}
          accent="accent"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-4 flex items-center gap-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder={t.action.search + "..."}

            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm"
          />
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Users}
              title={search ? t.admin.noStudents : t.teacher.studentList}
              description={search ? t.action.search : t.teacher.noCourses}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground">
                    {t.profile.fullName}
                  </th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">
                    {t.profile.email}
                  </th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-center">
                    {t.nav.courses}
                  </th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-center">
                    {t.teacher.avgScore}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {student.email}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant="outline">{student.courseCount} ta</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <ScoreBadge score={student.avgScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
