import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const { t } = useT();
  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-app-gradient">
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/auth/login" className="outline-none">
          <Logo showWordmark size="md" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{t.auth.helpNeeded}</span>
          <a
            href={`mailto:${t.auth.helpEmail}`}
            className="hidden text-foreground hover:text-primary sm:inline"
          >
            {t.auth.helpEmail}
          </a>
          <ThemeToggle className="ml-2" />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-col px-6 pb-16 pt-6 sm:pt-10">
        <Outlet />
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-md px-6 pb-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AcademiXAI · {t.auth.copyright}
      </footer>
    </div>
  );
}
