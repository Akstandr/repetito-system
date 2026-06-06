import { Search } from "lucide-react";
import type { SubjectOption } from "../../../shared/api";

const GRADES = [
  { value: "", label: "Любой класс" },
  ...Array.from({ length: 11 }, (_, index) => ({ value: String(index + 1), label: `${index + 1} класс` })),
];

export function TutorSearchPanel({
  subject,
  setSubject,
  grade,
  setGrade,
  subjectOptions,
  onSearch,
}: {
  subject: string;
  setSubject: (value: string) => void;
  grade: string;
  setGrade: (value: string) => void;
  subjectOptions: SubjectOption[];
  onSearch: () => void;
}) {
  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
          <Search size={13} />
          Поиск репетитора
        </div>
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          Найдите репетитора <span className="text-primary">под свой запрос</span>
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Выберите параметры поиска и нажмите кнопку, чтобы увидеть подходящие карточки.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_180px_auto]">
          <label className="block">
            <span className="mb-1 block text-sm text-muted-foreground">Предмет</span>
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-xl border border-border bg-input-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">Любой предмет</option>
              {subjectOptions.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-muted-foreground">Класс</span>
            <select
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              className="w-full rounded-xl border border-border bg-input-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              {GRADES.map((item) => (
                <option key={item.value || "all-grade"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onSearch}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Search size={16} />
            Найти репетитора
          </button>
        </div>
      </div>
    </>
  );
}
