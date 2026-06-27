import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ScanLine, Upload, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Lightbulb, BookOpen, ChevronDown, ChevronUp, Clock, ImageIcon,
  Hash, ArrowRight, Target, Sigma,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { getHomeworkList, submitHomework, type HomeworkResult } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/student/homework")({
  head: () => ({ meta: [{ title: "Uy ishi AI · AcademiXAI" }] }),
  component: HomeworkPage,
});

const SUBJECTS = ["Matematika", "Fizika", "Kimyo", "Biologiya", "Tarix", "Ingliz tili", "Algebra", "Geometriya"];

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/30" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: HomeworkResult }) {
  const [showOcr, setShowOcr] = useState(false);
  const [showImg, setShowImg] = useState(false);

  let p: HomeworkResult = result;
  if (result.aiFeedback) {
    try {
      const c = result.aiFeedback.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      p = { ...result, ...JSON.parse(c) };
    } catch { /* use raw */ }
  }

  const isResubmit = p.resubmitRequired;
  const isOk = !isResubmit && p.isCorrect;
  const borderColor = isResubmit ? "border-amber-200 dark:border-amber-800/40" : isOk ? "border-green-200 dark:border-green-800/40" : "border-red-200 dark:border-red-800/40";
  const StatusIcon = isResubmit ? AlertTriangle : isOk ? CheckCircle2 : XCircle;
  const statusColor = isResubmit ? "text-amber-500" : isOk ? "text-green-500" : "text-red-500";
  const statusText = isResubmit ? "Qayta topshiring" : isOk ? "To'g'ri yechilgan" : "Xatolar bor";

  return (
    <div className={cn("rounded-2xl border bg-card shadow-soft overflow-hidden", borderColor)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <StatusIcon className={cn("h-5 w-5 shrink-0", statusColor)} />
        <div className="flex-1">
          <p className="font-semibold text-sm">{p.subject}</p>
          <p className={cn("text-xs font-medium", statusColor)}>{statusText}</p>
        </div>
        {!isResubmit && <ScoreRing score={p.score ?? 0} size={64} />}
        {isResubmit && (
          <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-3 py-1 rounded-full font-medium">
            Qayta yuklang
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Formula */}
        {p.formulaUsed && p.formulaUsed !== "—" && (
          <div className="rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 px-4 py-3 flex items-center gap-3">
            <Sigma className="h-4 w-4 shrink-0 text-purple-600" />
            <div>
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-0.5">Ishlatilgan formula</p>
              <p className="text-sm font-mono font-semibold text-purple-900 dark:text-purple-100">{p.formulaUsed}</p>
            </div>
          </div>
        )}

        {/* Method */}
        {p.method && (
          <div className="flex gap-2">
            <BookOpen className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Yechish usuli</p>
              <p className="text-sm">{p.method}</p>
            </div>
          </div>
        )}

        {/* Steps grid */}
        {((p.correctSteps && p.correctSteps.length > 0) || (p.incorrectSteps && p.incorrectSteps.length > 0)) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {p.correctSteps && p.correctSteps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> To'g'ri qadamlar
                </p>
                <ul className="space-y-1">
                  {p.correctSteps.map((s, i) => (
                    <li key={i} className="text-xs bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 rounded-lg px-3 py-2 flex gap-2">
                      <Hash className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.incorrectSteps && p.incorrectSteps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Noto'g'ri qadamlar
                </p>
                <ul className="space-y-1">
                  {p.incorrectSteps.map((s, i) => (
                    <li key={i} className="text-xs bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 rounded-lg px-3 py-2 flex gap-2">
                      <Hash className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Answer comparison */}
        {(p.finalAnswer || p.expectedAnswer) && (
          <div className="flex items-center gap-2 text-sm">
            <div className={cn("flex-1 rounded-lg px-3 py-2 text-center", p.isCorrect ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20")}>
              <p className="text-xs text-muted-foreground mb-0.5">O'quvchi javobi</p>
              <p className="font-mono font-semibold">{p.finalAnswer || "—"}</p>
            </div>
            {!p.isCorrect && p.expectedAnswer && (
              <>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 rounded-lg px-3 py-2 text-center bg-green-50 dark:bg-green-950/20">
                  <p className="text-xs text-muted-foreground mb-0.5">To'g'ri javob</p>
                  <p className="font-mono font-semibold text-green-700">{p.expectedAnswer}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Errors */}
        {p.errors && p.errors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Target className="h-3.5 w-3.5" /> Aniq xatolar
            </p>
            <ul className="space-y-1">
              {p.errors.map((e, i) => (
                <li key={i} className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2 flex gap-2">
                  <span className="text-red-400 shrink-0 font-bold">{i + 1}.</span>{e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resubmit warning */}
        {isResubmit && p.resubmitReason && (
          <div className="flex gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <p className="text-sm text-amber-800 dark:text-amber-200">{p.resubmitReason}</p>
          </div>
        )}

        {/* Feedback */}
        {p.feedback && (
          <div className="flex gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3">
            <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
            <p className="text-sm text-blue-800 dark:text-blue-200">{p.feedback}</p>
          </div>
        )}

        {/* Collapsibles */}
        {p.ocrText && (
          <>
            <button onClick={() => setShowOcr(v => !v)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full">
              {showOcr ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              O'qilgan matn (OCR)
            </button>
            {showOcr && (
              <pre className="text-xs bg-muted/40 rounded-xl p-3 whitespace-pre-wrap font-mono text-muted-foreground">
                {p.ocrText}
              </pre>
            )}
          </>
        )}

        {p.imageData && (
          <>
            <button onClick={() => setShowImg(v => !v)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full">
              {showImg ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Yuklangan rasm
            </button>
            {showImg && <img src={p.imageData} alt="homework" className="max-w-full rounded-xl border border-border" />}
          </>
        )}

        {p.createdAt && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1 border-t border-border">
            <Clock className="h-3 w-3" />
            {new Date(p.createdAt).toLocaleString("uz-Latn-UZ", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

function HomeworkPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("Matematika");
  const [loading, setLoading] = useState(false);
  const [latest, setLatest] = useState<HomeworkResult | null>(null);

  const { data: history = [] } = useQuery({
    queryKey: ["homework-list"],
    queryFn: getHomeworkList,
  });

  function pickFile(f: File) {
    if (!f.type.startsWith("image/")) { toast.error("Faqat rasm fayllari"); return; }
    setFile(f);
    setLatest(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    try {
      const result = await submitHomework(file, subject);
      setLatest(result);
      qc.invalidateQueries({ queryKey: ["homework-list"] });
      toast.success("Uy ishi tekshirildi!");
      setPreview(null);
      setFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Xato yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Yordamchi"
        title="Uy ishi tekshirish"
        description="Matematika uy ishini skaner yoki rasm orqali yuklang — AI yechishni tahlil qiladi"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Upload panel */}
        <div className="space-y-4">
          {/* Subject selector */}
          <div className="flex gap-2 flex-wrap">
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setSubject(s)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  subject === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                {s}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "relative rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-56 flex flex-col items-center justify-center gap-3",
              dragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/30",
              preview && "border-solid border-border"
            )}
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-72 max-w-full rounded-xl object-contain" />
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center">
                  <ImageIcon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">Rasm yuklash</p>
                  <p className="text-xs text-muted-foreground mt-1">Uy ishi rasmini shu yerga tashlang yoki bosing</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, HEIC — max 10MB</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ScanLine className="h-3.5 w-3.5" /> Skaner yoki telefon kamerasi ham ishlaydi
                </div>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
          </div>

          {/* Actions */}
          {file && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setFile(null); setPreview(null); }}>
                Bekor qilish
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> AI tekshiryapti…</>
                ) : (
                  <><Upload className="h-4 w-4" /> Tekshirish</>
                )}
              </Button>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center">
                  <ScanLine className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI tekshiryapti…</p>
                  <p className="text-xs text-muted-foreground">OCR + matematik tahlil</p>
                </div>
              </div>
              {["Yozuvni o'qiyapti (OCR)…", "Yechish usulini tahlil qilyapti…", "Xatolarni tekshiryapti…"].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: `${i * 300}ms` }} />
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {latest && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Natija</p>
              <ResultCard result={latest} />
            </div>
          )}

          {history.length > 0 && !latest && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Oxirgi topshiriqlar ({history.length})
              </p>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {history.map(h => <ResultCard key={h.id} result={h} />)}
              </div>
            </div>
          )}

          {history.length === 0 && !latest && !loading && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <ScanLine className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Hali birorta uy ishi tekshirilmagan</p>
              <p className="text-xs text-muted-foreground mt-1">Chap tomonga rasm yuklang</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
