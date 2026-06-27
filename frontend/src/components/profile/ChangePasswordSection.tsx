import { useState } from "react";
import { Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/api";
import { useT } from "@/lib/i18n";

export function ChangePasswordSection() {
  const { t } = useT();
  const s = t.settings;
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

  const mut = useMutation({
    mutationFn: () => changePassword(form.current, form.next),
    onSuccess: () => {
      toast.success(s.passwordChanged);
      setForm({ current: "", next: "", confirm: "" });
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("incorrect") ? s.currentPasswordWrong : e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next.length < 8) { toast.error(s.newPasswordShort); return; }
    if (form.next !== form.confirm) { toast.error(s.passwordsNotMatch); return; }
    mut.mutate();
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <header className="mb-4 flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">{s.security}</h3>
      </header>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="current">{s.currentPassword}</Label>
          <Input
            id="current"
            type="password"
            placeholder="••••••••"
            className="h-10 max-w-md"
            value={form.current}
            onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new">{s.newPassword}</Label>
          <Input
            id="new"
            type="password"
            placeholder={s.minChars}
            className="h-10"
            value={form.next}
            onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">{s.confirmPassword}</Label>
          <Input
            id="confirm"
            type="password"
            placeholder={s.repeatNew}
            className="h-10"
            value={form.confirm}
            onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
            required
          />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button
            type="submit"
            disabled={mut.isPending || !form.current || !form.next || !form.confirm}
          >
            <Lock className="h-4 w-4" />
            {mut.isPending ? t.action.loading : s.updatePassword}
          </Button>
        </div>
      </form>
    </section>
  );
}
