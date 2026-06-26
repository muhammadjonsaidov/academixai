import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({
    meta: [
      { title: "Parolni tiklash · AcademiXAI" },
      { name: "description", content: "AcademiXAI hisobi parolini elektron pochta orqali tiklang." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
    toast.success("Tiklash havolasi pochtangizga yuborildi");
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Parolni tiklash</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elektron pochtangizni kiriting — sizga parolni tiklash havolasini yuboramiz.
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-foreground">
              <span className="font-medium">{email}</span> manziliga tiklash havolasi yuborildi.
              Pochtangizni tekshiring va havola orqali yangi parol o'rnating.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Boshqa pochta kiritish
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Elektron pochta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ism.familiya@maktab.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Havola yuborish"}
            </Button>
          </form>
        )}
      </div>

      <Link
        to="/auth/login"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kirish sahifasiga qaytish
      </Link>
    </div>
  );
}
