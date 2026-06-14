import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, GraduationCap, Loader2, LogOut, Star } from "lucide-react";
import { AuthModal } from "../auth/AuthModal";
import {
  DEFAULT_SUBJECT_OPTIONS,
  MARKETPLACE_API_BASE_URL,
  fetchSubjectOptions,
  formatErrorMessage,
  getAuthHeaders,
  readErrorMessage,
  startConversation,
} from "../../shared/api";
import type { SubjectOption } from "../../shared/api";
import { markdownToSafeHtml } from "../../shared/markdown";
import { ThemeToggle } from "../../shared/ThemeToggle";
import { useAuthSession } from "../../shared/useAuthSession";
import { useAutoClearMessage } from "../../shared/useAutoClearMessage";
import { ApplicationMessageDialog } from "./components";
import type { TutorCard, TutorReview } from "./types";

type AuthMode = "login" | "register";
type ActiveAccountType = "student" | "tutor" | "";

interface StudentApplicationSummary {
  tutorCard: {
    id: number;
  };
}

function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function normalizeAccountType(value: unknown): ActiveAccountType {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "student" || normalized === "tutor" ? normalized : "";
}

function formatTutorCardFormat(value: TutorCard["format"]) {
  switch (value) {
    case "online":
      return "Онлайн";
    case "offline":
      return "Офлайн";
    default:
      return "Смешанный";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatError(error: unknown, fallback: string) {
  return formatErrorMessage(error instanceof Error ? error.message : "", fallback);
}

function getStudentName(review: TutorReview) {
  return `${review.studentFirstName || "Ученик"}${review.studentLastName ? ` ${review.studentLastName}` : ""}`.trim();
}

interface TutorEducationView {
  institution: string;
  specialty: string;
  graduationYear: string;
}

function parseTutorEducation(value: string | null | undefined): TutorEducationView[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          const education = item as Partial<TutorEducationView>;
          return {
            institution: String(education.institution ?? ""),
            specialty: String(education.specialty ?? ""),
            graduationYear: String(education.graduationYear ?? ""),
          };
        })
        .filter((item) => item.institution || item.specialty || item.graduationYear);
    }
  } catch {
    return [{ institution: value, specialty: "", graduationYear: "" }];
  }

  return [];
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={17} fill={index < rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

export function TutorCardDetailsPage({ cardId }: { cardId: number }) {
  const { session, logout } = useAuthSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>(DEFAULT_SUBJECT_OPTIONS);
  const [card, setCard] = useState<TutorCard | null>(null);
  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useAutoClearMessage(error, setError);

  const accounts = session?.accounts ?? [];
  const activeAccount = session?.activeAccount ?? accounts.find((account) => account.active) ?? null;
  const activeAccountType = normalizeAccountType(activeAccount?.type);
  const isStudent = activeAccountType === "student";
  const subjectLabel = useMemo(
    () => subjectOptions.find((item) => item.value === card?.subject)?.label ?? card?.subject ?? "",
    [card?.subject, subjectOptions]
  );
  const tutorEducation = useMemo(() => parseTutorEducation(card?.tutor.education), [card?.tutor.education]);
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

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
    let cancelled = false;

    async function loadCard() {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const cardResponse = await fetch(`${MARKETPLACE_API_BASE_URL}/tutor-cards/${cardId}`);
        if (!cardResponse.ok) {
          throw new Error(await readErrorMessage(cardResponse, "Не удалось загрузить карточку"));
        }

        const nextCard = (await cardResponse.json()) as TutorCard;
        if (cancelled) {
          return;
        }

        setCard(nextCard);

        const reviewsResponse = await fetch(`${MARKETPLACE_API_BASE_URL}/reviews/tutor/${nextCard.tutorAccountId}`);
        if (!reviewsResponse.ok) {
          throw new Error(await readErrorMessage(reviewsResponse, "Не удалось загрузить отзывы"));
        }

        const nextReviews = (await reviewsResponse.json()) as TutorReview[];
        if (!cancelled) {
          setReviews(nextReviews);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(formatError(loadError, "Не удалось загрузить карточку"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCard();

    return () => {
      cancelled = true;
    };
  }, [cardId]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudentApplications() {
      if (activeAccountType !== "student") {
        setHasApplied(false);
        return;
      }

      try {
        const response = await fetch(`${MARKETPLACE_API_BASE_URL}/applications/my`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          setHasApplied(false);
          return;
        }

        const applications = (await response.json()) as StudentApplicationSummary[];
        if (!cancelled) {
          setHasApplied(applications.some((application) => application.tutorCard.id === cardId));
        }
      } catch {
        if (!cancelled) {
          setHasApplied(false);
        }
      }
    }

    void loadStudentApplications();

    return () => {
      cancelled = true;
    };
  }, [activeAccount?.id, activeAccountType, cardId]);

  function openApplicationDialog() {
    if (!session?.user) {
      setAuthMode("login");
      setAuthOpen(true);
      setError("Сначала войдите как ученик");
      return;
    }

    if (!isStudent) {
      setError("Отправить заявку может только ученик");
      return;
    }

    setIsApplicationDialogOpen(true);
  }

  async function applyToCard(message: string) {
    setIsApplying(true);
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

      setHasApplied(true);
      setSuccess("Заявка отправлена");
      setIsApplicationDialogOpen(false);
    } catch (applyError) {
      setError(formatError(applyError, "Не удалось отправить заявку"));
    } finally {
      setIsApplying(false);
    }
  }

  async function contactTutor() {
    if (!session?.user) {
      setAuthMode("login");
      setAuthOpen(true);
      setError("Войдите как ученик, чтобы написать репетитору");
      return;
    }
    if (!isStudent || !card) {
      setError("Написать репетитору можно только из аккаунта ученика");
      return;
    }
    setIsContacting(true);
    setError(null);
    try {
      const conversation = await startConversation({ targetAccountId: card.tutorAccountId, targetType: "TUTOR" });
      navigateTo(`/profile/chat/${conversation.id}`);
    } catch (contactError) {
      setError(formatError(contactError, "Не удалось открыть чат"));
    } finally {
      setIsContacting(false);
    }
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthOpen(true);
                  }}
                  className="hidden rounded-xl px-4 py-2 text-sm transition hover:bg-secondary sm:inline-flex"
                >
                  Войти
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthOpen(true);
                  }}
                  className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground transition hover:bg-primary/90 sm:px-4"
                >
                  Регистрация
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 lg:py-12">
        <button
          type="button"
          onClick={() => navigateTo("/")}
          className="mb-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft size={17} />
          Назад к поиску
        </button>

        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 size={18} className="animate-spin text-primary" />
              Загружаем карточку...
            </div>
          </div>
        ) : error && !card ? (
          <div className="rounded-[28px] border border-destructive/20 bg-destructive/10 p-8 text-sm text-destructive">
            {error}
          </div>
        ) : card ? (
          <div className="space-y-6">
            {(error || success) && (
              <div
                className={`rounded-2xl border p-4 text-sm ${error ? "border-destructive/20 bg-destructive/10 text-destructive" : "border-emerald-200 bg-emerald-50 text-emerald-800"
                  }`}
              >
                {error || success}
              </div>
            )}

            <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:rounded-[28px] sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="mb-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-muted px-3 py-1">{subjectLabel}</span>
                    <span className="rounded-full bg-muted px-3 py-1">{formatTutorCardFormat(card.format)}</span>
                    {card.supportedGrades.length > 0 && (
                      <span className="rounded-full bg-muted px-3 py-1">{card.supportedGrades.join(", ")} класс</span>
                    )}
                  </div>
                  <h1 className="text-2xl font-semibold leading-tight sm:text-4xl">{card.title}</h1>
                  <button
                    type="button"
                    onClick={() => navigateTo(`/profile/${card.tutor.id}`)}
                    className="mt-3 text-left text-base text-muted-foreground transition hover:text-primary"
                  >
                    {card.tutor.firstName} {card.tutor.lastName}
                  </button>
                  <p className="mt-6 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                    {card.description || "Репетитор пока не добавил подробное описание карточки."}
                  </p>

                  {(card.tutor.description || card.tutor.experience || tutorEducation.length > 0) && (
                    <div className="mt-8 space-y-5 border-t border-border pt-6">
                      {card.tutor.description && (
                        <div>
                          <h2 className="text-2xl font-semibold">О репетиторе</h2>
                          <div
                            className="markdown-content mt-3 text-sm leading-7 text-muted-foreground sm:text-base"
                            dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(card.tutor.description) }}
                          />
                        </div>
                      )}

                      {card.tutor.experience && (
                        <div className="rounded-2xl border border-border bg-background p-4">
                          <div className="text-sm text-muted-foreground">Опыт преподавания</div>
                          <div className="mt-1 text-lg font-semibold">{card.tutor.experience} лет</div>
                        </div>
                      )}

                      {tutorEducation.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-semibold">Образование</h2>
                          <div className="mt-3 space-y-3">
                            {tutorEducation.map((education, index) => (
                              <div key={index} className="rounded-2xl border border-border bg-background p-4">
                                <div className="font-semibold">{education.institution || "Учебное заведение не указано"}</div>
                                {education.specialty && <div className="mt-1 text-sm text-muted-foreground">{education.specialty}</div>}
                                {education.graduationYear && (
                                  <div className="mt-1 text-sm text-muted-foreground">Год окончания: {education.graduationYear}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <aside className="rounded-3xl border border-border bg-background p-4 sm:p-5">
                  <div className="text-sm text-muted-foreground">Стоимость занятия</div>
                  <div className="mt-2 text-2xl font-semibold sm:text-3xl">{card.pricePerLesson.toLocaleString("ru-RU")} ₽ / час</div>

                  <div className="mt-5 border-t border-border pt-5">
                    <div className="text-sm text-muted-foreground">Отзывы</div>
                    <div className="mt-2 flex items-center gap-3">
                      <RatingStars rating={Math.round(averageRating)} />
                      <span className="text-sm font-medium">
                        {reviews.length > 0 ? `${averageRating.toFixed(1)} из 5` : "Пока нет"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{reviews.length} отзывов</p>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => void contactTutor()}
                      disabled={isContacting}
                      className="mb-3 inline-flex w-full items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
                    >
                      {isContacting ? "Открываем чат..." : "Написать репетитору"}
                    </button>
                    {hasApplied ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        Вы уже отправили заявку на эту карточку
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={openApplicationDialog}
                        disabled={isApplying}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isApplying ? "Отправляем..." : "Оставить заявку"}
                      </button>
                    )}
                  </div>
                </aside>
              </div>
            </section>

            <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:rounded-[28px] sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">Отзывы о репетиторе</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Отзывы учеников относятся к репетитору, а не к отдельной карточке.</p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-sm text-muted-foreground">
                  У этого репетитора пока нет отзывов.
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-2xl border border-border bg-background p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{getStudentName(review)}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{formatDate(review.createdAt)}</div>
                        </div>
                        <RatingStars rating={review.rating} />
                      </div>
                      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{review.text}</p>
                      {review.tutorReply && (
                        <div className="mt-4 rounded-2xl bg-secondary p-4 text-sm">
                          <div className="font-medium">Ответ репетитора</div>
                          <p className="mt-2 whitespace-pre-line leading-6 text-muted-foreground">{review.tutorReply}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>

      <ApplicationMessageDialog
        isOpen={isApplicationDialogOpen}
        isSubmitting={isApplying}
        tutorName={card ? `${card.tutor.firstName} ${card.tutor.lastName}`.trim() : undefined}
        onClose={() => {
          if (!isApplying) {
            setIsApplicationDialogOpen(false);
          }
        }}
        onSubmit={(message) => void applyToCard(message)}
      />

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}

