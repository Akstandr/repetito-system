import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { formatErrorMessage } from "../../../shared/api";
import { useAutoClearMessage } from "../../../shared/useAutoClearMessage";
import { AdminUser, PageResponse, fetchAdminUsers } from "../api";
import { AdminPagination } from "./AdminPagination";

const emptyPage: PageResponse<AdminUser> = { items: [], page: 1, limit: 20, total: 0, totalPages: 0 };

export function AdminUsersTab({ onMessage }: { onMessage: (user: AdminUser) => void }) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useAutoClearMessage(error, setError);

  useEffect(() => {
    setLoading(true);
    fetchAdminUsers(submittedQuery, page)
      .then(setData)
      .catch((reason) => setError(formatErrorMessage(reason instanceof Error ? reason.message : "", "Не удалось загрузить пользователей")))
      .finally(() => setLoading(false));
  }, [submittedQuery, page]);

  return (
    <section>
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSubmittedQuery(query); }} className="mb-5 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Email, имя или фамилия" className="h-11 w-full rounded-xl border border-border bg-input-background pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary" />
        </label>
        <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Найти</button>
      </form>
      {error && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div> : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-[780px] w-full text-left text-sm">
            <thead className="bg-secondary/70 text-muted-foreground"><tr><th className="p-4">Пользователь</th><th className="p-4">Email</th><th className="p-4">Аккаунты</th><th className="p-4">Регистрация</th><th className="p-4"></th></tr></thead>
            <tbody>{data.items.map((user) => <tr key={user.id} className="border-t border-border">
              <td className="p-4 font-medium"><span className="inline-flex items-center gap-2">{user.firstName} {user.lastName}{user.isAdmin && <ShieldCheck size={15} className="text-primary" />}</span></td>
              <td className="p-4 text-muted-foreground">{user.email}</td>
              <td className="p-4"><div className="flex flex-wrap gap-1.5">{user.accounts.length ? user.accounts.map((account) => <span key={account.id} className="rounded-full bg-secondary px-2.5 py-1 text-xs">{account.type === "TUTOR" ? "Репетитор" : "Ученик"}</span>) : <span className="text-muted-foreground">Нет аккаунтов</span>}</div></td>
              <td className="p-4 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString("ru-RU")}</td>
              <td className="p-4 text-right">{!user.isAdmin && <button type="button" onClick={() => onMessage(user)} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs hover:bg-secondary"><MessageCircle size={14} />Написать</button>}</td>
            </tr>)}</tbody>
          </table>
          {!data.items.length && <div className="p-10 text-center text-sm text-muted-foreground">Пользователи не найдены</div>}
        </div>
      )}
      <AdminPagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </section>
  );
}
