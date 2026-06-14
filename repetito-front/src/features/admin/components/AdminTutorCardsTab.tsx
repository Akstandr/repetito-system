import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Search, X } from "lucide-react";
import { DEFAULT_SUBJECT_OPTIONS, SubjectOption, fetchSubjectOptions, formatErrorMessage } from "../../../shared/api";
import { useAutoClearMessage } from "../../../shared/useAutoClearMessage";
import { AdminTutorCard, PageResponse, deactivateAdminTutorCard, fetchAdminTutorCards } from "../api";
import { AdminPagination } from "./AdminPagination";

const emptyPage: PageResponse<AdminTutorCard> = { items: [], page: 1, limit: 20, total: 0, totalPages: 0 };

export function AdminTutorCardsTab() {
  const [query, setQuery] = useState(""); const [submittedQuery, setSubmittedQuery] = useState("");
  const [subject, setSubject] = useState(""); const [active, setActive] = useState(""); const [page, setPage] = useState(1);
  const [subjects, setSubjects] = useState<SubjectOption[]>(DEFAULT_SUBJECT_OPTIONS); const [data, setData] = useState(emptyPage);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [selected, setSelected] = useState<AdminTutorCard | null>(null); const [hidingId, setHidingId] = useState<number | null>(null);
  useAutoClearMessage(error, setError);
  useEffect(() => { fetchSubjectOptions().then(setSubjects).catch(() => undefined); }, []);
  useEffect(() => { setLoading(true); fetchAdminTutorCards(submittedQuery, subject, active, page).then(setData).catch((reason) => setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось загрузить карточки"))).finally(() => setLoading(false)); }, [submittedQuery, subject, active, page]);
  const subjectLabel = (value: string) => subjects.find((item) => item.value === value)?.label ?? value;

  async function hideCard(card: AdminTutorCard) {
    if (!window.confirm(`Скрыть карточку «${card.title}» из поиска?`)) return;
    setHidingId(card.id);
    try { const updated = await deactivateAdminTutorCard(card.id); setData((current) => ({ ...current, items: current.items.map((item) => item.id === updated.id ? updated : item) })); setSelected((current) => current?.id === updated.id ? updated : current); }
    catch (reason) { setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось скрыть карточку")); }
    finally { setHidingId(null); }
  }

  return <section>
    <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSubmittedQuery(query); }} className="mb-5 grid gap-2 lg:grid-cols-[minmax(220px,1fr)_220px_180px_auto]">
      <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название или репетитор" className="h-11 w-full rounded-xl border border-border bg-input-background pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary" /></label>
      <select value={subject} onChange={(event) => { setSubject(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-border bg-input-background px-3 text-sm text-foreground"><option value="">Все предметы</option>{subjects.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      <select value={active} onChange={(event) => { setActive(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-border bg-input-background px-3 text-sm text-foreground"><option value="">Все статусы</option><option value="true">Активные</option><option value="false">Скрытые</option></select>
      <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Найти</button>
    </form>
    {error && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : <div className="overflow-x-auto rounded-2xl border border-border"><table className="min-w-[950px] w-full text-left text-sm"><thead className="bg-secondary/70 text-muted-foreground"><tr><th className="p-4">Карточка</th><th className="p-4">Владелец</th><th className="p-4">Предмет</th><th className="p-4">Цена</th><th className="p-4">Статус</th><th className="p-4"></th></tr></thead><tbody>{data.items.map((card) => <tr key={card.id} className="border-t border-border"><td className="max-w-xs p-4 font-medium">{card.title}</td><td className="p-4"><div>{card.tutorFirstName} {card.tutorLastName}</div><div className="mt-1 text-xs text-muted-foreground">{card.tutorEmail}</div></td><td className="p-4">{subjectLabel(card.subject)}</td><td className="p-4">{card.pricePerLesson.toLocaleString("ru-RU")} ₽</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs ${card.isActive ? "bg-emerald-500/15 text-emerald-600" : "bg-secondary text-muted-foreground"}`}>{card.isActive ? "Активна" : "Скрыта"}</span></td><td className="p-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(card)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-secondary" title="Подробнее"><Eye size={15} /></button>{card.isActive && <button type="button" disabled={hidingId === card.id} onClick={() => void hideCard(card)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-50" title="Скрыть"><EyeOff size={15} /></button>}</div></td></tr>)}</tbody></table>{!data.items.length && <div className="p-10 text-center text-sm text-muted-foreground">Карточки не найдены</div>}</div>}
    <AdminPagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
    {selected && <div className="motion-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="motion-modal max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl"><div className="flex justify-between gap-3"><div><h3 className="text-xl font-semibold">{selected.title}</h3><p className="mt-1 text-sm text-muted-foreground">{selected.tutorFirstName} {selected.tutorLastName}</p></div><button type="button" aria-label="Закрыть" onClick={() => setSelected(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary"><X size={17} /></button></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{selected.description || "Описание не заполнено"}</p><div className="mt-5 grid gap-3 rounded-xl bg-secondary/60 p-4 text-sm sm:grid-cols-2"><div>Предмет: <b>{subjectLabel(selected.subject)}</b></div><div>Стоимость: <b>{selected.pricePerLesson.toLocaleString("ru-RU")} ₽</b></div><div>Формат: <b>{selected.format}</b></div><div>Классы: <b>{selected.supportedGrades.join(", ") || "не указаны"}</b></div></div>{selected.isActive && <button type="button" onClick={() => void hideCard(selected)} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10"><EyeOff size={16} />Скрыть карточку</button>}</div></div>}
  </section>;
}
