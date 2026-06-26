import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import type { NavSection } from "@/lib/navigation";
import { roleLabel } from "@/lib/navigation";
import type { UserRole } from "@/lib/auth";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  sections: NavSection[];
  role: UserRole;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ sections, role, open, onClose }: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const content = (
    <>
      <div className="flex h-16 items-center justify-between px-5">
        <Link to="/" className="outline-none" onClick={onClose}>
          <Logo showWordmark size="md" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onClose}
          aria-label="Yopish"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="border-t border-sidebar-border" />

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 scrollbar-thin">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.label && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.to === pathname ||
                  (item.to !== `/${role}` && pathname.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                            active
                              ? "bg-white/15 text-primary-foreground"
                              : "bg-accent/40 text-accent-foreground",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/15 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {roleLabel(role)}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            AI Ustoz 24/7 hizmatingizda
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Har qanday savol bilan murojaat qiling.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:translate-x-0 lg:border-r lg:border-sidebar-border",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {content}
      </aside>
    </>
  );
}
