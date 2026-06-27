import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { uploadAvatar } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  avatarUrl?: string | null;
  initials: string;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

const sizes = {
  sm: { outer: "h-8 w-8", text: "text-sm", camera: "h-5 w-5 -bottom-0.5 -right-0.5", icon: "h-2.5 w-2.5" },
  md: { outer: "h-16 w-16", text: "text-xl", camera: "h-6 w-6 -bottom-1 -right-1", icon: "h-3 w-3" },
  lg: { outer: "h-24 w-24", text: "text-2xl", camera: "h-8 w-8 -bottom-1 -right-1", icon: "h-4 w-4" },
};

export function AvatarUpload({ avatarUrl, initials, size = "lg", editable = true }: Props) {
  const s = sizes[size];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Fayl 3MB dan kichik bo'lishi kerak"); return; }
    setUploading(true);
    try {
      await uploadAvatar(file);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["teacher-profile"] });
      qc.invalidateQueries({ queryKey: ["admin-profile"] });
      qc.invalidateQueries({ queryKey: ["parent-profile"] });
      toast.success("Rasm yuklandi");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Yuklashda xato");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("relative mx-auto shrink-0", s.outer)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="avatar"
          className={cn("h-full w-full rounded-full object-cover border-2 border-border", uploading && "opacity-50")}
        />
      ) : (
        <div className={cn("grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 font-display font-semibold text-primary border-2 border-border", s.text, uploading && "opacity-50")}>
          {initials}
        </div>
      )}

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
          <Loader2 className={cn("animate-spin text-white", s.icon)} />
        </div>
      )}

      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "absolute grid place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground hover:scale-105 transition-transform disabled:opacity-50",
              s.camera,
            )}
            aria-label="Rasmni o'zgartirish"
          >
            <Camera className={s.icon} />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </>
      )}
    </div>
  );
}
