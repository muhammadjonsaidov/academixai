import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Search, Circle } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/messages")({
  head: () => ({ meta: [{ title: "Xabarlar · AcademiXAI" }] }),
  component: MessagesPage,
});

interface Message { id: string; text: string; from: "me" | "them"; time: string; }
interface Conversation {
  id: string; name: string; avatar: string; role: string; online: boolean;
  messages: Message[];
}

const SEED: Conversation[] = [
  {
    id: "1", name: "Aziz Karimov", avatar: "AK", role: "O'quvchi", online: true,
    messages: [
      { id: "1a", text: "Assalomu alaykum, o'qituvchi!", from: "them", time: "09:10" },
      { id: "1b", text: "Vaalaykum assalom, Aziz!", from: "me", time: "09:12" },
      { id: "1c", text: "Bugungi uy vazifani tushunmadim, yordam bera olasizmi?", from: "them", time: "09:13" },
      { id: "1d", text: "Albatta, qaysi masalani?", from: "me", time: "09:15" },
      { id: "1e", text: "3-topshiriq, kvadrat tenglamalar bo'yicha", from: "them", time: "09:16" },
    ],
  },
  {
    id: "2", name: "Malika Yusupova", avatar: "MY", role: "O'quvchi", online: false,
    messages: [
      { id: "2a", text: "O'qituvchi, imtihon qachon bo'ladi?", from: "them", time: "Kecha" },
      { id: "2b", text: "Kelasi juma — 5-iyul", from: "me", time: "Kecha" },
      { id: "2c", text: "Rahmat!", from: "them", time: "Kecha" },
    ],
  },
  {
    id: "3", name: "Bobur Toshmatov", avatar: "BT", role: "Ota-ona", online: true,
    messages: [
      { id: "3a", text: "Salom, farzandimning davomat haqida gaplashsam bo'ladimi?", from: "them", time: "10:30" },
      { id: "3b", text: "Ha, albatta. Bobir bu hafta 2 kun kelmadi.", from: "me", time: "10:35" },
      { id: "3c", text: "Kasal edi, keyingi hafta keladi.", from: "them", time: "10:36" },
    ],
  },
  {
    id: "4", name: "Sardor Nazarov", avatar: "SN", role: "O'quvchi", online: false,
    messages: [
      { id: "4a", text: "Baholash mezonlari haqida savolim bor edi", from: "them", time: "Kecha" },
      { id: "4b", text: "Turing, ertaga tushuntiraman", from: "me", time: "Kecha" },
    ],
  },
  {
    id: "5", name: "Nodira Rahimova", avatar: "NR", role: "O'qituvchi", online: true,
    messages: [
      { id: "5a", text: "Collegam, ertangi seminar haqida eslatib qo'ydim", from: "them", time: "11:00" },
      { id: "5b", text: "Rahmat, yodimda!", from: "me", time: "11:05" },
    ],
  },
];

const LS_KEY = "academix_messages";

function loadConvos(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "null") ?? SEED; } catch { return SEED; }
}

function MessagesPage() {
  const { t } = useT();
  const [convos, setConvos] = useState<Conversation[]>(loadConvos);
  const [activeId, setActiveId] = useState(convos[0]?.id);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = convos.find(c => c.id === activeId);
  const filtered = convos.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(convos)); }, [convos]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeId, active?.messages.length]);

  function send() {
    if (!input.trim() || !activeId) return;
    const msg: Message = { id: Date.now().toString(), text: input.trim(), from: "me", time: new Date().toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }) };
    setConvos(cs => cs.map(c => c.id === activeId ? { ...c, messages: [...c.messages, msg] } : c));
    setInput("");
    // Auto-reply after 1s
    const replies = ["Tushundim, rahmat!", "Yaxshi, ko'rib chiqaman.", "Ha, albatta!", "OK, xabar beraman."];
    setTimeout(() => {
      const reply: Message = { id: Date.now().toString() + "r", text: replies[Math.floor(Math.random() * replies.length)], from: "them", time: new Date().toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }) };
      setConvos(cs => cs.map(c => c.id === activeId ? { ...c, messages: [...c.messages, reply] } : c));
    }, 1000 + Math.random() * 1000);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader eyebrow={t.nav.messages} title={t.nav.messages} description="O'quvchilar va ota-onalar bilan muloqot" />

      <div className="flex flex-1 gap-3 min-h-0 mt-4">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 flex flex-col rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-sm" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => {
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
          </div>
        </aside>

        {/* Chat */}
        {active ? (
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
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Xabar yozing..."
                className="flex-1"
              />
              <Button size="icon" onClick={send} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center rounded-2xl border border-border bg-card shadow-soft">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Suhbat tanlang</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
