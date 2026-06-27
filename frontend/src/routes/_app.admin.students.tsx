import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Plus, UserPlus } from "lucide-react";

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
import { getAdminStudents, addStudent, linkParent, type AdminUser } from "@/lib/api";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { Pagination } from "@/components/ui/Pagination";

export const Route = createFileRoute("/_app/admin/students")({
  head: () => ({ meta: [{ title: "O'quvchilar · AcademiXAI" }] }),
  component: StudentsPage,
});

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary/20 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {role}
    </span>
  );
}

function StudentsPage() {
  const qc = useQueryClient();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [linkTarget, setLinkTarget] = useState<AdminUser | null>(null);
  const [parentEmail, setParentEmail] = useState("");

  const linkMut = useMutation({
    mutationFn: () => linkParent(linkTarget!.id, parentEmail),
    onSuccess: () => {
      toast.success(t.admin.parentLinked);
      setLinkTarget(null);
      setParentEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: students = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin-students"],
    queryFn: getAdminStudents,
  });

  const addMut = useMutation({
    mutationFn: () => addStudent(fullName, email, password || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      toast.success(t.admin.studentAdded);
      setFullName("");
      setEmail("");
      setPassword("");
      setOpen(false);
    },
    onError: () => toast.error(t.error.generic),
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
        title={t.admin.studentList}
        description={t.admin.description}
        actions={
          <Button onClick={() => setOpen(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            {t.admin.addStudent}
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">{t.action.loading}</div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t.admin.studentList}
          description={t.admin.description}
          action={
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t.admin.addStudent}
            </Button>
          }
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground">
              {t.admin.totalStudents}: <span className="text-foreground font-semibold">{students.length}</span>
            </p>
          </div>
          <ul className="divide-y divide-border">
            {students.slice(page * 20, (page + 1) * 20).map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/20">
                    <Users className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => setLinkTarget(s)}
                  >
                    {t.admin.linkParent}
                  </Button>
                  <RoleBadge role={s.role} />
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 py-4 border-t border-border">
            <Pagination page={page} total={students.length} onChange={setPage} />
          </div>
        </div>
      )}

      <Dialog open={!!linkTarget} onOpenChange={(v) => { if (!v) { setLinkTarget(null); setParentEmail(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.admin.linkParent} — {linkTarget?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentEmail">{t.admin.parentEmailLabel}</Label>
              <Input
                id="parentEmail"
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setLinkTarget(null); setParentEmail(""); }}>{t.action.cancel}</Button>
              <Button onClick={() => linkMut.mutate()} disabled={linkMut.isPending || !parentEmail.trim()}>
                {linkMut.isPending ? t.action.loading : t.admin.linkParent}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.admin.addStudent}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.profile.fullName}</Label>
              <Input
                id="fullName"
                placeholder="Karimov Jasur"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.profile.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@maktab.uz"
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
                {addMut.isPending ? t.action.loading : t.action.add}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
