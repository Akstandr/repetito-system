import { ChevronLeft, ChevronRight } from "lucide-react";
import { TutorCardResult } from "./TutorCardResult";
import type { SubjectOption } from "../../../shared/api";
import type { TutorCardPageResponse } from "../types";

export function TutorSearchResults({
  cards,
  hasSearched,
  isLoading,
  error,
  success,
  onPrevious,
  onNext,
  onApply,
  onOpenCard,
  isApplying,
  appliedTutorCardIds,
  subjectOptions,
}: {
  cards: TutorCardPageResponse;
  hasSearched: boolean;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  onPrevious: () => void;
  onNext: () => void;
  onApply: (cardId: number) => void;
  onOpenCard: (cardId: number) => void;
  isApplying: number | null;
  appliedTutorCardIds: Set<number>;
  subjectOptions: SubjectOption[];
}) {
  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Результаты поиска</h2>
          {hasSearched ? (
            <p className="text-sm text-muted-foreground">
              {cards.total} карточек, страница {cards.page} из {cards.totalPages || 1}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Карточки появятся после нажатия на кнопку поиска.</p>
          )}
        </div>
      </div>

      {(error || success) && (
        <div
          className={`mb-4 rounded-2xl border p-4 text-sm ${
            error ? "border-destructive/20 bg-destructive/10 text-destructive" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || success}
        </div>
      )}

      {!hasSearched ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-5 text-sm text-muted-foreground sm:p-8">
          Выберите предмет и класс, затем нажмите «Найти репетитора», чтобы увидеть карточки.
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-border bg-background p-5 text-sm text-muted-foreground sm:p-8">
          Загрузка карточек...
        </div>
      ) : cards.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background p-5 text-sm text-muted-foreground sm:p-8">
          Репетиторы не найдены
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {cards.items.map((card) => (
              <TutorCardResult
                key={card.id}
                card={card}
                onApply={onApply}
                onOpen={onOpenCard}
                isApplying={isApplying === card.id}
                hasApplied={appliedTutorCardIds.has(card.id)}
                subjectLabel={subjectOptions.find((item) => item.value === card.subject)?.label ?? card.subject}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={cards.page <= 1 || isLoading}
              onClick={onPrevious}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Назад
            </button>
            <div className="rounded-xl bg-secondary px-4 py-2 text-sm text-secondary-foreground">
              {cards.page} / {cards.totalPages || 1}
            </div>
            <button
              type="button"
              disabled={cards.page >= cards.totalPages || isLoading}
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Вперёд
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
