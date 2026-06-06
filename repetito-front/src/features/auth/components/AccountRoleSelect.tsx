import { BookOpen, GraduationCap, Loader2 } from "lucide-react";
import type { AccountType, AccountView } from "../../../shared/useAuthSession";

export function AccountRoleSelect({
  selectionAccounts,
  isLoading,
  onSelect,
  serverError,
}: {
  selectionAccounts: AccountView[];
  isLoading: boolean;
  onSelect: (type: AccountType) => void;
  serverError: string | null;
}) {
  return (
    <div>
      <h3 className="mb-1 text-lg font-semibold">Войти как</h3>
      <p className="mb-6 text-sm text-muted-foreground">
        У пользователя несколько аккаунтов. Выберите, в какой кабинет войти.
      </p>

      <div className="space-y-3">
        {selectionAccounts.map((account) => (
          <button
            key={account.id}
            type="button"
            disabled={isLoading}
            onClick={() => onSelect(account.type)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                {account.type === "student" ? <GraduationCap size={20} /> : <BookOpen size={20} />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  {account.type === "student" ? "Аккаунт ученика" : "Аккаунт репетитора"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {account.type === "student" ? "Личный кабинет ученика" : "Личный кабинет репетитора"}
                </span>
              </span>
            </span>
            {isLoading && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
          </button>
        ))}
      </div>

      {serverError && <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>}
    </div>
  );
}
