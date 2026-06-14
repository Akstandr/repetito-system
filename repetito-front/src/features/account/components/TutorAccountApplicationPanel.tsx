import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, Send } from "lucide-react";
import { MARKETPLACE_API_BASE_URL, SubjectOption, formatErrorMessage, getAuthHeaders, readErrorMessage } from "../../../shared/api";

type Status = "PENDING" | "APPROVED" | "REJECTED";

interface Application {
  id: number;
  fullName: string;
  age: number;
  subjects: string[];
  pricePerLesson: number;
  status: Status;
  rejectionReason: string | null;
  createdAt: string;
}

export function TutorAccountApplicationPanel({
  fullName,
  subjects,
  compact = false,
}: {
  fullName: string;
  subjects: SubjectOption[];
  compact?: boolean;
}) {
  const [items, setItems] = useState<Application[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState(fullName);
  const [age, setAge] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = items[0] ?? null;
  const pending = latest?.status === "PENDING";
  const canApply = !pending && latest?.status !== "APPROVED";
  const subjectLabels = useMemo(() => new Map(subjects.map((item) => [item.value, item.label])), [subjects]);

  async function load() {
    const response = await fetch(`${MARKETPLACE_API_BASE_URL}/tutor-account-applications/my`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error(await readErrorMessage(response, "Не удалось загрузить заявку"));
    const result = await response.json() as Application[];
    setItems(result);
    if (result[0]?.status === "APPROVED") window.dispatchEvent(new Event("auth-state-changed"));
  }

  useEffect(() => {
    load().catch((reason) => setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось загрузить заявку")))
      .finally(() => setLoading(false));
  }, []);

  async function submit() {
    if (!name.trim() || !age || selectedSubjects.length === 0 || !price) {
      setError("Заполните имя, возраст, предметы и стоимость занятия");
      return;
    }
    setSending(true); setError(null);
    try {
      const response = await fetch(`${MARKETPLACE_API_BASE_URL}/tutor-account-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ fullName: name.trim(), age: Number(age), subjects: selectedSubjects, pricePerLesson: Number(price) }),
      });
      if (!response.ok) throw new Error(await readErrorMessage(response, "Не удалось отправить заявку"));
      await load();
      setFormOpen(false);
    } catch (reason) {
      setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось отправить заявку"));
    } finally { setSending(false); }
  }

  if (loading) return <div className="flex justify-center rounded-2xl border border-border bg-secondary p-6"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={`rounded-2xl border border-border bg-secondary ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Аккаунт репетитора</div>
          <div className="mt-1 text-sm text-muted-foreground">Создаётся после проверки заявки администратором.</div>
        </div>
        <BookOpen size={20} className="shrink-0 text-primary" />
      </div>

      {latest && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm">
          <div className="font-medium">
            {latest.status === "PENDING" ? "На рассмотрении" : latest.status === "APPROVED" ? "Одобрена" : "Отклонена"}
          </div>
          <div className="mt-1 text-muted-foreground">{latest.subjects.map((item) => subjectLabels.get(item) ?? item).join(", ")} · {latest.pricePerLesson.toLocaleString("ru-RU")} ₽/час</div>
          {latest.rejectionReason && <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-destructive">Причина: {latest.rejectionReason}</div>}
        </div>
      )}

      {pending && <p className="mt-4 text-sm text-muted-foreground">Ваша заявка уже находится на рассмотрении.</p>}
      {canApply && !formOpen && (
        <button type="button" onClick={() => setFormOpen(true)} className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {latest?.status === "REJECTED" ? "Подать новую заявку" : "Подать заявку"}
        </button>
      )}

      {formOpen && (
        <div className="mt-4 space-y-4">
          <label className="block text-sm">Имя и фамилия<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-foreground" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">Возраст<input inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-foreground" /></label>
            <label className="block text-sm">Стоимость за час<input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-foreground" /></label>
          </div>
          <div><div className="text-sm">Предметы</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{subjects.map((subject) => <label key={subject.value} className="flex items-center gap-2 rounded-xl border border-border bg-input-background px-3 py-2 text-sm"><input type="checkbox" checked={selectedSubjects.includes(subject.value)} onChange={(event) => setSelectedSubjects((current) => event.target.checked ? [...current, subject.value] : current.filter((item) => item !== subject.value))} />{subject.label}</label>)}</div></div>
          {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="flex gap-2"><button type="button" disabled={sending} onClick={() => void submit()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground disabled:opacity-50"><Send size={15} />{sending ? "Отправляем..." : "Отправить на модерацию"}</button><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm">Отмена</button></div>
        </div>
      )}
      {!formOpen && error && <div className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    </div>
  );
}
