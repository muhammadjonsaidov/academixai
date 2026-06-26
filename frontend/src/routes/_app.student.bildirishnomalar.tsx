import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CheckCheck, GraduationCap, Sparkles, AlertTriangle, Trophy } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { getNotifications, markNotificationRead, type AppNotification } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/student/bildirishnomalar")({
  head: () => ({ meta: [{ title: "Bildirishnomalar · AcademiXAI" }] }),
  component: NotificationsPage,
});

const typeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  weekly_report:  { icon: Sparkles, color: "text-primary", label: "Haftalik hisobot" },
  monthly_report: { icon: Sparkles, color: "text-secondary", label: "Oylik hisobot" },
  exam_result:    { icon: GraduationCap, color: "text-success", label: "Imtihon natijasi" },
  milestone:      { icon: Trophy, color: "text-amber-500", label: "Yutuq" },
  alert:          { icon: AlertTriangle, color: "text-warning", label: "Ogohlantirish" },
  parent_report:  { icon: Bell, color: "text-muted-foreground", label: "Hisobot" },
};

function NotificationCard({ n }: { n: AppNotification }) {
  const qc = useQueryClient();
  const { mutate: markRead } = useMutation({
    mutationFn: () => markNotificationRead(n.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const cfg = typeConfig[n.type] ?? typeConfig.alert;
  const Icon = cfg.icon;

  return (
    <article
      className={cn(
        "flex gap-4 rounded-2xl border p-5 transition-colors",
        n.isRead ? "border-border bg-card" : "border-primary/20 bg-primary/5",
      )}
    >
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted", cfg.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {cfg.label}
            </span>
            <p className="font-display font-semibold">{n.title}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{uzDate(n.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{n.body}</p>
        {!n.isRead && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 h-7 text-xs"
            onClick={() => markRead()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            O'qildi deb belgilash
          </Button>
        )}
      </div>
      {!n.isRead && (
        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </article>
  );
}

function NotificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bildirishnomalar"
        title={unread > 0 ? `${unread} ta yangi xabar` : "Bildirishnomalar"}
        description="Haftalik hisobotlar, imtihon natijalari va AI tizim xabarlari."
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <BellRing className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">Bildirishnoma yo'q</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Imtihon topshirsangiz yoki haftalik hisobot tayyor bo'lsa bu yerda ko'rinadi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotificationCard key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  );
}
