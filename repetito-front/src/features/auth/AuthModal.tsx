import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import { API_BASE_URL, readErrorMessage, setCookieToken } from "../../shared/api";
import { AccountRoleSelect } from "./components";

type AuthMode = "login" | "register" | "select";
type AccountType = "student" | "tutor";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface UserView {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface AccountView {
  id: number;
  type: AccountType;
  createdAt: string;
  active: boolean;
  studentProfile: Record<string, unknown> | null;
  tutorProfile: Record<string, unknown> | null;
}

interface AuthResponse {
  token: string;
  user: UserView;
  accounts: AccountView[];
  activeAccount: AccountView | null;
  requiresAccountSelection: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: Exclude<AuthMode, "select">;
}

function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}


export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAccounts, setPendingAccounts] = useState<AccountView[]>([]);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  const selectionAccounts = useMemo(
    () => pendingAccounts.filter((account) => account.type === "student" || account.type === "tutor"),
    [pendingAccounts],
  );

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setServerError(null);
      setIsLoading(false);
      setPendingAccounts([]);
      setPendingToken(null);
      loginForm.reset();
      registerForm.reset();
    }
  }, [isOpen, initialMode, loginForm, registerForm]);

  function switchMode(newMode: Exclude<AuthMode, "select">) {
    setMode(newMode);
    setServerError(null);
    setPendingAccounts([]);
    setPendingToken(null);
    loginForm.reset();
    registerForm.reset();
  }

  function finishAuth(response: AuthResponse) {
    setCookieToken(response.token);
    window.dispatchEvent(new Event("auth-state-changed"));

    if (response.requiresAccountSelection && response.accounts.length > 1 && !response.activeAccount) {
      setPendingAccounts(response.accounts);
      setPendingToken(response.token);
      setMode("select");
      setServerError(null);
      return;
    }

    onClose();
    navigateTo("/account");
  }

  async function handleLogin(data: LoginForm) {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Неверный email или пароль"));
      }

      finishAuth((await response.json()) as AuthResponse);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(data: RegisterForm) {
    if (data.password !== data.confirmPassword) {
      registerForm.setError("confirmPassword", { message: "Пароли не совпадают" });
      return;
    }

    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Ошибка регистрации"));
      }

      finishAuth((await response.json()) as AuthResponse);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Ошибка регистрации");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectAccount(type: AccountType) {
    if (!pendingToken) {
      setServerError("Не удалось продолжить вход. Повторите попытку.");
      return;
    }

    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/select-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pendingToken}`,
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Не удалось выбрать аккаунт"));
      }

      finishAuth((await response.json()) as AuthResponse);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Не удалось выбрать аккаунт");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100vw-24px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card p-4 shadow-2xl focus:outline-none sm:p-8">
          <Dialog.Close className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X size={16} />
          </Dialog.Close>

          {mode !== "select" && (
            <div className="mb-6 flex rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex-1 rounded-lg py-2 text-sm transition-all duration-200 ${
                  mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Войти
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`flex-1 rounded-lg py-2 text-sm transition-all duration-200 ${
                  mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Регистрация
              </button>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} noValidate>
              <Dialog.Title className="mb-1">С возвращением</Dialog.Title>
              <Dialog.Description className="mb-6 text-sm text-muted-foreground">Войдите в свой аккаунт</Dialog.Description>

              <div className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-sm text-foreground">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="ivan@example.com"
                    autoComplete="email"
                    className={`w-full rounded-xl border bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      loginForm.formState.errors.email ? "border-destructive" : "border-border"
                    }`}
                    {...loginForm.register("email", {
                      required: "Введите email",
                      pattern: { value: /\S+@\S+\.\S+/, message: "Некорректный email" },
                    })}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-sm text-foreground">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`w-full rounded-xl border bg-input-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        loginForm.formState.errors.password ? "border-destructive" : "border-border"
                      }`}
                      {...loginForm.register("password", {
                        required: "Введите пароль",
                        minLength: { value: 6, message: "Минимум 6 символов" },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              {serverError && <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Войти
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} noValidate>
              <Dialog.Title className="mb-1">Создать аккаунт</Dialog.Title>
              <Dialog.Description className="mb-5 text-sm text-muted-foreground">После регистрации вы сможете создать аккаунты ученика и репетитора в кабинете</Dialog.Description>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="reg-firstname" className="mb-1.5 block text-sm text-foreground">
                      Имя
                    </label>
                    <input
                      id="reg-firstname"
                      type="text"
                      placeholder="Иван"
                      className={`w-full rounded-xl border bg-input-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        registerForm.formState.errors.firstName ? "border-destructive" : "border-border"
                      }`}
                      {...registerForm.register("firstName", { required: "Введите имя" })}
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-lastname" className="mb-1.5 block text-sm text-foreground">
                      Фамилия
                    </label>
                    <input
                      id="reg-lastname"
                      type="text"
                      placeholder="Иванов"
                      className={`w-full rounded-xl border bg-input-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        registerForm.formState.errors.lastName ? "border-destructive" : "border-border"
                      }`}
                      {...registerForm.register("lastName", { required: "Введите фамилию" })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="mb-1.5 block text-sm text-foreground">
                    Email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="ivan@example.com"
                    autoComplete="email"
                    className={`w-full rounded-xl border bg-input-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      registerForm.formState.errors.email ? "border-destructive" : "border-border"
                    }`}
                    {...registerForm.register("email", {
                      required: "Введите email",
                      pattern: { value: /\S+@\S+\.\S+/, message: "Некорректный email" },
                    })}
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="mb-1.5 block text-sm text-foreground">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Минимум 8 символов"
                      autoComplete="new-password"
                      className={`w-full rounded-xl border bg-input-background px-4 py-2.5 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        registerForm.formState.errors.password ? "border-destructive" : "border-border"
                      }`}
                      {...registerForm.register("password", {
                        required: "Введите пароль",
                        minLength: { value: 8, message: "Минимум 8 символов" },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-confirm" className="mb-1.5 block text-sm text-foreground">
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`w-full rounded-xl border bg-input-background px-4 py-2.5 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        registerForm.formState.errors.confirmPassword ? "border-destructive" : "border-border"
                      }`}
                      {...registerForm.register("confirmPassword", { required: "Подтвердите пароль" })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {serverError && <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{serverError}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Создать аккаунт
              </button>
            </form>
          )}

          {mode === "select" && (
            <AccountRoleSelect
              selectionAccounts={selectionAccounts}
              isLoading={isLoading}
              onSelect={handleSelectAccount}
              serverError={serverError}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
