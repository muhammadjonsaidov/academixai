import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, pageSize = 20, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const start = Math.max(0, page - 2);
  const end = Math.min(totalPages, page + 3);
  const pages = Array.from({ length: end - start }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-muted-foreground">
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)}{" "}
        <span className="text-muted-foreground/60">/ {total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {start > 0 && (
          <>
            <Button variant="outline" size="sm" className="h-8 w-8 px-0" onClick={() => onChange(0)}>1</Button>
            {start > 1 && <span className="px-1 text-muted-foreground">…</span>}
          </>
        )}
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 px-0"
            onClick={() => onChange(p)}
          >
            {p + 1}
          </Button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-muted-foreground">…</span>}
            <Button variant="outline" size="sm" className="h-8 w-8 px-0" onClick={() => onChange(totalPages - 1)}>
              {totalPages}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page === totalPages - 1}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
