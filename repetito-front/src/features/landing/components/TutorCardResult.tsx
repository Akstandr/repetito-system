import type { TutorCard } from "../types";

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

export function TutorCardResult({
  card,
  onApply,
  onMessage,
  onOpen,
  isApplying,
  hasApplied,
  subjectLabel,
}: {
  card: TutorCard;
  onApply: (cardId: number) => void;
  onMessage: (card: TutorCard) => void;
  onOpen: (cardId: number) => void;
  isApplying: boolean;
  hasApplied: boolean;
  subjectLabel: string;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(card.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(card.id);
        }
      }}
      className="flex h-full cursor-pointer flex-col rounded-3xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-5"
    >
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">{card.title}</h3>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              window.history.pushState({}, "", `/profile/${card.tutor.id}`);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="mt-1 text-left text-sm text-muted-foreground transition hover:text-primary"
          >
            {card.tutor.firstName} {card.tutor.lastName}
          </button>
        </div>
        <div className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
          {card.pricePerLesson.toLocaleString("ru-RU")} ₽ / час
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-muted px-3 py-1">{subjectLabel}</span>
        <span className="rounded-full bg-muted px-3 py-1">{formatTutorCardFormat(card.format)}</span>
        <span className="rounded-full bg-muted px-3 py-1">{card.supportedGrades.join(", ")} класс</span>
      </div>

      <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">
        {card.description || "Описание пока не добавлено."}
      </p>

      <div className="mt-4 flex-1" />

      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onMessage(card); }}
        className="mb-2 inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium transition hover:bg-secondary"
      >
        Написать репетитору
      </button>
      {hasApplied ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Вы уже отправили заявку на эту карточку
      </div> : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onApply(card.id);
          }}
          disabled={isApplying}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isApplying ? "Отправляем..." : "Оставить заявку"}
        </button>
      )}
    </article>
  );
}
