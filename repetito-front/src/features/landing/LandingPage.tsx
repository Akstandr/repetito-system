import { useEffect, useState } from "react";
import { GraduationCap, Loader2, LogOut, Menu, X } from "lucide-react";
import { AuthModal } from "../auth/AuthModal";
import {
  DEFAULT_SUBJECT_OPTIONS,
  MARKETPLACE_API_BASE_URL,
  fetchSubjectOptions,
  formatErrorMessage,
  getAuthHeaders,
  getCookieValue,
  readErrorMessage,
} from "../../shared/api";
import type { SubjectOption } from "../../shared/api";
import { ThemeToggle } from "../../shared/ThemeToggle";
import { useAuthSession } from "../../shared/useAuthSession";
import { ApplicationMessageDialog, GuestLanding, TutorDashboard, TutorSearchPanel, TutorSearchResults } from "./components";
import type { TutorCardPageResponse } from "./types";

type AuthMode = "login" | "register";

type ActiveAccountType = "student" | "tutor" | "";

interface StudentApplicationSummary {
  tutorCard: {
    id: number;
  };
}

function normalizeAccountType(value: unknown): ActiveAccountType {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "student" || normalized === "tutor" ? normalized : "";
}

function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function formatError(error: unknown, fallback: string) {
  return formatErrorMessage(error instanceof Error ? error.message : "", fallback);
}

