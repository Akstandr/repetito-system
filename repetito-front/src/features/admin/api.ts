import { MARKETPLACE_API_BASE_URL, getAuthHeaders, readErrorMessage } from "../../shared/api";

export type AdminAccountType = "STUDENT" | "TUTOR";

export interface PageResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  accounts: Array<{ id: number; type: AdminAccountType }>;
  createdAt: string;
}

export interface AdminAccount {
  id: number;
  type: AdminAccountType;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  relationsCount: number;
  applicationsCount: number;
  lessonsCount: number;
  createdAt: string;
}

export interface AdminRelation {
  accountId: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  applicationId: number;
  acceptedAt: string;
}

export interface AdminTutorCard {
  id: number;
  tutorAccountId: number;
  tutorFirstName: string;
  tutorLastName: string;
  tutorEmail: string;
  title: string;
  description: string | null;
  subject: string;
  pricePerLesson: number;
  supportedGrades: number[];
  format: "ONLINE" | "OFFLINE" | "MIXED";
  isActive: boolean;
  moderationStatus: "PENDING_MODERATION" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TutorAccountApplication {
  id: number; userId: number; email: string; fullName: string; age: number; subjects: string[];
  pricePerLesson: number; status: "PENDING" | "APPROVED" | "REJECTED"; rejectionReason: string | null;
  createdAt: string; reviewedAt: string | null;
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${MARKETPLACE_API_BASE_URL}/admin${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Не удалось выполнить запрос администратора"));
  }
  return (await response.json()) as T;
}

export function fetchAdminUsers(query: string, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (query.trim()) params.set("query", query.trim());
  return adminFetch<PageResponse<AdminUser>>(`/users?${params}`);
}

export function fetchAdminAccounts(type: "" | AdminAccountType, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (type) params.set("type", type);
  return adminFetch<PageResponse<AdminAccount>>(`/accounts?${params}`);
}

export function fetchAdminRelations(account: AdminAccount) {
  const path = account.type === "TUTOR"
    ? `/tutors/${account.id}/students`
    : `/students/${account.id}/tutors`;
  return adminFetch<AdminRelation[]>(path);
}

export function fetchAdminTutorCards(query: string, subject: string, active: string, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (query.trim()) params.set("query", query.trim());
  if (subject.trim()) params.set("subject", subject.trim());
  if (active) params.set("active", active);
  return adminFetch<PageResponse<AdminTutorCard>>(`/tutor-cards?${params}`);
}

export function deactivateAdminTutorCard(id: number) {
  return adminFetch<AdminTutorCard>(`/tutor-cards/${id}`, { method: "DELETE" });
}

export function fetchTutorAccountApplications(status: string, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  return adminFetch<PageResponse<TutorAccountApplication>>(`/tutor-account-applications?${params}`);
}

export function approveTutorAccountApplication(id: number) {
  return adminFetch<TutorAccountApplication>(`/tutor-account-applications/${id}/approve`, { method: "PATCH" });
}

export function rejectTutorAccountApplication(id: number, reason: string) {
  return adminFetch<TutorAccountApplication>(`/tutor-account-applications/${id}/reject`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
}

export function fetchTutorCardsForModeration(page: number) {
  const params = new URLSearchParams({ page: String(page), limit: "20", moderationStatus: "PENDING_MODERATION" });
  return adminFetch<PageResponse<AdminTutorCard>>(`/tutor-cards?${params}`);
}

export function approveTutorCard(id: number) {
  return adminFetch<AdminTutorCard>(`/tutor-cards/${id}/approve`, { method: "PATCH" });
}

export function rejectTutorCard(id: number, reason: string) {
  return adminFetch<AdminTutorCard>(`/tutor-cards/${id}/reject`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
}
