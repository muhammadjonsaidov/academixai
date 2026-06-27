import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Send, Circle } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/parent/messages")({
  head: () => ({ meta: [{ title: "Xabarlar · AcademiXAI" }] }),
  component: MessagesPage,
});

interface Message { id: string; text: string; from: "me" | "them"; time: string; }
interface Conversation { id: string; name: string; avatar: string; role: string; online: boolean; messages: Message[]; }

const SEED: Conversation[] = [
  {
    id: "1", name: "Aziza Mirzayeva", avatar: "AM", role: "Matematika o'qituvchisi", online: true,
    messages: [
      { id: "1a", text: "Assalomu alaykum! Farzandingiz haqida gaplashishim kerak edi.", from: "them", time: "09:00" },
      { id: "1b", text: "Vaalaykum assalom! Nima bo'ldi?", from: "me", time: "09:05" },
      { id: "1c", text: "Akbar bu hafta 3 ta uy vazifani keltirmadi. Sababini bilib olsangiz.", from: "them", time: "09:06" },
      { id: "1d", text: "Tushundim, albatta gaplashaman u bilan. Rahmat!", from: "me", time: "09:10" },
    ],
  },
  {
    id: "2", name: "Maktab ma'muriyati", avatar: "MM", role: "Maktab", online: true,
    messages: [
      { id: "2a", text: "E'lon: 10-iyulda ota-onalar yig'ilishi bo'lib o'tadi.", from: "them", time: "Kecha" },
      { id: "2b", text: "Kelaman, rahmat xabar uchun.", from: "me", time: "Kecha" },
    ],
  },
  {
    id: "3", name: "Dilnoza Xasanova", avatar: "DX", role: "Sinf rahbari", online: false,
    messages: [
      { id: "3a", text: "Akbarning davomat ko'rsatkichi haqida.", from: "them", time: "2 kun oldin" },
      { id: "3b", text: "Bu oy 3 kun kelmasdi. Iltimos nazorat qiling.", from: "them", time: "2 kun oldin" },
      { id: "3c", text: "Albatta, e'tibor beraman. Rahmat.", from: "me", time: "2 kun oldin" },
    ],
  },
];

const LS_KEY = "academix_parent_messages";
function loadConvos(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "null") ?? SEED; } catch { return SEED; }
}

function MessagesPage() {
  const { t } = useT();
  const [convos, setConvos] = useState<Conversation[]>(loadConvos);
  const [activeId, setActiveId] = useState(convos[0]?.id);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const active = convos.find(c => c.id === activeId);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(convos)); }, [convos]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeId, active?.messages.length]);

  function send() {
    if (!input.trim() || !activeId) return;
    const msg: Message = { id: Date.now().toString(), text: input.trim(), from: "me", time: new Date().toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }) };
    setConvos(cs => cs.map(c => c.id === activeId ? { ...c, messages: [...c.messages, msg] } : c));
    setInput("");
    const replies = ["Tushundim, rahmat!", "Xabaringiz uchun rahmat.", "Albatta ko'rib chiqamiz.", "Yaxshi, ma'lumot uchun rahmat."];
    setTimeout(() => {
      const reply: Message = { id: Date.now().toString() + "r", text: replies[Math.floor(Math.random() * replies.length)], from: "them", time: new Date().toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }) };
      setConvos(cs => cs.map(c => c.id === activeId ? { ...c, messages: [...c.messages, reply] } : c));
    }, 1200);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader eyebrow={t.nav.messages} title={t.nav.messages} description="O'qituvchilar va maktab bilan aloqa" />
      <div className="flex flex-1 gap-3 min-h-0 mt-4">
        <aside className="w-64 shrink-0 flex flex-col rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          {convos.map(c => {
            const last = c.messages[c.messages.length - 1];
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={cn("w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-border/50",
                  activeId === c.id ? "bg-primary/10" : "hover:bg-muted/50")}>
                <div className="relative shrink-0">
                  <div className="h-9 w-9 rounded-full bg-primary/20 grid place-items-center text-xs font-bold text-primary">{c.avatar}</div>
                  {c.online && <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{last?.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{last?.text}</p>
                </div>
              </button>
            );
          })}
        </aside>
        {active && (
          <div className="flex-1 flex flex-col rounded-2xl border border-border bg-card shadow-soft overflow-hidden min-w-0">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="h-8 w-8 rounded-full bg-primary/20 grid place-items-center text-xs font-bold text-primary">{active.avatar}</div>
              <div>
                <p className="font-semibold text-sm">{active.name}</p>
                <p className="text-xs text-muted-foreground">{active.role} · {active.online ? "Online" : "Offline"}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {active.messages.map(m => (
                <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                    m.from === "me" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm")}>
                    <p>{m.text}</p>
                    <p className={cn("text-[10px] mt-0.5", m.from === "me" ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>{m.time}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="px-4 py-3 border-t border-border flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
                placeholder="Xabar yozing..." className="flex-1" />
              <Button size="icon" onClick={send} disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
