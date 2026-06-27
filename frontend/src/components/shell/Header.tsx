import { Bell, LogOut, Menu, Search, User as UserIcon, Settings as SettingsIcon, Globe } from "lucide-react";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNotifications, markNotificationRead, type AppNotification } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { useNavigation, type NavSection, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useT, type Lang } from "@/lib/i18n";

interface HeaderProps {
  onOpenSidebar: () => void;
}

const breadcrumbLabelMap: Record<string, string> = {
  student: "O'quvchi",
  parent: "Ota-ona",
  teacher: "O'qituvchi",
  admin: "Maktab admini",
  "ai-tutor": "AI Ustoz",
  "ai-assistant": "AI Yordamchi",
  "ai-report": "AI Hisobot",
  "ai-suggestions": "AI Tavsiyalar",
  assignments: "Topshiriqlar",
  exams: "Imtihonlar",
  notes: "Eslatmalar",
  achievements: "Yutuqlar",
  career: "Kasbiy yo'l",
  profile: "Profil",
  settings: "Sozlamalar",
  child: "Farzandim",
  progress: "O'zlashtirish",
  messages: "Xabarlar",
  students: "O'quvchilar",
  teachers: "O'qituvchilar",
  parents: "Ota-onalar",
  attendance: "Davomat",
  reports: "Hisobotlar",
  calendar: "Kalendar",
  classes: "Sinflar",
  analytics: "Analitika",
  announcements: "E'lonlar",
  notifications: "Bildirishnomalar",
  courses: "Kurslar",
  lessons: "Darslar",
  "lesson-draft": "Dars loyihasi",
};


const LANG_FLAGS: Record<Lang, string> = { uz: "🇺🇿", en: "🇬🇧", ru: "🇷🇺" };

function LangSwitcher() {
  const { lang, setLang, t } = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.settings.language} title={t.settings.language}>
          <Globe className="h-[1.15rem] w-[1.15rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {(["uz", "en", "ru"] as Lang[]).map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className={cn("gap-2", lang === l && "text-primary font-semibold")}
          >
            <span>{LANG_FLAGS[l]}</span>
            {l === "uz" ? "O'zbek" : l === "en" ? "English" : "Русский"}
            {lang === l && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { t } = useT();
  const { sections: navByRole, roleLabel: roleLabelMap } = useNavigation();

  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30_000,
    enabled: !!user,
  });
  const notifications: AppNotification[] = notifData?.notifications ?? [];
  const unreadCount = notifData?.unreadCount ?? 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const crumbs = useMemo(() => {
    const n = t.nav;
    const labelMap: Record<string, string> = {
      student: n.home, parent: n.home, teacher: n.home, admin: n.home,
      "ai-tutor": n.aiTutor, "ai-assistant": n.aiAssistant,
      "ai-report": n.aiReport, "ai-suggestions": n.aiSuggestions,
      assignments: n.assignments, exams: n.exams, notes: n.notes,
      achievements: n.achievements, career: n.career, profile: n.profile,
      settings: n.settings, child: n.myChild, progress: n.progress,
      messages: n.messages, students: n.students, teachers: n.teachers,
      attendance: n.attendance, reports: n.reports, calendar: n.calendar,
      classes: n.classes, analytics: n.analytics, announcements: n.announcements,
      notifications: n.notifications, courses: n.courses, labs: n.labs,
      dashboard: n.dashboard, "lesson-draft": "Dars loyihasi",
    };
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((p, i) => ({
      label: labelMap[p] ?? p,
      path: "/" + parts.slice(0, i + 1).join("/"),
    }));
  }, [pathname, t]);

  const sections: NavSection[] = user ? (navByRole[user.role] ?? []) : [];
  const searchResults = useMemo(() => {
    if (!query.trim()) return sections.flatMap((s: NavSection) => s.items);
    const q = query.toLowerCase();
    return sections.flatMap((s: NavSection) => s.items).filter((i: NavItem) => i.label.toLowerCase().includes(q));
  }, [query, sections]);

  function handleLogout() {
    logout();
    navigate({ to: "/auth/login" });
  }

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Menyuni ochish"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb (desktop) */}
        <nav className="hidden min-w-0 flex-1 items-center gap-1.5 text-sm md:flex">
          {crumbs.map((c, i) => (
            <div key={c.path} className="flex items-center gap-1.5 truncate">
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              {i === crumbs.length - 1 ? (
                <span className="truncate font-medium text-foreground">{c.label}</span>
              ) : (
                <Link to={c.path} className="truncate text-muted-foreground hover:text-foreground">
                  {c.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1.5 md:flex-none">
          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "h-9 min-w-0 justify-start gap-2 px-3 text-sm font-normal text-muted-foreground",
              "w-9 sm:w-64 lg:w-72",
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden truncate sm:inline">Sahifa yoki funksiya qidirish...</span>
            <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono sm:inline">
              ⌘K
            </kbd>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label={t.nav.notifications}>
                <Bell className="h-[1.15rem] w-[1.15rem]" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="font-semibold">{t.nav.notifications}</p>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    {unreadCount}
                  </span>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Bildirishnomalar yo'q
                  </li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => !n.isRead && markNotificationRead(n.id)}
                      className="flex cursor-pointer gap-3 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-muted/40"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          !n.isRead ? "bg-primary" : "bg-transparent",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {n.createdAt ? n.createdAt.slice(0, 16).replace("T", " ") : ""}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </PopoverContent>
          </Popover>

          <LangSwitcher />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-1 flex h-9 items-center gap-2 rounded-full border border-border bg-card pl-1 pr-3 transition-colors hover:bg-muted/60"
                aria-label="Profil menyusi"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </span>
                <span className="hidden text-sm font-medium sm:inline">
                  {user.fullName.split(" ")[0]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-primary">
                  {roleLabelMap[user.role]}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={`/${user.role}/profile`} className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Profil
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/${user.role}/settings`} className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" /> Sozlamalar
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Tizimdan chiqish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-[20%] max-w-lg translate-y-0 p-0">
          <DialogTitle className="sr-only">Qidiruv</DialogTitle>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sahifa yoki bo'limni qidiring..."
                className="h-11 border-0 pl-9 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
          <ul className="max-h-80 overflow-y-auto p-2">
            {searchResults.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground">
                Hech narsa topilmadi
              </li>
            ) : (
              searchResults.map((r) => {
                const Icon = r.icon;
                return (
                  <li key={r.to}>
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery("");
                        navigate({ to: r.to });
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.to}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </header>
  );
}
