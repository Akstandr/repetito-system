import { ArrowLeft, CheckCircle2, LogOut } from "lucide-react";

export function AccountHeader({
  displayName,
  activeAccountLabel,
  onBack,
  onProfile,
  onLogout,
}: {
  displayName: string;
  activeAccountLabel: string;
  onBack: () => void;
  onProfile: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft size={16} />
          На главную
        </button>

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground sm:inline-flex">
          <CheckCircle2 size={15} />
          {activeAccountLabel}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onProfile}
            className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition hover:bg-secondary/80"
          >
            {displayName}
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Выйти из аккаунта"
            title="Выйти из аккаунта"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
