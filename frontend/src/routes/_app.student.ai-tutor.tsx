import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Image, MessageSquare, Mic, Paperclip, Plus, Send, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/Markdown";
import { getChatHistory, sendChat, type ChatSource } from "@/lib/api";
import { uzTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/ai-tutor")({
  head: () => ({ meta: [{ title: "AI Ustoz · AcademiXAI" }] }),
  component: AiTeacherPage,
});

interface Msg {
  id: string; role: "user" | "assistant"; content: string; time: string;
  sources?: ChatSource[]; usedKnowledgeBase?: boolean;
}

const STARTERS = [
  "Kvadrat tenglamalarni qanday yechish kerak?",
  "Past Perfect zamoniga 3 ta misol keltir",
  "Nyutonning uchinchi qonunini sodda tushuntirib ber",
  "Adabiyot inshosi uchun reja tuzib ber",
];

function AiTeacherPage() {
  const { t } = useT();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Load real chat history from backend
  const { data: history } = useQuery({
    queryKey: ["chat-history"],
    queryFn: getChatHistory,
  });

  useEffect(() => {
    if (history && !historyLoaded) {
      const mapped: Msg[] = [];
      history.forEach((h) => {
        // Each ChatMessage has user message + AI response
        if ((h as any).message) {
          mapped.push({
            id: `u-${(h as any).id ?? crypto.randomUUID()}`,
            role: "user",
            content: (h as any).message,
            time: h.createdAt ? uzTime(new Date(h.createdAt)) : "",
          });
          mapped.push({
            id: `a-${(h as any).id ?? crypto.randomUUID()}`,
            role: "assistant",
            content: (h as any).response ?? h.content ?? "",
            time: h.createdAt ? uzTime(new Date(h.createdAt)) : "",
          });
        } else {
          mapped.push({
            id: String((h as any).id ?? crypto.randomUUID()),
            role: h.role ?? "assistant",
            content: h.content ?? "",
            time: h.createdAt ? uzTime(new Date(h.createdAt)) : "",
          });
        }
      });
      if (mapped.length > 0) {
        setMessages(mapped.reverse());
        setHistoryLoaded(true);
      }
    }
  }, [history, historyLoaded]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages]);

  function newChat() {
    setMessages([]);
    setInput("");
    toast.success(t.action.newChat);
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const now = uzTime(new Date());
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: text, time: now }]);
    setInput("");
    setSending(true);
    try {
      const data = await sendChat(text);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          time: uzTime(new Date()),
          sources: data.sources,
          usedKnowledgeBase: data.usedKnowledgeBase,
        },
      ]);
    } catch {
      toast.error(t.error.aiError);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.aiTutor.title}
        title={t.aiTutor.subtitle}
        description={t.aiTutor.description}
        actions={
          <Button onClick={newChat} variant="outline" className="h-10">
            <Plus className="h-4 w-4" />
            {t.action.newChat}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* History sidebar */}
        <aside className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.aiTutor.history}
            </p>
          </div>
          <div className="p-4">
            {history && history.length > 0 ? (
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => {}}
                    className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm bg-primary/10 text-foreground"
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">Joriy suhbat</p>
                      <p className="text-[11px] text-muted-foreground">{history.length} ta savol</p>
                    </div>
                  </button>
                </li>
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">{t.aiTutor.noHistory}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <section className="flex h-[34rem] flex-col rounded-2xl border border-border bg-card shadow-soft">
          <header className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Ustoz Amir</p>
                <p className="text-[11px] text-muted-foreground">{t.aiTutor.onlineStatus}</p>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{t.aiTutor.startPrompt}</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {t.aiTutor.startDescription}
                </p>
                <div className="mt-5 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                  {STARTERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="rounded-xl border border-border bg-background p-3 text-left text-sm hover:border-primary/40 hover:bg-muted/60 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {messages.map((m) => (
                  <li key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.role === "assistant" && (
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary self-end">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                    <div className="max-w-[80%] flex flex-col gap-1">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm",
                          m.role === "user" ? "bg-primary text-primary-foreground whitespace-pre-line" : "bg-muted text-foreground",
                        )}
                      >
                        {m.role === "assistant" ? (
                          <Markdown>{m.content}</Markdown>
                        ) : m.content}
                        {m.time && (
                          <p className={cn("mt-1.5 text-[10px]", m.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                            {m.time}
                          </p>
                        )}
                      </div>
                      {m.role === "assistant" && m.usedKnowledgeBase && m.sources && m.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-1">
                          {m.sources.map((s, i) => (
                            <span
                              key={i}
                              title={s.snippet}
                              className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary flex items-center gap-1"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              {s.fileName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
                {sending && (
                  <li className="flex gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary self-end">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl bg-muted px-4 py-3 flex gap-1">
                      {[0, 200, 400].map((d) => (
                        <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </li>
                )}
                <div ref={bottomRef} />
              </ul>
            )}
          </div>

          <form onSubmit={send} className="border-t border-border p-3 shrink-0">
            <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-2">
              <input ref={fileInput} type="file" className="hidden" onChange={() => toast.success("Fayl biriktirildi")} />
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => fileInput.current?.click()}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => toast.info("Rasm yuborish")}>
                <Image className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => toast.info("Ovoz yozish")}>
                <Mic className="h-4 w-4" />
              </Button>
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={t.aiTutor.placeholder}
                className="max-h-32 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {t.aiTutor.disclaimer}
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
