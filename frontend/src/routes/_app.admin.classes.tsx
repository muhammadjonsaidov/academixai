import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { School, Plus, Trash2, UserPlus, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  getClasses, createClass, deleteClass, getClassStudents,
  getAdminStudents, getAdminTeachers,
  assignStudentToClass, removeStudentFromClass, assignTeacherToClass,
  type SchoolClass, type AdminUser,
} from "@/lib/api";
import { useT } from "@/lib/i18n";
import { Pagination } from "@/components/ui/Pagination";

export const Route = createFileRoute("/_app/admin/classes")({
  head: () => ({ meta: [{ title: "Sinflar · AcademiXAI" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const { t } = useT();
  const a = t.admin;
  const qc = useQueryClient();

  const { data: classes = [], isLoading } = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const { data: teachers = [] } = useQuery({ queryKey: ["admin-teachers"], queryFn: getAdminTeachers });
  const { data: allStudents = [] } = useQuery({ queryKey: ["admin-students"], queryFn: getAdminStudents });

  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const createMut = useMutation({
    mutationFn: () => createClass(name.trim(), grade ? parseInt(grade) : undefined, teacherId ? parseInt(teacherId) : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success(a.classAdded);
      setCreateOpen(false);
      setName(""); setGrade(""); setTeacherId("");
    },
    onError: () => toast.error(t.error.saveFailed),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteClass(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); toast.success(a.classDeleted); },
    onError: () => toast.error(t.error.saveFailed),
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title={a.classes} description={a.classesDesc} />

      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />{a.addClass}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{a.addClass}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>{a.className}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="9-A" required />
              </div>
              <div className="space-y-1.5">
                <Label>{a.gradeLevel}</Label>
                <Input type="number" min={1} max={11} value={grade} onChange={e => setGrade(e.target.value)} placeholder="9" />
              </div>
              <div className="space-y-1.5">
                <Label>{a.homeroomTeacher}</Label>
                <select
                  value={teacherId}
                  onChange={e => setTeacherId(e.target.value)}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">{a.unassigned}</option>
                  {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.fullName}</option>)}
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={createMut.isPending || !name.trim()}>
                {createMut.isPending ? t.action.loading : a.addClass}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <School className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">{a.noClasses}</p>
          <p className="text-sm text-muted-foreground mt-1">{a.noClassesDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.slice(page * 10, (page + 1) * 10).map(cls => (
            <ClassCard
              key={cls.id}
              cls={cls}
              teachers={teachers}
              allStudents={allStudents}
              expanded={expanded === cls.id}
              onToggle={() => setExpanded(expanded === cls.id ? null : cls.id)}
              onDelete={() => deleteMut.mutate(cls.id)}
            />
          ))}
          <Pagination page={page} total={classes.length} onChange={p => { setPage(p); setExpanded(null); }} />
        </div>
      )}
    </div>
  );
}

function ClassCard({
  cls, teachers, allStudents, expanded, onToggle, onDelete,
}: {
  cls: SchoolClass;
  teachers: AdminUser[];
  allStudents: AdminUser[];
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useT();
  const a = t.admin;
  const qc = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ["class-students", cls.id],
    queryFn: () => getClassStudents(cls.id),
    enabled: expanded,
  });

  const assignStudentMut = useMutation({
    mutationFn: (studentId: number) => assignStudentToClass(cls.id, studentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["class-students", cls.id] }); toast.success(t.action.saved); },
    onError: () => toast.error(t.error.saveFailed),
  });

  const removeStudentMut = useMutation({
    mutationFn: (studentId: number) => removeStudentFromClass(cls.id, studentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["class-students", cls.id] }); toast.success(t.action.saved); },
    onError: () => toast.error(t.error.saveFailed),
  });

  const assignTeacherMut = useMutation({
    mutationFn: (teacherId: number) => assignTeacherToClass(cls.id, teacherId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); toast.success(t.action.saved); },
    onError: () => toast.error(t.error.saveFailed),
  });

  const assignedIds = new Set(students.map(s => s.id));
  const unassigned = allStudents.filter(s => !assignedIds.has(s.id));

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <School className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{cls.name}{cls.gradeLevel ? ` (${cls.gradeLevel}-sinf)` : ""}</p>
            <p className="text-xs text-muted-foreground">
              {cls.homeroomTeacherName ? `${a.homeroomTeacher}: ${cls.homeroomTeacherName}` : a.unassigned} · {cls.studentCount} o&apos;quvchi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={e => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-5">
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-primary" />{a.assignTeacher}
            </p>
            <select
              value={cls.homeroomTeacherId ?? ""}
              onChange={e => e.target.value && assignTeacherMut.mutate(parseInt(e.target.value))}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">{a.unassigned}</option>
              {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.fullName}</option>)}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-primary" />{a.studentsInClass} ({students.length})
            </p>
            {students.length > 0 && (
              <ul className="divide-y divide-border border border-border rounded-lg mb-3 max-h-48 overflow-y-auto">
                {students.map(s => (
                  <li key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive"
                      onClick={() => removeStudentMut.mutate(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {unassigned.length > 0 && (
              <div className="flex gap-2">
                <select
                  id={`add-student-${cls.id}`}
                  className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>{a.assignStudents}</option>
                  {unassigned.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </select>
                <Button size="sm" onClick={() => {
                  const sel = document.getElementById(`add-student-${cls.id}`) as HTMLSelectElement;
                  if (sel.value) assignStudentMut.mutate(parseInt(sel.value));
                }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
