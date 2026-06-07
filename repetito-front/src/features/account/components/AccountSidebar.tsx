import type { ComponentType } from "react";

export function AccountSidebar({
  displayName,
  userEmail,
  navItems,
  activeSection,
  onNavigate,
}: {
  displayName: string;
  userEmail: string;
  navItems: Array<{
    key: string;
    label: string;
    icon: ComponentType<{ size?: number }>;
    badge?: string | number;
  }>;
  activeSection: string;
  onNavigate: (key: string) => void;
}) {
  return (
    <aside className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 lg:mb-5">
        <div className="text-sm text-muted-foreground">Профиль</div>
        <div className="mt-1 truncate text-lg font-semibold">{displayName}</div>
        <div className="mt-1 truncate text-sm text-muted-foreground">{userEmail}</div>
      </div>

      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
