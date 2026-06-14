import { ChevronLeft, ChevronRight } from "lucide-react";

export function AdminPagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-end gap-3">
      <button type="button" aria-label="Предыдущая страница" disabled={page <= 1} onClick={() => onChange(page - 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border transition hover:bg-secondary disabled:opacity-40">
        <ChevronLeft size={17} />
      </button>
      <span className="text-sm text-muted-foreground">{page} из {totalPages}</span>
      <button type="button" aria-label="Следующая страница" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border transition hover:bg-secondary disabled:opacity-40">
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
