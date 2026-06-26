import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-app-gradient px-4">
      <div className="max-w-md text-center">
        <p className="font-display text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
          Sahifa topilmadi
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Siz qidirgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-app-gradient px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Sahifa yuklanmadi
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Texnik nosozlik yuz berdi. Iltimos, qayta urinib ko'ring yoki bosh sahifaga qayting.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Qayta urinish
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Bosh sahifa
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AcademiXAI — O'zbekiston uchun AI asosidagi ta'lim platformasi" },
      {
        name: "description",
        content:
          "AcademiXAI — o'quvchilar, ota-onalar, o'qituvchilar va maktab administratorlari uchun 24/7 ishlovchi AI asosidagi zamonaviy ta'lim ekotizimi.",
      },
      { name: "theme-color", content: "#4355DB" },
      { property: "og:title", content: "AcademiXAI — O'zbekiston uchun AI asosidagi ta'lim platformasi" },
      { property: "og:description", content: "O'quv Markazi AI, O'zbekiston ta'lim tizimi uchun shaxsiy AI o'qituvchi va boshqaruv tizimi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "AcademiXAI — O'zbekiston uchun AI asosidagi ta'lim platformasi" },
      { name: "description", content: "O'quv Markazi AI, O'zbekiston ta'lim tizimi uchun shaxsiy AI o'qituvchi va boshqaruv tizimi." },
      { name: "twitter:description", content: "O'quv Markazi AI, O'zbekiston ta'lim tizimi uchun shaxsiy AI o'qituvchi va boshqaruv tizimi." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
