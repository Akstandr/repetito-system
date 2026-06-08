import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, GraduationCap, Loader2, Star, UserRound } from "lucide-react";
import { API_BASE_URL, MARKETPLACE_API_BASE_URL, formatErrorMessage, getAuthHeaders, readErrorMessage } from "../../shared/api";
import { markdownToSafeHtml } from "../../shared/markdown";
import { ThemeToggle } from "../../shared/ThemeToggle";
import { useAuthSession } from "../../shared/useAuthSession";
import { useAutoClearMessage } from "../../shared/useAutoClearMessage";
import type { TutorCard, TutorReview } from "./types";

type AccountType = "student" | "tutor" | "STUDENT" | "TUTOR";

interface PublicAccount {
  id: number;
  type: AccountType;
  createdAt: string;
  studentProfile: {
    description: string | null;
    subjects: string | null;
    gradeLevel: string | null;
    format: string | null;
  } | null;
  tutorProfile: {
    description: string | null;
    subjects: string | null;
    experience: string | null;
    price: number | null;
    education: string | null;
    achievements: string | null;
  } | null;
}

interface PublicProfileResponse {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    createdAt: string;
  };
  accounts: PublicAccount[];
  tutorCards: TutorCard[];
  reviews: TutorReview[];
}

interface TutorEducationView {
  institution: string;
  specialty: string;
  graduationYear: string;
}

function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function formatAccountType(type: AccountType) {
  return type.toLowerCase() === "tutor" ? "Репетитор" : "Ученик";
}

