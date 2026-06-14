import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Loader2, LogOut, ShieldCheck, Users } from "lucide-react";
import { ThemeToggle } from "../../shared/ThemeToggle";
import { getCookieValue } from "../../shared/api";
import { useAuthSession } from "../../shared/useAuthSession";
import { AdminAccountsTab } from "./components/AdminAccountsTab";
import { AdminTutorCardsTab } from "./components/AdminTutorCardsTab";
import { AdminUsersTab } from "./components/AdminUsersTab";

type AdminTab = "users" | "accounts" | "cards";

const tabs = [
  { id: "users" as const, label: "Пользователи", icon: Users },
  { id: "accounts" as const, label: "Аккаунты", icon: ShieldCheck },
  { id: "cards" as const, label: "Карточки репетиторов", icon: CreditCard },
];

function navigateTo(path: string, replace = false) {
  if (replace) window.history.replaceState({}, "", path);
  else window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function AdminPage() {
  const { session, isLoading, logout } = useAuthSession();
  const [tab, setTab] = useState<AdminTab>("users");

  useEffect(() => {
    if (!isLoading && !session && !getCookieValue("auth_token")) navigateTo("/", true);
  }, [isLoading, session]);

  if (isLoading) return <div className="app-gradient-bg flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!session) return null;

  if (!session.user.isAdmin) {
    return <div className="app-gradient-bg flex min-h-screen items-center justify-center p-4 text-foreground"><div className="w-full max-w-lg rounded-2xl border border-border bg-card p-7 text-center shadow-lg"><ShieldCheck size={32} className="mx-auto text-destructive" /><h1 className="mt-4 text-2xl font-semibold">Доступ запрещён</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Административная панель доступна только администраторам системы.</p><button type="button" onClick={() => navigateTo("/")} className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">На главную</button></div></div>;
  }

  return <div className="app-gradient-bg min-h-screen text-foreground">
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md"><div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-6"><button type="button" onClick={() => navigateTo("/")} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><ArrowLeft size={16} />На главную</button><div className="hidden items-center gap-2 text-sm font-semibold sm:flex"><ShieldCheck size={17} className="text-primary" />Админ-панель</div><div className="flex items-center gap-2"><ThemeToggle /><span className="hidden max-w-48 truncate rounded-full bg-secondary px-3 py-1.5 text-sm sm:block">{session.user.firstName} {session.user.lastName}</span><button type="button" aria-label="Выйти" onClick={() => logout()} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"><LogOut size={16} /></button></div></div></header>
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10"><div className="mb-6"><p className="text-sm font-medium text-primary">Управление системой</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Административная панель</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Пользователи, аккаунты и опубликованные предложения репетиторов.</p></div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{tabs.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${tab === item.id ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"}`}><Icon size={16} />{item.label}</button>; })}</div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">{tab === "users" && <AdminUsersTab />}{tab === "accounts" && <AdminAccountsTab />}{tab === "cards" && <AdminTutorCardsTab />}</div>
    </main>
  </div>;
}
