import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-app-gradient">
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/auth/login" className="outline-none">
          <Logo showWordmark size="md" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Yordam kerakmi?</span>
          <a
            href="mailto:yordam@academixai.uz"
            className="hidden text-foreground hover:text-primary sm:inline"
          >
            yordam@academixai.uz
          </a>
          <ThemeToggle className="ml-2" />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-col px-6 pb-16 pt-6 sm:pt-10">
        <Outlet />
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-md px-6 pb-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AcademiXAI · O'zbekiston ta'lim tizimi uchun
      </footer>
    </div>
  );
}