export function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const { session, logout, isLoading: isSessionLoading } = useAuthSession();
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>(DEFAULT_SUBJECT_OPTIONS);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [cards, setCards] = useState<TutorCardPageResponse>({ items: [], page: 1, limit: 6, total: 0, totalPages: 0 });
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState<number | null>(null);
  const [applicationCardId, setApplicationCardId] = useState<number | null>(null);
  const [appliedTutorCardIds, setAppliedTutorCardIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAuthenticated = Boolean(session?.user);
  const accounts = session?.accounts ?? [];
  const activeAccount = session?.activeAccount ?? accounts.find((account) => account.active) ?? null;
  const activeAccountType = normalizeAccountType(activeAccount?.type);
  const isStudent = activeAccountType === "student";
  const isTutor = activeAccountType === "tutor";
  const showGuestLanding = !isAuthenticated;
  const showTutorDashboard = isAuthenticated && isTutor && Boolean(activeAccount);
  const showAccountSelectionNotice = isAuthenticated && !isStudent && !showTutorDashboard;
  const userLabel = `${session?.user?.firstName || session?.user?.email || "Пользователь"}${session?.user?.lastName ? ` ${session.user.lastName}` : ""}`.trim();

  useEffect(() => {
    let cancelled = false;

    fetchSubjectOptions()
      .then((items) => {
        if (!cancelled && items.length > 0) {
          setSubjectOptions(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSubjectOptions(DEFAULT_SUBJECT_OPTIONS);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      setIsGuestMenuOpen(false);
    }
  }, [session?.user]);

  async function searchCards(nextPage = page) {
    setHasSearched(true);
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const params = new URLSearchParams();
      if (subject) params.set("subject", subject);
      if (grade) params.set("grade", grade);
      params.set("page", String(nextPage));
      params.set("limit", String(limit));

      const response = await fetch(`${MARKETPLACE_API_BASE_URL}/tutor-cards?${params.toString()}`);
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Не удалось загрузить карточки репетиторов"));
      }

      setCards((await response.json()) as TutorCardPageResponse);
      setPage(nextPage);
    } catch (loadError) {
      setError(formatError(loadError, "Не удалось загрузить карточки репетиторов"));
    } finally {
      setIsLoading(false);
    }
  }

  const applicationCard = cards.items.find((card) => card.id === applicationCardId) ?? null;

  function openApplicationDialog(cardId: number) {
    if (!session?.user) {
      setAuthMode("login");
      setAuthOpen(true);
      setError("Сначала войдите как ученик");
      return;
    }

    if (activeAccountType !== "student") {
      setError("Отправить заявку может только ученик");
      return;
    }

    setApplicationCardId(cardId);
  }

  async function applyToCard(cardId: number, message: string) {
    setIsApplying(cardId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${MARKETPLACE_API_BASE_URL}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          tutorCardId: cardId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Не удалось отправить заявку"));
      }

      setAppliedTutorCardIds((current) => {
        const next = new Set(current);
        next.add(cardId);
        return next;
      });
      setSuccess("Заявка отправлена");
      setApplicationCardId(null);
    } catch (applyError) {
      setError(formatError(applyError, "Не удалось отправить заявку"));
    } finally {
      setIsApplying(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadStudentApplications() {
      if (activeAccountType !== "student") {
        setAppliedTutorCardIds(new Set());
        return;
      }

      try {
        const response = await fetch(`${MARKETPLACE_API_BASE_URL}/applications/my`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          setAppliedTutorCardIds(new Set());
          return;
        }

        const applications = (await response.json()) as StudentApplicationSummary[];
        if (cancelled) {
          return;
        }

        setAppliedTutorCardIds(new Set(applications.map((application) => application.tutorCard.id)));
      } catch {
        if (!cancelled) {
          setAppliedTutorCardIds(new Set());
        }
      }
    }

    void loadStudentApplications();

    return () => {
      cancelled = true;
    };
  }, [activeAccount?.id, activeAccountType]);

  if (isSessionLoading && getCookieValue("auth_token")) {
    return (
      <div className="app-gradient-bg flex min-h-screen items-center justify-center text-foreground">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
          <Loader2 size={18} className="animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Загружаем кабинет...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-gradient-bg min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-0">
          <button
            type="button"
            onClick={() => navigateTo("/")}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-secondary"
          >
            <GraduationCap size={18} className="text-primary" />
            Repetito.ru
          </button>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {session?.user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo("/account")}
                  className="max-w-[34vw] truncate rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition hover:bg-secondary/80 sm:max-w-64"
                >
                  {`${session.user.firstName || session.user.email}${session.user.lastName ? ` ${session.user.lastName}` : ""}`.trim()}
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  aria-label="Выйти из аккаунта"
                  title="Выйти из аккаунта"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsGuestMenuOpen((value) => !value)}
                  aria-label="Открыть меню авторизации"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:hidden"
                >
                  {isGuestMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthOpen(true);
                    }}
                    className="rounded-xl px-4 py-2 text-sm transition hover:bg-secondary"
                  >
                    Войти
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthOpen(true);
                    }}
                    className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90"
                  >
                    Регистрация
                  </button>
                </div>

                {isGuestMenuOpen && (
                  <div className="absolute right-0 top-12 z-40 w-48 rounded-2xl border border-border bg-card p-2 shadow-xl sm:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestMenuOpen(false);
                        setAuthMode("login");
                        setAuthOpen(true);
                      }}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm transition hover:bg-secondary"
                    >
                      Войти
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestMenuOpen(false);
                        setAuthMode("register");
                        setAuthOpen(true);
                      }}
                      className="mt-1 block w-full rounded-xl bg-primary px-4 py-3 text-left text-sm text-primary-foreground transition hover:bg-primary/90"
                    >
                      Регистрация
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showGuestLanding ? (
        <GuestLanding
          onLogin={() => {
            setAuthMode("login");
            setAuthOpen(true);
          }}
          onRegister={() => {
            setAuthMode("register");
            setAuthOpen(true);
          }}
        />
      ) : showTutorDashboard ? (
        <TutorDashboard userLabel={userLabel} activeAccountId={activeAccount.id} />
      ) : showAccountSelectionNotice ? (
        <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:py-12">
          <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:rounded-[28px] sm:p-8">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                <GraduationCap size={13} />
                Аккаунт авторизован
              </div>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Активная роль ещё не выбрана</h1>
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                Вы уже вошли в систему, но для отображения персонального кабинета нужно выбрать активный аккаунт.
                Перейдите в личный кабинет, чтобы открыть профиль ученика или репетитора.
              </p>
              <button
                type="button"
                onClick={() => navigateTo("/account")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Личный кабинет
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:py-12">
          <section className="mb-5 rounded-[24px] border border-border bg-card p-4 shadow-sm sm:rounded-[28px] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold">Поиск пользователей</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Откройте отдельную страницу, чтобы найти публичные профили репетиторов и учеников по имени.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo("/search")}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground transition hover:bg-primary/90"
              >
                Перейти к поиску
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-border bg-card p-4 shadow-sm sm:rounded-[28px] sm:p-6">
            <TutorSearchPanel
              subject={subject}
              setSubject={setSubject}
              grade={grade}
              setGrade={setGrade}
              subjectOptions={subjectOptions}
              onSearch={() => void searchCards(1)}
            />

            <TutorSearchResults
              cards={cards}
              hasSearched={hasSearched}
              isLoading={isLoading}
              error={error}
              success={success}
              onPrevious={() => void searchCards(cards.page - 1)}
              onNext={() => void searchCards(cards.page + 1)}
              onApply={openApplicationDialog}
              onOpenCard={(cardId) => navigateTo(`/tutor-cards/${cardId}`)}
              isApplying={isApplying}
              appliedTutorCardIds={appliedTutorCardIds}
              subjectOptions={subjectOptions}
            />
          </section>
        </main>
      )}

      <ApplicationMessageDialog
        isOpen={Boolean(applicationCard)}
        isSubmitting={applicationCardId !== null && isApplying === applicationCardId}
        tutorName={
          applicationCard ? `${applicationCard.tutor.firstName} ${applicationCard.tutor.lastName}`.trim() : undefined
        }
        onClose={() => {
          if (isApplying === null) {
            setApplicationCardId(null);
          }
        }}
        onSubmit={(message) => {
          if (applicationCardId !== null) {
            void applyToCard(applicationCardId, message);
          }
        }}
      />

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
