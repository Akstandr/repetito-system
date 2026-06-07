import { useEffect, useState } from "react";

const MAX_APPLICATION_MESSAGE_LENGTH = 1500;

export function ApplicationMessageDialog({
  isOpen,
  isSubmitting,
  tutorName,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  isSubmitting: boolean;
  tutorName?: string;
  onClose: () => void;
  onSubmit: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMessage("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const trimmedMessage = message.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] border border-border bg-card p-4 shadow-xl sm:rounded-[28px] sm:p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold sm:text-2xl">Сопроводительное письмо</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Расскажите {tutorName ? `репетитору ${tutorName}` : "репетитору"} о цели занятий, текущем уровне и удобном формате обучения.
          </p>
        </div>

        <label className="block">
          <span className="text-sm text-muted-foreground">Сообщение к заявке</span>
          <textarea
            value={message}
            maxLength={MAX_APPLICATION_MESSAGE_LENGTH}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Например: хочу подтянуть математику за 9 класс, готовлюсь к ОГЭ, удобно заниматься вечером онлайн."
            className="mt-2 min-h-40 w-full rounded-2xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            {message.length} / {MAX_APPLICATION_MESSAGE_LENGTH} символов
          </span>
        </label>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => onSubmit(trimmedMessage)}
            disabled={isSubmitting || !trimmedMessage}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Отправляем..." : "Отправить заявку"}
          </button>
        </div>
      </div>
    </div>
  );
}
