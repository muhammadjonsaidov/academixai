import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { api, getTeacherCourses } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/attendance")({
  head: () => ({ meta: [{ title: "Davomat · AcademiXAI" }] }),
  component: AttendancePage,
});

interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  date: string;
  present: boolean;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function AttendancePage() {
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const { t } = useT();

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: getTeacherCourses,
  });

  // When courses load, pick first course automatically
  if (courses.length > 0 && !courseId) {
    setCourseId(courses[0].id);
  }

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["teacher-attendance", courseId, date],
    queryFn: () =>
      api.get<AttendanceRecord[]>(
        `/api/teacher/courses/${courseId}/attendance?date=${date}`,
      ),
    enabled: !!courseId && !!date,
  });

  const { mutate: markAttendance } = useMutation({
    mutationFn: ({
      studentId,
      present,
    }: {
      studentId: number;
      present: boolean;
    }) =>
      api.post(
        `/api/teacher/courses/${courseId}/attendance?studentId=${studentId}&date=${date}&present=${present}`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-attendance", courseId, date] });
    },
    onError: () => toast.error(t.error.saveFailed),
  });

  const presentCount = attendance.filter((a) => a.present).length;
  const absentCount = attendance.length - presentCount;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.nav.attendance}
        title={t.teacher.attendanceTitle}
        description="Kurs va sanani tanlang, o'quvchilar davomatini belgilang."
      />

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Kurs
            </label>
            {coursesLoading ? (
              <div className="h-10 rounded-lg bg-muted animate-pulse" />
            ) : (
              <select
                value={courseId ?? ""}
                onChange={(e) => setCourseId(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sana
            </label>
            <input
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      {!attendanceLoading && attendance.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">Jami o'quvchilar</p>
            <p className="mt-1 text-3xl font-bold">{attendance.length}</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 p-5">
            <p className="text-sm text-green-700 dark:text-green-400">Kelgan</p>
            <p className="mt-1 text-3xl font-bold text-green-700 dark:text-green-400">
              {presentCount}
            </p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-5">
            <p className="text-sm text-red-700 dark:text-red-400">Kelmagan</p>
            <p className="mt-1 text-3xl font-bold text-red-700 dark:text-red-400">
              {absentCount}
            </p>
          </div>
        </div>
      )}

      {/* Attendance table */}
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-primary" />
            {date} — davomat ro'yxati
          </h2>
        </div>

        {!courseId ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarCheck}
              title="Kurs tanlanmagan"
              description="Yuqoridan kurs tanlang."
            />
          </div>
        ) : attendanceLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarCheck}
              title="Davomat ma'lumoti yo'q"
              description="Bu sana uchun hali davomat belgilanmagan yoki o'quvchilar ro'yxatga olinmagan."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {attendance.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {record.studentName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium">{record.studentName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      record.present
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {record.present ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {record.present ? "Keldi" : "Kelmadi"}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={record.present ? "default" : "outline"}
                      className="h-8 px-3"
                      onClick={() =>
                        markAttendance({ studentId: record.studentId, present: true })
                      }
                    >
                      Keldi
                    </Button>
                    <Button
                      size="sm"
                      variant={!record.present ? "destructive" : "outline"}
                      className="h-8 px-3"
                      onClick={() =>
                        markAttendance({ studentId: record.studentId, present: false })
                      }
                    >
                      Kelmadi
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
