import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const searchSchema = z.object({ email: z.string().optional() });

export const Route = createFileRoute("/auth/verify")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Pochtani tasdiqlash · AcademiXAI" },
      { name: "description", content: "AcademiXAI hisobi uchun elektron pochta manzilingizni tasdiqlang." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { email } = Route.useSearch();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    setCode((prev) => prev.map((c, idx) => (idx === i ? digit : c)));
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!data.length) return;
    setCode(Array.from({ length: 6 }, (_, i) => data[i] ?? ""));
    inputs.current[Math.min(data.length, 5)]?.focus();
  }

  async function onVerify() {
    if (code.some((c) => !c)) {
      toast.error("Iltimos, 6 xonali kodni to'liq kiriting");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast.success("Elektron pochta tasdiqlandi");
    navigate({ to: "/auth/login" });
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-secondary">
          <MailCheck className="h-5 w-5" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Pochtani tasdiqlang</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {email ? (
            <>
              <span className="font-medium text-foreground">{email}</span> manziliga 6 xonali tasdiqlash kodi yuborildi.
            </>
          ) : (
            "Sizning elektron pochtangizga 6 xonali tasdiqlash kodi yuborildi."
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
        <div className="flex justify-center gap-2">
          {code.map((c, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={c}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={onPaste}
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-11 rounded-lg border border-input bg-background text-center font-display text-lg font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring sm:h-14 sm:w-12 sm:text-xl"
            />
          ))}
        </div>

        <Button onClick={onVerify} className="mt-6 h-11 w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tasdiqlash"}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Kod kelmadimi?{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => toast.success("Yangi kod yuborildi")}
          >
            Qayta yuborish
          </button>
        </p>
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
