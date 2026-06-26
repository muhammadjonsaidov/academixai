import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-7 w-7 text-sm",
  md: "h-9 w-9 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-2xl",
};

const textSizeMap = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function Logo({ className, showWordmark = false, size = "md" }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/70 font-display font-bold text-primary-foreground grid place-items-center",
          sizeMap[size],
        )}
      >
        A
      </div>
      {showWordmark && (
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            textSizeMap[size],
          )}
        >
          AcademiX<span className="text-primary">AI</span>
        </span>
      )}
    </div>
  );
}
