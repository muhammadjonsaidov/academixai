import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface Props {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: Props) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
        "prose-headings:font-semibold prose-headings:my-2",
        "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
        "prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-3",
        "prose-hr:my-2 prose-strong:font-semibold",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
