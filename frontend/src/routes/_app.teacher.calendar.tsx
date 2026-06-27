import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/teacher/calendar")({
  head: () => ({ meta: [{ title: "Kalendar · AcademiXAI" }] }),
  component: CalendarPage,
});

interface Event {
  id: string; date: string; title: string; time: string; location: string; color: string;
}

const COLORS = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500"];

function todayStr() { return new Date().toISOString().slice(0, 10); }
function pad(n: number) { return String(n).padStart(2, "0"); }

function makeSeed(): Event[] {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth();
  return [
    { id: "e1", date: `${y}-${pad(m+1)}-${pad(today.getDate())}`, title: "7-sinf Matematika darsi", time: "08:00", location: "306-sinf", color: "bg-blue-500" },
    { id: "e2", date: `${y}-${pad(m+1)}-${pad(today.getDate())}`, title: "8-sinf Algebra", time: "10:00", location: "306-sinf", color: "bg-green-500" },
    { id: "e3", date: `${y}-${pad(m+1)}-${pad(Math.min(today.getDate()+1,28))}`, title: "O'qituvchilar seminari", time: "14:00", location: "Aktlar zali", color: "bg-purple-500" },
    { id: "e4", date: `${y}-${pad(m+1)}-${pad(Math.min(today.getDate()+2,28))}`, title: "9-sinf Imtihon", time: "09:00", location: "308-sinf", color: "bg-red-500" },
    { id: "e5", date: `${y}-${pad(m+1)}-${pad(Math.min(today.getDate()+3,28))}`, title: "Ota-onalar yig'ilishi", time: "17:00", location: "Konferentsiya zali", color: "bg-orange-500" },
    { id: "e6", date: `${y}-${pad(m+1)}-${pad(Math.max(today.getDate()-1,1))}`, title: "Metodika kengashi", time: "13:00", location: "Director xonasi", color: "bg-purple-500" },
  ];
}

const LS_KEY = "academix_calendar";

function loadEvents(): Event[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "null") ?? makeSeed(); } catch { return makeSeed(); }
}

function CalendarPage() {
  const { t } = useT();
  const [events, setEvents] = useState<Event[]>(loadEvents);
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState(todayStr());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", time: "08:00", location: "", color: "bg-blue-500" });

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(events)); }, [events]);

  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Mon-first

  const monthStr = viewDate.toLocaleDateString("uz-Latn-UZ", { month: "long", year: "numeric" });
  const dayEvents = events.filter(e => e.date === selected).sort((a, b) => a.time.localeCompare(b.time));

  function prevMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function nextMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }

  function addEvent() {
    if (!form.title.trim()) return;
    const ev: Event = { id: Date.now().toString(), date: selected, ...form };
    setEvents(es => [...es, ev]);
    setForm({ title: "", time: "08:00", location: "", color: "bg-blue-500" });
    setShowForm(false);
  }

  function delEvent(id: string) { setEvents(es => es.filter(e => e.id !== id)); }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={t.nav.calendar} title={t.nav.calendar} description="Dars jadvali va tadbirlarni boshqarish" />

      <div className="flex gap-4">
        {/* Calendar grid */}
        <div className="flex-1 rounded-2xl border border-border bg-card shadow-soft p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <p className="font-semibold capitalize">{monthStr}</p>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const hasEvents = events.some(e => e.date === dateStr);
              const isToday = dateStr === todayStr();
              const isSelected = dateStr === selected;
              return (
                <button key={day} onClick={() => setSelected(dateStr)}
                  className={cn("aspect-square rounded-lg text-sm flex flex-col items-center justify-center transition-colors relative",
                    isSelected ? "bg-primary text-primary-foreground" :
                    isToday ? "border-2 border-primary text-primary" :
                    "hover:bg-muted/60")}>
                  {day}
                  {hasEvents && <div className={cn("absolute bottom-1 h-1 w-1 rounded-full", isSelected ? "bg-primary-foreground" : "bg-primary")} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day events */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="rounded-2xl border border-border bg-card shadow-soft p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">{new Date(selected + "T00:00").toLocaleDateString("uz-Latn-UZ", { weekday: "long", day: "numeric", month: "long" })}</p>
              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => setShowForm(v => !v)}>
                <Plus className="h-3 w-3" /> Qo'shish
              </Button>
            </div>

            {showForm && (
              <div className="mb-3 p-3 rounded-xl bg-muted/50 space-y-2">
                <Input className="h-7 text-xs" placeholder="Tadbir nomi" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <Input type="time" className="h-7 text-xs" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                <Input className="h-7 text-xs" placeholder="Joyi (ixtiyoriy)" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                <div className="flex gap-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={cn("h-5 w-5 rounded-full", c, form.color === c ? "ring-2 ring-offset-1 ring-foreground" : "")} />
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="flex-1 h-6 text-xs" onClick={addEvent} disabled={!form.title.trim()}>Saqlash</Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setShowForm(false)}>Bekor</Button>
                </div>
              </div>
            )}

            {dayEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Bu kun uchun tadbir yo'q</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2 p-2 rounded-xl bg-muted/50 group">
                    <div className={cn("w-1 self-stretch rounded-full shrink-0", ev.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><Clock className="h-2.5 w-2.5" />{ev.time}</span>
                        {ev.location && <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground truncate"><MapPin className="h-2.5 w-2.5" />{ev.location}</span>}
                      </div>
                    </div>
                    <button onClick={() => delEvent(ev.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
