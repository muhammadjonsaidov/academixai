import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GraduationCap, Plus, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/shell/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getAdminTeachers, addTeacher, type AdminUser } from "@/lib/api";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { Pagination } from "@/components/ui/Pagination";

export const Route = createFileRoute("/_app/admin/teachers")({
  head: () => ({ meta: [{ title: "O'qituvchilar · AcademiXAI" }] }),
  component: TeachersPage,
});

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {role}
    </span>
  );
}

function TeachersPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { data: teachers = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-teachers"],
    queryFn: getAdminTeachers,
  });

  const addMut = useMutation({
    mutationFn: () => addTeacher(fullName, email, password || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast.success(t.admin.teacherAdded);
      setFullName("");
      setEmail("");
      setPassword("");
      setOpen(false);
    },
    onError: () => toast.error(t.error.saveFailed),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    addMut.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={t.nav.teachers}
        description={t.admin.teacherList}
        actions={
          <Button onClick={() => setOpen(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            {t.admin.addTeacher}
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">{t.action.loading}</div>
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={t.admin.noTeachers}
          description={t.admin.noTeachersDesc}
          action={
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t.admin.addTeacher}
            </Button>
          }
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground">
              {t.admin.teacherList}: <span className="text-foreground font-semibold">{teachers.length}</span>
            </p>
          </div>
          <ul className="divide-y divide-border">
            {teachers.slice(page * 20, (page + 1) * 20).map((teacher) => (
              <li key={teacher.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{teacher.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                  </div>
                </div>
                <RoleBadge role={teacher.role} />
              </li>
            ))}
          </ul>
          <div className="px-5 py-4 border-t border-border">
            <Pagination page={page} total={teachers.length} onChange={setPage} />
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.admin.addTeacher}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.auth.fullName}</Label>
              <Input
                id="fullName"
                placeholder="Abdullayev Alisher"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.admin.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@maktab.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">{t.admin.initialPassword}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.admin.passwordOptional}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t.action.cancel}
              </Button>
              <Button type="submit" disabled={addMut.isPending}>
                {addMut.isPending ? t.admin.adding : t.action.add}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
