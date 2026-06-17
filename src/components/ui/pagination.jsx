import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, totalPages, onPageChange, className }) {
  if (!totalPages || totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const delta = 1;
    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const btn = "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-colors";

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className={cn(btn, "text-zinc-400 dark:text-white/30 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed")}
        aria-label="First page"
      ><ChevronsLeft className="w-4 h-4" /></button>

      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(btn, "text-zinc-400 dark:text-white/30 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed")}
        aria-label="Previous page"
      ><ChevronLeft className="w-4 h-4" /></button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="w-8 text-center text-sm text-zinc-400 dark:text-white/20 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(btn, p === page
              ? "text-white shadow-sm shadow-red-600/20"
              : "text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
            )}
            style={p === page ? { background: "linear-gradient(135deg,#ef4136,#fbb040)" } : {}}
            aria-current={p === page ? "page" : undefined}
          >{p}</button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(btn, "text-zinc-400 dark:text-white/30 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed")}
        aria-label="Next page"
      ><ChevronRight className="w-4 h-4" /></button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        className={cn(btn, "text-zinc-400 dark:text-white/30 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed")}
        aria-label="Last page"
      ><ChevronsRight className="w-4 h-4" /></button>
    </div>
  );
}
