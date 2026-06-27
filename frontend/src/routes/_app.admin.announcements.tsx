import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Plus, Trash2, Megaphone } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/admin/announcements")({
  head: () => ({ meta: [{ title: "E'lonlar · AcademiXAI" }] }),
  component: AnnouncementsPage,
});

const TARGET_OPTS = [
  { value: "ALL", label: "Barchaga" },
  { value: "STUDENT", label: "O'quvchilar" },
  { value: "TEACHER", label: "O'qituvchilar" },
  { value: "PARENT", label: "Ota-onalar" },
];

function AnnouncementsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("ALL");
  const [showForm, setShowForm] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: getAnnouncements,
  });

  const addMut = useMutation({
    mutationFn: () => createAnnouncement(title, body, target),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setTitle(""); setBody(""); setTarget("ALL"); setShowForm(false);
      toast.success("E'lon qo'shildi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("E'lon o'chirildi");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={t.admin.announcements ?? "E'lonlar"}
        description="Maktab e'lonlarini boshqaring"
      />

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          <Plus className="h-4 w-4" />
          Yangi e'lon
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
          <p className="font-semibold text-sm flex items-center gap-2"><Megaphone className="h-4 w-4" /> Yangi e'lon</p>
          <div className="space-y-1.5">
            <Label>Sarlavha</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="E'lon sarlavhasi" />
          </div>
          <div className="space-y-1.5">
            <Label>Matn</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="E'lon matni..." rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label>Kimga</Label>
            <div className="flex gap-2 flex-wrap">
              {TARGET_OPTS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setTarget(o.value)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    target === o.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => addMut.mutate()}
              disabled={addMut.isPending || !title.trim() || !body.trim()}
            >
              {addMut.isPending ? "Saqlanmoqda…" : "Saqlash"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Yuklanmoqda…</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Bell className="h-10 w-10 opacity-30" />
          <p>Hozircha e'lon yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft flex gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{item.title}</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {TARGET_OPTS.find(o => o.value === item.target)?.label ?? item.target}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.body}</p>
                <p className="text-xs text-muted-foreground">{uzDate(item.createdAt)}</p>
              </div>
              <button
                onClick={() => delMut.mutate(item.id)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
