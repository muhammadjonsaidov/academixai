import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { Logo } from "@/components/brand/Logo";
import { useAuth, dashboardPathForRole, type UserRole } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate({ to: "/auth/login", search: { redirect: pathname } as never });
      return;
    }
    // URL boshlanmasi foydalanuvchi roliga mos kelmasa, to'g'ri dashboardga yo'naltir
    const segments = pathname.split("/").filter(Boolean);
    const urlRole = segments[0] as UserRole | undefined;
    const validRoles: UserRole[] = ["student", "parent", "teacher", "admin"];
    if (urlRole && validRoles.includes(urlRole) && urlRole !== user.role) {
      navigate({ to: dashboardPathForRole(user.role) });
    }
  }, [user, isLoading, navigate, pathname]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background bg-app-gradient">
        <Logo size="lg" />
        <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
