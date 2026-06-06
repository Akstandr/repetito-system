import { ChevronRight, BookOpen, Calendar, Edit3, GraduationCap, Loader2, MessageCircle, Star, Users } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { MARKETPLACE_API_BASE_URL, getAuthHeaders, readErrorMessage } from "../../../shared/api";

interface ConversationSummary {
  unreadMessagesCount?: number;
}

type ApplicationStatus = "SENT" | "PENDING" | "ACCEPTED" | "REJECTED";
type LessonStatus = "PLANNED" | "COMPLETED" | "CANCELLED";

interface TutorDashboardStats {
  studentsCount?: number;
  plannedLessonsCount?: number;
  pendingApplicationsCount?: number;
  tutorCardsCount?: number;
  unreadMessagesCount?: number;
  reviewsCount?: number;
}

interface TutorDashboardAction {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  count?: number;
  badge?: string;
}

function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function formatError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function TutorDashboard({
  userLabel,
  activeAccountId,
}: {
  userLabel: string;
  activeAccountId: number;
}) {
  const [dashboardStats, setDashboardStats] = useState<TutorDashboardStats>({});
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setDashboardStats({});
      setDashboardLoading(true);
      setDashboardError(null);

      const requests = [
        fetch(`${MARKETPLACE_API_BASE_URL}/tutor/students`, { headers: getAuthHeaders() }),
        fetch(`${MARKETPLACE_API_BASE_URL}/lessons/my`, { headers: getAuthHeaders() }),
        fetch(`${MARKETPLACE_API_BASE_URL}/applications/incoming`, { headers: getAuthHeaders() }),
        fetch(`${MARKETPLACE_API_BASE_URL}/tutor-cards/my`, { headers: getAuthHeaders() }),
        fetch(`${MARKETPLACE_API_BASE_URL}/conversations/my`, { headers: getAuthHeaders() }),
        fetch(`${MARKETPLACE_API_BASE_URL}/reviews/about-me`, { headers: getAuthHeaders() }),
      ];

      const [studentsResult, lessonsResult, applicationsResult, cardsResult, conversationsResult, reviewsResult] =
        await Promise.allSettled(requests);

      if (cancelled) {
        return;
      }

      const nextStats: TutorDashboardStats = {};
      const errors: string[] = [];

      if (studentsResult.status === "fulfilled") {
        if (!studentsResult.value.ok) {
          errors.push(await readErrorMessage(studentsResult.value, "Не удалось загрузить учеников"));
        } else {
          nextStats.studentsCount = (await studentsResult.value.json()).length;
        }
      } else {
        errors.push(formatError(studentsResult.reason, "Не удалось загрузить учеников"));
      }

      if (lessonsResult.status === "fulfilled") {
        if (!lessonsResult.value.ok) {
          errors.push(await readErrorMessage(lessonsResult.value, "Не удалось загрузить занятия"));
        } else {
          const lessons = (await lessonsResult.value.json()) as Array<{ status: LessonStatus }>;
          nextStats.plannedLessonsCount = lessons.filter((lesson) => lesson.status === "PLANNED").length;
        }
      } else {
        errors.push(formatError(lessonsResult.reason, "Не удалось загрузить занятия"));
      }

      if (applicationsResult.status === "fulfilled") {
        if (!applicationsResult.value.ok) {
          errors.push(await readErrorMessage(applicationsResult.value, "Не удалось загрузить заявки"));
        } else {
          const applications = (await applicationsResult.value.json()) as Array<{ status: ApplicationStatus }>;
          nextStats.pendingApplicationsCount = applications.filter((application) => application.status === "PENDING").length;
        }
      } else {
        errors.push(formatError(applicationsResult.reason, "Не удалось загрузить заявки"));
      }

      if (cardsResult.status === "fulfilled") {
        if (!cardsResult.value.ok) {
          errors.push(await readErrorMessage(cardsResult.value, "Не удалось загрузить карточки"));
        } else {
          nextStats.tutorCardsCount = (await cardsResult.value.json()).length;
        }
      } else {
        errors.push(formatError(cardsResult.reason, "Не удалось загрузить карточки"));
      }

      if (conversationsResult.status === "fulfilled") {
        if (!conversationsResult.value.ok) {
          errors.push(await readErrorMessage(conversationsResult.value, "Не удалось загрузить сообщения"));
        } else {
          const conversations = (await conversationsResult.value.json()) as ConversationSummary[];
          nextStats.unreadMessagesCount = conversations.reduce(
            (total, conversation) => total + (conversation.unreadMessagesCount ?? 0),
            0,
          );
        }
      } else {
        errors.push(formatError(conversationsResult.reason, "Не удалось загрузить сообщения"));
      }

      if (reviewsResult.status === "fulfilled") {
        if (!reviewsResult.value.ok) {
          errors.push(await readErrorMessage(reviewsResult.value, "Не удалось загрузить отзывы"));
        } else {
          nextStats.reviewsCount = (await reviewsResult.value.json()).length;
        }
      } else {
        errors.push(formatError(reviewsResult.reason, "Не удалось загрузить отзывы"));
      }
      setDashboardStats(nextStats);
      setDashboardError(errors.length > 0 ? errors[0] : null);
      setDashboardLoading(false);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [activeAccountId]);

  const actions: TutorDashboardAction[] = [
    {
      title: "Мои ученики",
      description: "Ваши активные ученики",
      href: "/profile/students",
      icon: Users,
      count: dashboardStats.studentsCount,
    },
    {
      title: "Мои занятия",
      description: "Запланированные уроки",
      href: "/profile/lessons",
      icon: Calendar,
      count: dashboardStats.plannedLessonsCount,
    },
    {
      title: "Заявки учеников",
      description: "Новые обращения от учеников",
      href: "/profile/applications",
      icon: BookOpen,
      count: dashboardStats.pendingApplicationsCount,
      badge:
        typeof dashboardStats.pendingApplicationsCount === "number" && dashboardStats.pendingApplicationsCount > 0
          ? `${dashboardStats.pendingApplicationsCount} новых`
          : undefined,
    },
    {
      title: "Мои карточки",
      description: "Ваши карточки в каталоге",
      href: "/profile/cards",
      icon: Edit3,
      count: dashboardStats.tutorCardsCount,
    },
    {
      title: "Отзывы",
      description: "Оценки и ответы ученикам",
      href: "/profile/reviews",
      icon: Star,
      count: dashboardStats.reviewsCount,
    },
    {
      title: "Сообщения",
      description: "Непрочитанные сообщения",
      href: "/profile/messages",
      icon: MessageCircle,
      count: dashboardStats.unreadMessagesCount,
      badge:
        typeof dashboardStats.unreadMessagesCount === "number" && dashboardStats.unreadMessagesCount > 0
          ? `${dashboardStats.unreadMessagesCount} новых`
          : undefined,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <section className="overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-sm lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                <GraduationCap size={13} />
                Кабинет репетитора
              </div>

              <div>
                <h1 className="text-4xl font-semibold leading-tight">
                  Здравствуйте, <span className="text-primary">{userLabel}</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Управляйте учениками, занятиями, заявками, карточками и перепиской из одного места. Быстрые переходы
                  ниже помогут открыть нужный раздел личного кабинета в один клик.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Ученики</div>
                  <div className="mt-2 text-2xl font-semibold">{dashboardStats.studentsCount ?? null}</div>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Занятия</div>
                  <div className="mt-2 text-2xl font-semibold">{dashboardStats.plannedLessonsCount ?? null}</div>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Заявки</div>
                  <div className="mt-2 text-2xl font-semibold">{dashboardStats.pendingApplicationsCount ?? null}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                {dashboardLoading
                  ? "Загружаем статистику кабинета..."
                  : dashboardError
                    ? "Не удалось загрузить часть статистики. Переходы по разделам работают в любом случае."
                    : "Статистика собрана из уже существующих разделов кабинета."}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => navigateTo(action.href)}
                    className="group rounded-3xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-secondary/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon size={20} />
                      </div>

                      {action.badge ? (
                        <div className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
                          {action.badge}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-semibold">{action.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div className="text-2xl font-semibold">{typeof action.count === "number" ? action.count : null}</div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition group-hover:translate-x-0.5">
                        Открыть
                        <ChevronRight size={16} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
  );
}


