import { Bell, LogOut, Menu, Search, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

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
import { roleLabel, navForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onOpenSidebar: () => void;
}

const breadcrumbLabelMap: Record<string, string> = {
  student: "O'quvchi",
  parent: "Ota-ona",
  teacher: "O'qituvchi",
  admin: "Maktab admini",
  "ai-ustoz": "AI Ustoz",
  "ai-yordamchi": "AI Yordamchi",
  "ai-hisobot": "AI Hisobot",
  "ai-tavsiyalar": "AI Tavsiyalar",
  topshiriqlar: "Topshiriqlar",
  imtihonlar: "Imtihonlar",
  eslatmalar: "Eslatmalar",
  yutuqlar: "Yutuqlar",
  "kasbiy-yol": "Kasbiy yo'l",
  profil: "Profil",
  sozlamalar: "Sozlamalar",
  farzandim: "Farzandim",
  ozlashtirish: "O'zlashtirish",
  xabarlar: "Xabarlar",
  oquvchilar: "O'quvchilar",
  oqituvchilar: "O'qituvchilar",
  davomat: "Davomat",
  hisobotlar: "Hisobotlar",
  kalendar: "Kalendar",
  sinflar: "Sinflar",
  analitika: "Analitika",
  elonlar: "E'lonlar",
};

const demoNotifications = [
  {
    id: "n1",
    title: "Algebra topshirig'i muddati yaqinlashmoqda",
    description: "27-iyun, 18:00 gacha topshirilishi kerak.",
    time: "5 daqiqa oldin",
    unread: true,
  },
  {
    id: "n2",
    title: "Yangi imtihon natijasi e'lon qilindi",
    description: "Fizika nazorat ishi — 87/100 ball.",
    time: "1 soat oldin",
    unread: true,
  },
  {
    id: "n3",
    title: "AI Ustoz haftalik hisoboti tayyor",
    description: "Sizning kuchli va zaif tomonlaringizni ko'ring.",
    time: "Bugun, 09:24",
    unread: false,
  },
];

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

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
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((p, i) => ({
      label: breadcrumbLabelMap[p] ?? p,
      path: "/" + parts.slice(0, i + 1).join("/"),
    }));
  }, [pathname]);

  const sections = user ? navForRole(user.role) : [];
  const searchResults = useMemo(() => {
    if (!query.trim()) return sections.flatMap((s) => s.items);
    const q = query.toLowerCase();
    return sections.flatMap((s) => s.items).filter((i) => i.label.toLowerCase().includes(q));
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
              <Button variant="ghost" size="icon" className="relative" aria-label="Bildirishnomalar">
                <Bell className="h-[1.15rem] w-[1.15rem]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="font-semibold">Bildirishnomalar</p>
                <button className="text-xs font-medium text-primary hover:underline">
                  Hammasini ko'rish
                </button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {demoNotifications.map((n) => (
                  <li
                    key={n.id}
                    className="flex gap-3 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.unread ? "bg-primary" : "bg-transparent",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.description}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>

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
                  {roleLabel(user.role)}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/${user.role}/profil`} className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/${user.role}/sozlamalar`} className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" /> Sozlamalar
                </Link>
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