function formatSubject(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

export function PublicProfilePage({ accountId }: { accountId: number }) {
  const { session } = useAuthSession();
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isContacting, setIsContacting] = useState(false);

  useAutoClearMessage(contactError, setContactError);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/accounts/public/${accountId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Профиль не найден");
        }
        return response.json() as Promise<PublicProfileResponse>;
      })
      .then((result) => {
        if (!cancelled) {
          setProfile(result);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(formatErrorMessage(loadError instanceof Error ? loadError.message : "", "Не удалось загрузить профиль"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const tutorAccount = useMemo(() => profile?.accounts.find((account) => account.type.toLowerCase() === "tutor") ?? null, [profile]);
  const studentAccount = useMemo(() => profile?.accounts.find((account) => account.type.toLowerCase() === "student") ?? null, [profile]);
  const tutorEducation = useMemo(
    () => parseTutorEducation(tutorAccount?.tutorProfile?.education),
    [tutorAccount?.tutorProfile?.education],
  );
  const averageRating = useMemo(() => {
    if (!profile || profile.reviews.length === 0) {
      return null;
    }
    return profile.reviews.reduce((sum, review) => sum + review.rating, 0) / profile.reviews.length;
  }, [profile]);

  async function contactTutor() {
    if (!tutorAccount) {
      return;
    }
    if (!session?.user) {
      setContactError("Войдите в аккаунт, чтобы написать репетитору");
      return;
    }

    setIsContacting(true);
    setContactError(null);
    try {
      const response = await fetch(`${MARKETPLACE_API_BASE_URL}/conversations/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ tutorAccountId: tutorAccount.id }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Не удалось открыть чат"));
      }

      const conversation = (await response.json()) as { id: number };
      navigateTo(`/profile/chat/${conversation.id}`);
    } catch (contactLoadError) {
      setContactError(formatErrorMessage(contactLoadError instanceof Error ? contactLoadError.message : "", "Не удалось открыть чат"));
    } finally {
      setIsContacting(false);
    }
  }

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
            Назад
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground sm:inline-flex">
              <UserRound size={15} />
              Публичный профиль
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 lg:py-10">
        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 size={18} className="animate-spin text-primary" />
              Загружаем профиль...
            </div>
          </div>
        ) : error || !profile ? (
          <section className="rounded-[28px] border border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-semibold">Профиль не найден</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error ?? "Такого профиля нет или он недоступен."}</p>
          </section>
        ) : (
          <div className="space-y-5">
            <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <UserRound size={26} />
                  </div>
                  <h1 className="mt-4 text-3xl font-semibold">
                    {profile.user.firstName} {profile.user.lastName}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">На платформе с {formatDate(profile.user.createdAt)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.accounts.map((account) => (
                      <span key={account.id} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground">
                        {formatAccountType(account.type)}
                      </span>
                    ))}
                  </div>
                </div>

                {averageRating !== null ? (
                  <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Star size={18} className="fill-primary text-primary" />
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Отзывов: {profile.reviews.length}</div>
                  </div>
                ) : null}
              </div>
              {tutorAccount ? (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => void contactTutor()}
                    disabled={isContacting}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {isContacting ? "Открываем чат..." : "Связаться"}
                  </button>
                  {contactError ? (
                    <div className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                      {contactError}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            {tutorAccount?.tutorProfile ? (
              <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-primary" />
                  <h2 className="text-2xl font-semibold">Профиль репетитора</h2>
                </div>
                {tutorAccount.tutorProfile.description ? (
                  <div
                    className="markdown-content leading-7 text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(tutorAccount.tutorProfile.description) }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Описание пока не заполнено.</p>
                )}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {tutorAccount.tutorProfile.experience ? (
                    <div className="rounded-2xl bg-secondary/60 p-4">
                      <div className="text-xs text-muted-foreground">Опыт преподавания</div>
                      <div className="mt-1 font-semibold">{tutorAccount.tutorProfile.experience} лет</div>
                    </div>
                  ) : null}
                  {tutorEducation.length > 0 ? (
                    <div className="rounded-2xl bg-secondary/60 p-4">
                      <div className="text-xs text-muted-foreground">Образование</div>
                      <div className="mt-3 space-y-3">
                        {tutorEducation.map((education, index) => (
                          <div key={index} className="rounded-xl border border-border bg-card p-3">
                            <div className="font-semibold">{education.institution || "Учебное заведение не указано"}</div>
                            {education.specialty && (
                              <div className="mt-1 text-sm text-muted-foreground">{education.specialty}</div>
                            )}
                            {education.graduationYear && (
                              <div className="mt-1 text-sm text-muted-foreground">Год окончания: {education.graduationYear}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {studentAccount?.studentProfile ? (
              <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="mb-4 flex items-center gap-2">
                  <GraduationCap size={20} className="text-primary" />
                  <h2 className="text-2xl font-semibold">Профиль ученика</h2>
                </div>
                <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {studentAccount.studentProfile.description || "Описание пока не заполнено."}
                </p>
              </section>
            ) : null}

            {profile.tutorCards.length > 0 ? (
              <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
                <h2 className="text-2xl font-semibold">Карточки репетитора</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {profile.tutorCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => navigateTo(`/tutor-cards/${card.id}`)}
                      className="rounded-2xl border border-border bg-secondary/40 p-4 text-left transition hover:border-primary/40 hover:bg-secondary/70"
                    >
                      <div className="text-lg font-semibold">{card.title}</div>
                      <div className="mt-2 text-sm text-muted-foreground">{formatSubject(card.subject)}</div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{card.description}</p>
                      <div className="mt-4 font-semibold">{Number(card.pricePerLesson).toLocaleString("ru-RU")} ₽ / час</div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-7">
              <h2 className="text-2xl font-semibold">Отзывы</h2>
              {profile.reviews.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Отзывов пока нет.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {profile.reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-border bg-secondary/35 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold">
                          {review.studentFirstName} {review.studentLastName}
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <Star size={15} className="fill-primary text-primary" />
                          {review.rating}
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{review.text}</p>
                      {review.tutorReply ? (
                        <div className="mt-3 rounded-xl bg-card p-3 text-sm">
                          <div className="font-semibold">Ответ репетитора</div>
                          <p className="mt-1 whitespace-pre-line text-muted-foreground">{review.tutorReply}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
