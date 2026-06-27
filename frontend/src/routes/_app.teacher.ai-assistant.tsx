import { createFileRoute } from "@tanstack/react-router";
import {
  useRef, useState, useEffect, useCallback, type FormEvent, type ChangeEvent,
} from "react";
import {
  Sparkles, Plus, Send, Mic, MicOff, Paperclip, X, MessageSquare,
  FileText, ChevronLeft, ChevronDown, ChevronUp, Upload, Trash2, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/Markdown";
import { api, getTeacherDocuments, uploadTeacherDocument, deleteTeacherDocument, type TeacherDocument } from "@/lib/api";
import { uzTime, uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Yordamchi · AcademiXAI" }] }),
  component: AiAssistantPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  name: string;
  type: "image" | "document";
  dataUrl: string;
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  attachments?: Attachment[];
}

interface Session {
  id: string;
  title: string;
  createdAt: string;
  messages: Msg[];
}

// ── localStorage helpers ───────────────────────────────────────────────────────

const LS_KEY = "academix_ai_sessions";

function loadSessions(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as Session[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(sessions.slice(0, 30)));
}

function sessionTitle(messages: Msg[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "Yangi suhbat";
  return first.content.slice(0, 40) + (first.content.length > 40 ? "…" : "");
}

// ── Compact Knowledge Base ────────────────────────────────────────────────────

function KnowledgeBasePanel() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<TeacherDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    getTeacherDocuments().then(setDocs).catch(() => {});
  }, [open]);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t.error.fileTooLarge); return; }
    setUploading(true);
    try {
      await uploadTeacherDocument(file, "lesson_plan", undefined);
      toast.success(t.teacher.fileUploaded);
      const fresh = await getTeacherDocuments();
      setDocs(fresh);
      qc.invalidateQueries({ queryKey: ["teacher-docs"] });
    } catch {
      toast.error(t.error.uploadFailed);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: number) {
    try {
      await deleteTeacherDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error(t.error.deleteFailed);
    }
  }

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          Bilim bazasi
        </span>
        {open ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-2 pb-2 space-y-1.5">
          <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/30 px-2 py-1.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            {uploading
              ? <div className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
              : <Upload className="h-3 w-3" />
            }
            PDF / TXT yuklash
          </button>

          {docs.length > 0 && (
            <ul className="space-y-0.5">
              {docs.map((d) => (
                <li key={d.id} className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5">
                  <FileText className="h-3 w-3 shrink-0 text-primary/70" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-foreground">{d.fileName}</p>
                    <p className="text-[9px] text-muted-foreground">{d.chunkCount} chunk · {uzDate(d.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => remove(d.id)}
                    className="hidden rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const STARTERS = [
  "Dars rejasi yarat",
  "O'quvchilar uchun test savollari",
  "Mavzuni tushuntir",
  "Baholash mezonlarini yoz",
];

export default function AiAssistantPage() {
  const { t } = useT();
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [activeId, setActiveId] = useState<string | null>(() => loadSessions()[0]?.id ?? null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  // ── Persist ─────────────────────────────────────────────────────────────────
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // ── Scroll ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [activeSession?.messages.length, sending]);

  // ── New session ─────────────────────────────────────────────────────────────
  const newSession = useCallback(() => {
    const id = crypto.randomUUID();
    const session: Session = {
      id,
      title: "Yangi suhbat",
      createdAt: uzTime(new Date()),
      messages: [],
    };
    setSessions((prev) => [session, ...prev]);
    setActiveId(id);
    setInput("");
    setAttachments([]);
  }, []);

  // ── Ensure at least one session ──────────────────────────────────────────────
  useEffect(() => {
    if (sessions.length === 0) newSession();
  }, []);

  // ── File attachment ──────────────────────────────────────────────────────────
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t.error.fileTooLarge);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const type: Attachment["type"] = file.type.startsWith("image/") ? "image" : "document";
        setAttachments((prev) => [
          ...prev,
          { id: crypto.randomUUID(), name: file.name, type, dataUrl },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  // ── Voice input ──────────────────────────────────────────────────────────────
  function toggleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SR) {
      toast.error("Bu brauzer ovozni tanib olmaydi");
      return;
    }

    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const r = new SR();
    r.lang = "uz-UZ";
    r.continuous = false;
    r.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput((prev) => prev ? prev + " " + text : text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => { toast.error("Ovozni tanishda xato"); setListening(false); };
    r.start();
    recogRef.current = r;
    setListening(true);
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if ((!text && attachments.length === 0) || sending) return;
    if (!activeId) return;

    const now = uzTime(new Date());
    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      time: now,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? { ...s, messages: [...s.messages, userMsg], title: sessionTitle([...s.messages, userMsg]) }
          : s,
      ),
    );
    setInput("");
    setAttachments([]);
    setSending(true);

    try {
      // Build context with attachment info
      let messageText = text;
      if (attachments.length > 0) {
        const fileNames = attachments.map((a) => a.name).join(", ");
        messageText = text
          ? `${text}\n\n[Biriktirilgan fayllar: ${fileNames}]`
          : `[Biriktirilgan fayllar: ${fileNames}]`;
      }

      const data = await api.post<{ reply: string }>("/api/teacher/ai-chat", {
        message: messageText,
      });

      const assistantMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        time: uzTime(new Date()),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? { ...s, messages: [...s.messages, assistantMsg] }
            : s,
        ),
      );
    } catch {
      toast.error(t.error.aiError);
    } finally {
      setSending(false);
    }
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setActiveId(remaining[0]?.id ?? null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Page title bar */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            AI YORDAMCHI
          </p>
          <h1 className="font-display text-xl font-bold text-foreground">AI Pedagogik Yordamchi</h1>
        </div>
        <Button size="sm" onClick={newSession} className="gap-2">
          <Plus className="h-4 w-4" />
          Yangi suhbat
        </Button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 gap-3 min-h-0">
        {/* Sessions sidebar */}
        <aside
          className={cn(
            "flex flex-col rounded-2xl border border-border bg-card shadow-soft transition-all duration-200",
            sidebarOpen ? "w-56 shrink-0" : "w-0 overflow-hidden border-0 shadow-none",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Suhbatlar
            </p>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 p-2">
            {sessions.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">Hali suhbat yo'q</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={cn(
                    "group relative w-full rounded-lg px-2.5 py-2 text-left transition-colors",
                    s.id === activeId
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <div className="flex items-start gap-2 pr-5">
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {s.messages.filter((m) => m.role === "user").length} savol · {s.createdAt}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="absolute right-1.5 top-2 hidden rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </button>
              ))
            )}
          </div>

          {/* Quick starters */}
          <div className="border-t border-border p-2">
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tezkor so'rovlar
            </p>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-foreground/80 hover:bg-muted/60 transition-colors"
              >
                <Sparkles className="h-3 w-3 shrink-0 text-primary/70" />
                {s}
              </button>
            ))}
          </div>

          <KnowledgeBasePanel />
        </aside>

        {/* Chat panel */}
        <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card shadow-soft">
          {/* Chat header */}
          <header className="flex items-center gap-3 border-b border-border px-4 py-2.5 shrink-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-2 flex-1">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {activeSession?.title ?? "AI Pedagogik Yordamchi"}
                </p>
                <p className="text-[10px] text-muted-foreground">dars rejasi · testlar · baholash</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-muted-foreground">Faol</span>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 space-y-4">
            {!activeSession || activeSession.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-base font-semibold">Suhbatni boshlang</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Savol yozing, fayl yuklang yoki tezkor so'rovdan tanlang
                </p>
                <div className="mt-4 grid w-full max-w-md gap-2 sm:grid-cols-2">
                  {STARTERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="rounded-xl border border-border bg-background p-2.5 text-left text-xs hover:border-primary/40 hover:bg-muted/60 transition-colors"
                    >
                      <Sparkles className="mb-1 h-3 w-3 text-primary" />
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {activeSession.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {m.role === "assistant" && (
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary self-end">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className="max-w-[78%] flex flex-col gap-1">
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {m.attachments.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1"
                            >
                              {a.type === "image" ? (
                                <>
                                  <img src={a.dataUrl} alt={a.name} className="h-12 w-12 rounded object-cover" />
                                </>
                              ) : (
                                <>
                                  <FileText className="h-3.5 w-3.5 text-primary" />
                                  <span className="max-w-[120px] truncate text-[11px]">{a.name}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {m.content && (
                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2.5 text-sm",
                            m.role === "user"
                              ? "bg-primary text-primary-foreground whitespace-pre-line"
                              : "bg-muted text-foreground",
                          )}
                        >
                          {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
                          <p className={cn("mt-1 text-[10px]",
                            m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>{m.time}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex gap-2.5">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-2xl bg-muted px-4 py-3 flex gap-1">
                      {[0, 200, 400].map((d) => (
                        <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <form onSubmit={send} className="border-t border-border p-3 shrink-0">
            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 pl-2 pr-1 py-1">
                    {a.type === "image"
                      ? <img src={a.dataUrl} alt={a.name} className="h-5 w-5 rounded object-cover" />
                      : <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                    }
                    <span className="max-w-[100px] truncate text-[11px]">{a.name}</span>
                    <button type="button" onClick={() => removeAttachment(a.id)}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-2">
              {/* File upload */}
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Fayl biriktirish"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleVoice}
                className={cn(
                  "rounded-lg p-1.5 transition-colors",
                  listening
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                title={listening ? "To'xtatish" : "Ovoz kiritish"}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={listening ? "Tinglayapman..." : t.aiTutor.placeholder}
                className="max-h-28 min-h-[2rem] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={(!input.trim() && attachments.length === 0) || sending}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              {t.aiTutor.disclaimer}
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
