import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CheckCheck, GraduationCap, Sparkles, AlertTriangle, Trophy } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { getNotifications, markNotificationRead, type AppNotification } from "@/lib/api";
import { uzDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_app/student/notifications")({
  head: () => ({ meta: [{ title: "Bildirishnomalar · AcademiXAI" }] }),
  component: NotificationsPage,
});

function useTypeConfig() {
  const { t } = useT();
  return {
    weekly_report:  { icon: Sparkles,      color: "text-primary",          label: t.notifications.types.weekly_report },
    monthly_report: { icon: Sparkles,      color: "text-secondary",        label: t.notifications.types.monthly_report },
    exam_result:    { icon: GraduationCap, color: "text-success",          label: t.notifications.types.exam_result },
    milestone:      { icon: Trophy,        color: "text-amber-500",        label: t.notifications.types.milestone },
    alert:          { icon: AlertTriangle, color: "text-warning",          label: t.notifications.types.alert },
    parent_report:  { icon: Bell,          color: "text-muted-foreground", label: t.notifications.types.parent_report },
  };
}

function NotificationCard({ n }: { n: AppNotification }) {
  const qc = useQueryClient();
  const { t } = useT();
  const typeConfig = useTypeConfig();
  const { mutate: markRead } = useMutation({
    mutationFn: () => markNotificationRead(n.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const cfg = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.alert;
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
            {t.action.markRead}
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
  const { t } = useT();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t.notifications.title}
        title={unread > 0 ? t.notifications.unread(unread) : t.notifications.title}
        description={t.notifications.description}
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <BellRing className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">{t.notifications.noNotifications}</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t.notifications.noNotificationsDesc}
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
