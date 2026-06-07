import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Search, UserRound } from "lucide-react";
import { API_BASE_URL, formatErrorMessage, readErrorMessage } from "../../shared/api";
import { ThemeToggle } from "../../shared/ThemeToggle";

type PublicProfileTypeFilter = "TUTOR" | "STUDENT" | "";

interface PublicProfileSearchItem {
  accountId: number;
  userId: number;
  type: "TUTOR" | "STUDENT" | "tutor" | "student";
  firstName: string;
  lastName: string;
  description: string | null;
  subjects: string | null;
}

function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function formatError(error: unknown, fallback: string) {
  return formatErrorMessage(error instanceof Error ? error.message : "", fallback);
}

export function PublicProfileSearchPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PublicProfileTypeFilter>("TUTOR");
  const [profiles, setProfiles] = useState<PublicProfileSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchProfiles() {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("query", query.trim());
      }
      if (typeFilter) {
        params.set("type", typeFilter);
      }

      const response = await fetch(`${API_BASE_URL}/accounts/public?${params.toString()}`);
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Не удалось загрузить публичные профили"));
      }

      setProfiles((await response.json()) as PublicProfileSearchItem[]);
    } catch (loadError) {
      setError(formatError(loadError, "Не удалось загрузить публичные профили"));
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void searchProfiles();
  }, [typeFilter]);

  return (
    <div className="app-gradient-bg min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-6 sm:py-0">
          <button
            type="button"
            onClick={() => navigateTo("/")}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft size={17} />
            На главную
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:py-10">
        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                <Search size={13} />
                Поиск пользователей
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Найдите публичный профиль</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                Введите имя или фамилию. Поиск понимает оба порядка: Иван Петров и Петров Иван.
              </p>
            </div>

            <div className="grid gap-3 lg:min-w-[620px] sm:grid-cols-[minmax(0,1fr)_180px_auto]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void searchProfiles();
                  }
                }}
                placeholder="Например: Иван Петров"
                className="w-full rounded-xl border border-border bg-input-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as PublicProfileTypeFilter)}
                className="w-full rounded-xl border border-border bg-input-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              >
                <option value="TUTOR">Репетиторы</option>
                <option value="STUDENT">Ученики</option>
                <option value="">Все</option>
              </select>
              <button
                type="button"
                onClick={() => void searchProfiles()}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Ищем..." : "Найти"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
              <Loader2 size={17} className="animate-spin text-primary" />
              Загружаем публичные профили...
            </div>
          ) : profiles.length === 0 ? (
            <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
              Публичные профили не найдены.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => {
                const isTutorProfile = profile.type.toLowerCase() === "tutor";
                return (
                  <button
                    key={profile.accountId}
                    type="button"
                    onClick={() => navigateTo(`/profile/${profile.accountId}`)}
                    className="rounded-2xl border border-border bg-secondary/35 p-4 text-left transition hover:border-primary/40 hover:bg-secondary/65"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold">
                          {profile.firstName} {profile.lastName}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
                          <UserRound size={12} />
                          {isTutorProfile ? "Репетитор" : "Ученик"}
                        </div>
                      </div>
                      <span className="rounded-full bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
                        #{profile.accountId}
                      </span>
                    </div>
                    {profile.subjects ? (
                      <div className="mt-3 text-sm text-muted-foreground">{profile.subjects}</div>
                    ) : null}
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {profile.description || "Описание пока не заполнено."}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
