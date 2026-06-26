import logoAsset from "@/assets/academixai-logo.svg.asset.json";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
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
      <img
        src={logoAsset.url}
        alt="AcademiXAI"
        className={cn(sizeMap[size], "shrink-0 object-contain")}
        draggable={false}
      />
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
