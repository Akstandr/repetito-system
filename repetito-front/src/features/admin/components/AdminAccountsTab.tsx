import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Users, X } from "lucide-react";
import { formatErrorMessage } from "../../../shared/api";
import { useAutoClearMessage } from "../../../shared/useAutoClearMessage";
import { AdminAccount, AdminAccountType, AdminRelation, PageResponse, fetchAdminAccounts, fetchAdminRelations } from "../api";
import { AdminPagination } from "./AdminPagination";

const emptyPage: PageResponse<AdminAccount> = { items: [], page: 1, limit: 20, total: 0, totalPages: 0 };

export function AdminAccountsTab({ onMessage }: { onMessage: (account: AdminAccount) => void }) {
  const [type, setType] = useState<"" | AdminAccountType>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminAccount | null>(null);
  const [relations, setRelations] = useState<AdminRelation[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  useAutoClearMessage(error, setError);

  useEffect(() => {
    setLoading(true);
    fetchAdminAccounts(type, page).then(setData).catch((reason) => setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось загрузить аккаунты"))).finally(() => setLoading(false));
  }, [type, page]);

  async function openRelations(account: AdminAccount) {
    setSelected(account); setRelationsLoading(true); setRelations([]);
    try { setRelations(await fetchAdminRelations(account)); }
    catch (reason) { setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось загрузить связи")); }
    finally { setRelationsLoading(false); }
  }

  return <section>
    <div className="mb-5 flex flex-wrap gap-2">{[["", "Все"], ["STUDENT", "Ученики"], ["TUTOR", "Репетиторы"]].map(([value, label]) => <button key={value} type="button" onClick={() => { setType(value as "" | AdminAccountType); setPage(1); }} className={`rounded-xl px-4 py-2 text-sm transition ${type === value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>{label}</button>)}</div>
    {error && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-secondary/70 text-muted-foreground"><tr><th className="p-4">Владелец</th><th className="p-4">Тип</th><th className="p-4">Связи</th><th className="p-4">Заявки</th><th className="p-4">Занятия</th><th className="p-4"></th></tr></thead>
      <tbody>{data.items.map((account) => <tr key={account.id} className="border-t border-border"><td className="p-4"><div className="font-medium">{account.firstName} {account.lastName}</div><div className="mt-1 text-xs text-muted-foreground">{account.email}</div></td><td className="p-4">{account.type === "TUTOR" ? "Репетитор" : "Ученик"}</td><td className="p-4">{account.relationsCount}</td><td className="p-4">{account.applicationsCount}</td><td className="p-4">{account.lessonsCount}</td><td className="p-4 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => onMessage(account)} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-secondary"><MessageCircle size={14} />Написать</button><button type="button" onClick={() => void openRelations(account)} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs transition hover:bg-secondary"><Users size={14} />{account.type === "TUTOR" ? "Показать учеников" : "Показать репетиторов"}</button></div></td></tr>)}</tbody></table>
      {!data.items.length && <div className="p-10 text-center text-sm text-muted-foreground">Аккаунты не найдены</div>}
    </div>}
    <AdminPagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
    {selected && <div className="motion-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="motion-modal w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold">{selected.type === "TUTOR" ? "Ученики репетитора" : "Репетиторы ученика"}</h3><p className="mt-1 text-sm text-muted-foreground">{selected.firstName} {selected.lastName}</p></div><button type="button" aria-label="Закрыть" onClick={() => setSelected(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary"><X size={17} /></button></div><div className="mt-5 max-h-[55vh] space-y-2 overflow-y-auto">{relationsLoading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div> : relations.length ? relations.map((relation) => <div key={relation.accountId} className="rounded-xl border border-border p-4"><div className="font-medium">{relation.firstName} {relation.lastName}</div><div className="mt-1 text-sm text-muted-foreground">{relation.email}</div><div className="mt-2 text-xs text-muted-foreground">Предмет: {relation.subject} · заявка #{relation.applicationId}</div></div>) : <div className="py-8 text-center text-sm text-muted-foreground">Принятых связей пока нет</div>}</div></div></div>}
  </section>;
}
