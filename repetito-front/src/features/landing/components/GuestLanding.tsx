import { Calendar, GraduationCap, MessageCircle, Search } from "lucide-react";

const valueCards = [
  {
    eyebrow: "Каталог",
    title: "Каталог репетиторов",
    description: "Просматривайте анкеты преподавателей и находите специалиста под свои задачи.",
  },
  {
    eyebrow: "Заявки",
    title: "Заявки и отклики",
    description: "Создавайте заявки на обучение и получайте отклики от репетиторов.",
  },
  {
    eyebrow: "Связь",
    title: "Чат",
    description: "Общайтесь с преподавателями и согласовывайте детали занятий.",
  },
];

const infoCards = [
  {
    icon: Search,
    title: "Быстрый поиск",
    description: "Найдите подходящего репетитора за пару минут. Фильтруйте преподавателей по предмету, классу и специализации.",
  },
  {
    icon: MessageCircle,
    title: "Удобное общение",
    description: "Обсуждайте цели обучения, расписание и детали занятий в одном месте.",
  },
  {
    icon: Calendar,
    title: "Организация занятий",
    description: "Храните заявки, контакты и информацию о занятиях в личном кабинете.",
  },
];

const steps = [
  {
    title: "Найдите преподавателя",
    description: "Выберите предмет и просмотрите анкеты репетиторов.",
  },
  {
    title: "Отправьте заявку",
    description: "Расскажите о своих целях и пожеланиях по обучению.",
  },
  {
    title: "Начните заниматься",
    description: "Общайтесь с преподавателем и договаривайтесь о занятиях.",
  },
];

export function GuestLanding({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:py-12">
      <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm sm:rounded-[28px] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              <GraduationCap size={13} />
              Repetito.ru - сервис для репетиторов и учеников
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-3xl font-semibold leading-tight sm:text-5xl">
                Найдите репетитора для <span className="text-primary">достижения ваших учебных целей</span>
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Подбор преподавателей по предметам и классам, удобная система заявок и общение на одной платформе.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-border bg-secondary/40 p-3 sm:inline-flex sm:flex-row">
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Найти репетитора
              </button>
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition hover:bg-secondary"
              >
                Зарегистрироваться
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {valueCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{card.eyebrow}</div>
                  <div className="mt-2 text-lg font-semibold">{card.title}</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {infoCards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.title} className="rounded-3xl border border-border bg-background p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="text-base font-semibold">{card.title}</div>
                      <div className="mt-1 text-sm leading-6 text-muted-foreground">{card.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[24px] border border-border bg-card p-4 shadow-sm sm:rounded-[28px] sm:p-8">
        <div className="mb-6 max-w-3xl">
          <h2 className="text-2xl font-semibold sm:text-3xl">Как это работает</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">
            Три простых шага до начала занятий
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-3xl border border-border bg-background p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
