import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, clearAuthToken, getAuthHeaders, getCookieValue, readErrorMessage } from "./api";

export type AccountType = "student" | "tutor";

export interface UserView {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface StudentProfileView {
  description: string | null;
  subjects: string | null;
  gradeLevel: string | null;
  format: string | null;
}

export interface TutorProfileView {
  description: string | null;
  subjects: string | null;
  experience: string | null;
  price: string | number | null;
  education: string | null;
  achievements: string | null;
}

export interface AccountView {
  id: number;
  type: AccountType;
  createdAt: string;
  publicProfile: boolean;
  active: boolean;
  studentProfile: StudentProfileView | null;
  tutorProfile: TutorProfileView | null;
}

export interface AuthResponse {
  token: string;
  user: UserView;
  accounts: AccountView[];
  activeAccount: AccountView | null;
  requiresAccountSelection: boolean;
}

function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useAuthSession() {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    if (!getCookieValue("auth_token")) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          clearAuthToken();
          setSession(null);
          return;
        }

        throw new Error(await readErrorMessage(response, "Не удалось загрузить сессию"));
      }

      setSession((await response.json()) as AuthResponse);
    } catch {
      // Keep the existing cookie so a transient backend outage does not log the user out.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();

    const handleAuthChange = () => {
      void refreshSession();
    };

    const handleFocus = () => {
      void refreshSession();
    };

    window.addEventListener("auth-state-changed", handleAuthChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("auth-state-changed", handleAuthChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshSession]);

  const logout = useCallback(
    (redirectToHome = true) => {
      clearAuthToken();
      setSession(null);
      window.dispatchEvent(new Event("auth-state-changed"));

      if (redirectToHome) {
        navigateTo("/");
      }
    },
    [],
  );

  return {
    session,
    setSession,
    isLoading,
    refreshSession,
    logout,
  };
}
