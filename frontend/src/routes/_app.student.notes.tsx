import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookMarked, NotebookPen, Plus, Search, Trash2, X } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getNotes, createNote, deleteNote } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/notes")({
  head: () => ({ meta: [{ title: "Eslatmalar · AcademiXAI" }] }),
  component: NotesPage,
});

function NotesPage() {
  const qc = useQueryClient();
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: getNotes,
  });

  const addMutation = useMutation({
    mutationFn: () => createNote(draft.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      setDraft("");
      setCreating(false);
      toast.success(t.notes.saved);
    },
    onError: () => toast.error(t.error.generic),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success(t.notes.delete);
    },
    onError: () => toast.error(t.error.deleteFailed),
  });

  const filtered = notes.filter((n) =>
    !query || n.content.toLowerCase().includes(query.toLowerCase()) ||
    (n.lessonTitle ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.notes.title}
        description={t.notes.description}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t.notes.add}
          </Button>
        }
      />

      {/* New note form */}
      {creating && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-soft">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Yangi eslatma</p>
            <button onClick={() => { setCreating(false); setDraft(""); }} className="rounded-lg p-1 hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <textarea
            autoFocus
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.notes.placeholder}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setCreating(false); setDraft(""); }}>
              {t.action.cancel}
            </Button>
            <Button size="sm" disabled={!draft.trim() || addMutation.isPending} onClick={() => addMutation.mutate()}>
              <BookMarked className="h-3.5 w-3.5" />
              {t.action.save}
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Eslatmalar orasida qidirish..."
          className="h-10 pl-9 sm:max-w-xs"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-center rounded-2xl border border-border bg-card">
          <NotebookPen className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {notes.length === 0 ? t.notes.noNotes : t.action.search}
          </p>
          {notes.length === 0 && (
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              Birinchi eslatma qo'shish
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <article key={n.id} className="group relative rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-elevated">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <NotebookPen className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-medium text-primary">Eslatma</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{uzDate(new Date(n.createdAt))}</span>
                  <button
                    onClick={() => deleteMutation.mutate(n.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    aria-label="O'chirish"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {n.lessonTitle && (
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  📖 {n.lessonTitle}
                </p>
              )}

              <p className="mt-2 line-clamp-5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {n.content}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
