export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";
function deriveMarketplaceBaseUrl(baseUrl: string) {
  try {
    const url = new URL(baseUrl);
    if (url.pathname.endsWith("/api/v1")) {
      url.pathname = url.pathname.replace(/\/api\/v1\/?$/, "/api");
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    // Fallback below.
  }

  return "http://localhost:8080/api";
}

export const MARKETPLACE_API_BASE_URL =
  import.meta.env.VITE_MARKETPLACE_API_URL ??
  deriveMarketplaceBaseUrl(API_BASE_URL);

export interface SubjectOption {
  value: string;
  label: string;
}

export const DEFAULT_SUBJECT_OPTIONS: SubjectOption[] = [
  { value: "math", label: "Математика" },
  { value: "russian", label: "Русский язык" },
  { value: "english", label: "Английский язык" },
  { value: "physics", label: "Физика" },
  { value: "chemistry", label: "Химия" },
  { value: "biology", label: "Биология" },
  { value: "informatics", label: "Информатика" },
  { value: "history", label: "История" },
  { value: "social-studies", label: "Обществознание" },
  { value: "literature", label: "Литература" },
];

export function getCookieValue(name: string) {
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function setCookieToken(token: string) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  document.cookie = `auth_token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

export function clearAuthToken() {
  document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
}

export function getAuthHeaders() {
  const token = getCookieValue("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function readErrorMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  return body.message ?? fallback;
}

export async function fetchSubjectOptions() {
  const response = await fetch(`${MARKETPLACE_API_BASE_URL}/subjects`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Не удалось загрузить список предметов"));
  }

  return (await response.json()) as SubjectOption[];
}
