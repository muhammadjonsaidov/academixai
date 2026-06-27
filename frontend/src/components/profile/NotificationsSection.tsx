import { Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import {
  getPreferences,
  updatePreferences,
  getVapidPublicKey,
  subscribePush,
  type NotifPrefs,
  type PushSubscriptionPayload,
} from "@/lib/api";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import { useT } from "@/lib/i18n";

export function NotificationsSection() {
  const { t } = useT();
  const s = t.settings;
  const qc = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: ["user-prefs"],
    queryFn: getPreferences,
  });

  const { data: vapidData } = useQuery({
    queryKey: ["vapid-key"],
    queryFn: getVapidPublicKey,
    retry: false,
    staleTime: Infinity,
  });

  const mut = useMutation({
    mutationFn: (p: Partial<NotifPrefs>) => updatePreferences(p),
    onSuccess: (updated) => {
      qc.setQueryData(["user-prefs"], updated);
    },
    onError: () => toast.error(t.error.saveFailed),
  });

  async function handlePushToggle(enabled: boolean) {
    if (enabled) {
      if (!("Notification" in window)) {
        toast.error("Bu brauzer push bildirishnomalarini qo'llab-quvvatlamaydi");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Push bildirishnomalariga ruxsat berilmadi");
        return;
      }
      if (vapidData?.publicKey && vapidData.enabled) {
        const sub = await subscribeToPush(vapidData.publicKey);
        if (sub) {
          const json = sub.toJSON() as PushSubscriptionPayload;
          await subscribePush(json).catch(() => null);
        }
      }
    } else {
      await unsubscribeFromPush();
    }
    mut.mutate({ pushNotif: enabled });
  }

  const rows: Array<{
    key: keyof NotifPrefs;
    title: string;
    desc: string;
    onChange: (v: boolean) => void;
  }> = [
    {
      key: "emailNotif",
      title: s.emailNotif,
      desc: s.emailNotifDesc,
      onChange: (v) => mut.mutate({ emailNotif: v }),
    },
    {
      key: "pushNotif",
      title: s.pushNotif,
      desc: s.pushNotifDesc,
      onChange: handlePushToggle,
    },
    {
      key: "weeklyReport",
      title: s.weeklyReport,
      desc: s.weeklyReportDesc,
      onChange: (v) => mut.mutate({ weeklyReport: v }),
    },
    {
      key: "aiTips",
      title: s.aiTips,
      desc: s.aiTipsDesc,
      onChange: (v) => mut.mutate({ aiTips: v }),
    },
  ];

  if (!prefs) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <header className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">{s.notifications}</h3>
      </header>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-4 py-3.5">
            <div>
              <p className="text-sm font-medium">{row.title}</p>
              <p className="text-xs text-muted-foreground">{row.desc}</p>
            </div>
            <Switch
              checked={prefs[row.key] ?? true}
              onCheckedChange={row.onChange}
              disabled={mut.isPending}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
