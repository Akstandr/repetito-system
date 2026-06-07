import { ArrowLeft, CheckCircle2, LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "../../../shared/ThemeToggle";

export function AccountHeader({
  displayName,
  activeAccountLabel,
  onBack,
  onProfile,
  onLogout,
  onMenuToggle,
}: {
  displayName: string;
  activeAccountLabel: string;
  onBack: () => void;
  onProfile: () => void;
  onLogout: () => void;
  onMenuToggle?: () => void;
}) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:relative sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-0">
        <div className="flex min-w-0 items-center gap-1">
          {onMenuToggle ? (
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Открыть меню личного кабинета"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:hidden"
            >
              <Menu size={17} />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:px-3"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">На главную</span>
            <span className="sm:hidden">Назад</span>
          </button>
        </div>

        <div className="order-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground sm:absolute sm:left-1/2 sm:top-1/2 sm:order-none sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2">
          <CheckCircle2 size={15} />
          {activeAccountLabel}
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={onProfile}
            className="max-w-[32vw] truncate rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition hover:bg-secondary/80 sm:max-w-64"
          >
            {displayName}
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Выйти из аккаунта"
            title="Выйти из аккаунта"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
