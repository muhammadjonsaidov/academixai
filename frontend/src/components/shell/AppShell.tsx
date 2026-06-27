import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/lib/auth";
import { useNavigation } from "@/lib/navigation";
import { useRouterState } from "@tanstack/react-router";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sections: navByRole } = useNavigation();

  useEffect(() => setOpen(false), [pathname]);

  if (!user) return null;
  const sections = navByRole[user.role as keyof typeof navByRole] ?? [];

  return (
    <div className="flex min-h-screen bg-background bg-app-gradient">
      <Sidebar sections={sections} role={user.role} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenSidebar={() => setOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        <footer className="border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} AcademiXAI · O'zbekiston ta'lim tizimi uchun yaratilgan
        </footer>
      </div>
    </div>
  );
}
