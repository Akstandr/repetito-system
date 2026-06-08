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

const ERROR_TRANSLATIONS: Array<[RegExp, string]> = [
  [/bad credentials/i, "Неверный email или пароль"],
  [/user already exists/i, "Пользователь с таким email уже существует"],
  [/account already exists/i, "Такой аккаунт уже создан"],
  [/user not found/i, "Пользователь не найден"],
  [/account not found/i, "Аккаунт не найден"],
  [/profile not found/i, "Профиль не найден"],
  [/select an account first/i, "Сначала выберите активный аккаунт"],
  [/selected account type does not match/i, "Тип выбранного аккаунта не подходит для этого действия"],
  [/tutor card not found/i, "Карточка репетитора не найдена"],
  [/tutor profile not found/i, "Публичный профиль репетитора не найден"],
  [/tutor has no active cards/i, "У репетитора пока нет активной карточки"],
  [/unknown subject/i, "Выберите предмет из списка"],
  [/supported grades must not be empty/i, "Выберите хотя бы один класс или категорию студентов"],
  [/cannot apply to own card/i, "Нельзя отправить заявку на собственную карточку"],
  [/application not found/i, "Заявка не найдена"],
  [/application already processed/i, "Эта заявка уже обработана"],
  [/application is not accepted/i, "Действие доступно только после принятия заявки"],
  [/conversation not found/i, "Диалог не найден"],
  [/message cannot be empty/i, "Сообщение не может быть пустым"],
  [/cannot contact your own tutor profile/i, "Нельзя написать самому себе"],
  [/create a student account first/i, "Сначала создайте аккаунт ученика"],
  [/student account does not match application/i, "Выбранный ученик не относится к этой заявке"],
  [/duration must be positive/i, "Длительность должна быть больше нуля"],
  [/price must be positive/i, "Цена должна быть больше нуля"],
  [/subject must not be blank/i, "Укажите предмет"],
  [/meeting url must start with http:\/\/ or https:\/\//i, "Ссылка на созвон должна начинаться с http:// или https://"],
  [/cannot delete card with applications/i, "Нельзя удалить карточку, по которой уже есть заявки"],
  [/cannot delete card with lessons/i, "Нельзя удалить карточку, по которой уже есть занятия"],
  [/tutor account not found/i, "Репетитор не найден"],
  [/student account not found/i, "Ученик не найден"],
  [/you can review only accepted tutors/i, "Отзыв можно оставить только репетитору, который принял вашу заявку"],
  [/review already exists/i, "Вы уже оставили отзыв этому репетитору"],
  [/review not found/i, "Отзыв не найден"],
  [/validation failed/i, "Проверьте заполнение формы"],
  [/failed to fetch|networkerror|load failed/i, "Не удалось подключиться к серверу. Проверьте, что backend запущен"],
];

const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  password: "Пароль",
  firstName: "Имя",
  lastName: "Фамилия",
  title: "Заголовок",
  description: "Описание",
  subject: "Предмет",
  price: "Цена",
  pricePerLesson: "Стоимость",
  durationMinutes: "Длительность",
  startDateTime: "Дата и время занятия",
  message: "Сообщение",
  text: "Текст",
  rating: "Оценка",
  tutorAccountId: "Репетитор",
  studentAccountId: "Ученик",
  applicationId: "Заявка",
};

function humanizeValidationMessage(message: string) {
  const fieldMatch = message.match(/^([A-Za-z][A-Za-z0-9_.-]*):\s*(.+)$/);
  if (!fieldMatch) {
    return message;
  }

  const [, field, rawRule] = fieldMatch;
  const normalizedField = field.trim();
  const lowerField = normalizedField.toLowerCase();
  const label = FIELD_LABELS[normalizedField] ?? FIELD_LABELS[lowerField] ?? "Поле";
  const rule = rawRule.toLowerCase();

  if (rule.includes("must not be blank") || rule.includes("must not be empty") || rule.includes("must not be null")) {
    if (lowerField === "text") {
      return "Нельзя отправить пустое сообщение";
    }
    if (lowerField === "message") {
      return "Напишите сообщение";
    }
    if (lowerField === "email") {
      return "Введите email";
    }
    if (lowerField === "password") {
      return "Введите пароль";
    }
    if (lowerField === "firstname") {
      return "Введите имя";
    }
    if (lowerField === "title") {
      return "Укажите название";
    }
    if (lowerField === "subject") {
      return "Укажите предмет";
    }
    if (lowerField === "studentaccountid") {
      return "Выберите ученика";
    }
    if (lowerField === "tutoraccountid") {
      return "Выберите репетитора";
    }
    if (lowerField === "applicationid") {
      return "Выберите заявку";
    }
    return `${label}: заполните это поле`;
  }
  if (rule.includes("must be greater than 0") || rule.includes("positive")) {
    return `${label}: значение должно быть больше нуля`;
  }
  if (rule.includes("size must be between")) {
    return `${label}: проверьте длину значения`;
  }
  if (rule.includes("must be a well-formed email")) {
    return "Введите корректный email";
  }

  return `${label}: ${rawRule}`;
}

export function formatErrorMessage(message: unknown, fallback = "Что-то пошло не так") {
  if (typeof message !== "string" || !message.trim()) {
    return fallback;
  }

  const normalized = message.trim();
  const translatedValidation = humanizeValidationMessage(normalized);
  if (translatedValidation !== normalized) {
    return translatedValidation;
  }

  const translation = ERROR_TRANSLATIONS.find(([pattern]) => pattern.test(normalized));
  return translation?.[1] ?? normalized;
}

export async function readErrorMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  const message =
    body.message ??
    body.detail ??
    body.error ??
    (Array.isArray(body.errors) ? body.errors.map((item: unknown) => String(item)).join(". ") : "");

  if (message) {
    return formatErrorMessage(message, fallback);
  }

  if (response.status === 401) {
    return "Войдите в аккаунт, чтобы выполнить это действие";
  }
  if (response.status === 403) {
    return "У вас нет доступа к этому действию";
  }
  if (response.status === 404) {
    return "Запрашиваемые данные не найдены";
  }
  if (response.status >= 500) {
    return "На сервере произошла ошибка. Попробуйте позже";
  }

  return fallback;
}

export async function fetchSubjectOptions() {
  const response = await fetch(`${MARKETPLACE_API_BASE_URL}/subjects`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Не удалось загрузить список предметов"));
  }

  return (await response.json()) as SubjectOption[];
}
