import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarX2, TrendingUp, Users, BookOpen, CheckCircle2, XCircle,
  AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { getAdminAttendanceStats } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin/attendance")({
  head: () => ({ meta: [{ title: "Qoldirilgan darslar · AcademiXAI" }] }),
  component: AttendancePage,
});

function StatBlock({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft flex items-start gap-4">
      <div className={cn("h-10 w-10 rounded-xl grid place-items-center shrink-0", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold font-display">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = "bg-red-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-6 text-right">{value}</span>
    </div>
  );
}

function AttendancePage() {
  const [showAll, setShowAll] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-attendance-stats"],
    queryFn: getAdminAttendanceStats,
  });

  const maxMissed = stats?.topAbsentStudents[0]?.missed ?? 1;
  const maxCourseMissed = stats?.topAbsentCourses[0]?.missed ?? 1;
  const recentShown = showAll ? stats?.recentMissed : stats?.recentMissed?.slice(0, 15);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Admin" title="Qoldirilgan darslar" description="O'quvchilar dars qoldirish statistikasi" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Qoldirilgan darslar"
        description="O'quvchilarning darsga qatnashish statistikasi va tahlili"
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          label="Jami darslar"
          value={(stats?.total ?? 0).toLocaleString()}
          sub="Barcha yozuvlar"
          icon={BookOpen}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
        />
        <StatBlock
          label="Kelgan"
          value={(stats?.present ?? 0).toLocaleString()}
          sub={`${stats?.attendanceRate ?? 0}% qatnashuv`}
          icon={CheckCircle2}
          color="bg-green-100 text-green-600 dark:bg-green-900/30"
        />
        <StatBlock
          label="Qoldirilgan darslar"
          value={(stats?.missed ?? 0).toLocaleString()}
          sub="Kelmagan hollar"
          icon={CalendarX2}
          color="bg-red-100 text-red-600 dark:bg-red-900/30"
        />
        <StatBlock
          label="Qatnashuv darajasi"
          value={`${stats?.attendanceRate ?? 0}%`}
          sub={stats && stats.attendanceRate >= 90 ? "Yaxshi" : stats && stats.attendanceRate >= 75 ? "O'rtacha" : "Past"}
          icon={TrendingUp}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/30"
        />
      </div>

      {/* Attendance rate bar */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Umumiy qatnashuv darajasi
        </p>
        <div className="relative h-6 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all flex items-center justify-end pr-3"
            style={{ width: `${stats?.attendanceRate ?? 0}%` }}
          >
            <span className="text-xs font-bold text-white">{stats?.attendanceRate ?? 0}%</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span className="text-red-500">Xavfli: 70%</span>
          <span className="text-amber-500">O'rtacha: 80%</span>
          <span className="text-green-500">Yaxshi: 90%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top absent students */}
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="font-semibold text-sm">Ko'p dars qoldirgan o'quvchilar</h2>
            <span className="ml-auto text-xs text-muted-foreground">Top 15</span>
          </div>
          <div className="p-4 space-y-3">
            {stats?.topAbsentStudents.map((s, i) => (
              <div key={s.studentId} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold w-5 shrink-0",
                    i === 0 ? "text-red-600" : i === 1 ? "text-orange-500" : i === 2 ? "text-amber-500" : "text-muted-foreground")}>
                    #{i + 1}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">{s.name}</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                    s.missed >= 70 ? "bg-red-100 text-red-700" :
                    s.missed >= 40 ? "bg-orange-100 text-orange-700" :
                    "bg-amber-100 text-amber-700")}>
                    {s.missed} dars
                  </span>
                </div>
                <ProgressBar
                  value={s.missed}
                  max={maxMissed}
                  color={s.missed >= 70 ? "bg-red-500" : s.missed >= 40 ? "bg-orange-400" : "bg-amber-400"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Top absent courses */}
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <BookOpen className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-sm">Ko'p qoldirilgan fanlar</h2>
            <span className="ml-auto text-xs text-muted-foreground">Top 10</span>
          </div>
          <div className="p-4 space-y-3">
            {stats?.topAbsentCourses.map((c, i) => (
              <div key={c.courseId} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                  <span className="text-sm font-medium flex-1 truncate">{c.course}</span>
                  <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                    {c.missed} marta
                  </span>
                </div>
                <ProgressBar value={c.missed} max={maxCourseMissed} color="bg-orange-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent missed — detailed log */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <XCircle className="h-4 w-4 text-red-500" />
          <h2 className="font-semibold text-sm">So'nggi qoldirilgan darslar</h2>
          <span className="ml-auto text-xs text-muted-foreground">{stats?.recentMissed.length ?? 0} ta yozuv</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">O'quvchi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sana</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentShown?.map(r => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-red-100 grid place-items-center shrink-0">
                        <span className="text-xs font-bold text-red-700">
                          {r.studentName?.charAt(0) ?? "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.studentName}</p>
                        <p className="text-xs text-muted-foreground">{r.studentEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{r.courseName || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {new Date(r.date).toLocaleDateString("uz-Latn-UZ", { day: "numeric", month: "long", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-full px-2.5 py-1 font-medium">
                      <XCircle className="h-3 w-3" /> Kelmagan
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(stats?.recentMissed.length ?? 0) > 15 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="w-full py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-1 border-t border-border"
          >
            {showAll ? <><ChevronUp className="h-3.5 w-3.5" /> Kamroq ko'rsatish</> : <><ChevronDown className="h-3.5 w-3.5" /> Barchasini ko'rsatish ({stats?.recentMissed.length})</>}
          </button>
        )}
      </div>
    </div>
  );
}
