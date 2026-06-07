import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Check,
    CheckCheck,
    ChevronRight,
    Edit3,
    EyeOff,
    GraduationCap,
    MessageCircle,
    Plus,
    Save,
    Settings,
    Trash2,
    Users,
    UserRound,
} from "lucide-react";
import {
    API_BASE_URL,
    DEFAULT_SUBJECT_OPTIONS,
    MARKETPLACE_API_BASE_URL,
    getAuthHeaders,
    fetchSubjectOptions,
    readErrorMessage,
    setCookieToken,
} from "../../shared/api";
import type { SubjectOption } from "../../shared/api";
import { markdownToSafeHtml } from "../../shared/markdown";
import { AuthResponse, useAuthSession } from "../../shared/useAuthSession";
import { AccountHeader, AccountSidebar } from "./components";

type AccountType = "student" | "tutor";
type SectionKey =
    | "profile"
    | "lessons"
    | "contacts"
    | "applications"
    | "messages"
    | "cards"
    | "students"
    | "reviews"
    | "settings";

type TutorCardFormat = "online" | "offline" | "mixed";
type ApplicationStatus = "SENT" | "PENDING" | "ACCEPTED" | "REJECTED";
type LessonStatus = "PLANNED" | "COMPLETED" | "CANCELLED";
type LessonFilter = "all" | "past" | "cancelled" | "upcoming";

interface StudentProfileView {
    description: string | null;
    subjects: string | null;
    gradeLevel: string | null;
    format: string | null;
}

interface TutorProfileView {
    description: string | null;
    subjects: string | null;
    experience: string | null;
    price: string | number | null;
    education: string | null;
    achievements: string | null;
}

interface TutorCardView {
    id: number;
    tutorAccountId: number;
    title: string;
    description: string | null;
    subject: string;
    pricePerLesson: number;
    supportedGrades: number[];
    format: TutorCardFormat;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    tutor: { id: number; firstName: string; lastName: string };
}

interface ApplicationView {
    id: number;
    tutorCard: TutorCardView;
    studentAccountId: number;
    tutorAccountId: number;
    studentFirstName: string;
    studentLastName: string;
    tutorFirstName: string;
    tutorLastName: string;
    status: ApplicationStatus;
    message: string | null;
    conversationId: number | null;
    createdAt: string;
    updatedAt: string;
}

interface ConversationView {
    id: number;
    applicationId: number;
    studentAccountId: number;
    tutorAccountId: number;
    studentFirstName: string;
    studentLastName: string;
    tutorFirstName: string;
    tutorLastName: string;
    application: ApplicationView;
    lastMessageText: string | null;
    lastMessageAt: string | null;
    unreadMessagesCount: number;
    createdAt: string;
}

interface MessageView {
    id: number;
    conversationId: number;
    senderAccountId: number;
    senderFirstName: string;
    senderLastName: string;
    senderType: AccountType;
    text: string;
    readAt: string | null;
    createdAt: string;
}

interface LessonView {
    id: number;
    tutorAccountId: number;
    studentAccountId: number;
    applicationId: number;
    tutorCardTitle: string;
    studentFirstName: string;
    studentLastName: string;
    tutorFirstName: string;
    tutorLastName: string;
    subject: string;
    startDateTime: string;
    durationMinutes: number;
    price: number;
    videoMeetingUrl: string | null;
    status: LessonStatus;
    createdAt: string;
    updatedAt: string;
}

interface TutorStudentView {
    studentAccountId: number;
    studentFirstName: string;
    studentLastName: string;
    subject: string;
    applicationId: number;
    conversationId: number;
    acceptedAt: string;
}

interface StudentTutorView {
    tutorAccountId: number;
    tutorFirstName: string;
    tutorLastName: string;
    subject: string;
    applicationId: number;
    conversationId: number;
    acceptedAt: string;
}

interface ReviewView {
    id: number;
    studentAccountId: number;
    studentFirstName: string;
    studentLastName: string;
    tutorAccountId: number;
    tutorFirstName: string;
    tutorLastName: string;
    rating: number;
    text: string;
    tutorReply: string | null;
    tutorRepliedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface TutorCardForm {
    title: string;
    description: string;
    subject: string;
    pricePerLesson: string;
    format: TutorCardFormat;
    isActive: boolean;
    supportedGrades: number[];
}

interface StudentProfileForm {
    description: string;
    subjects: string;
    gradeLevel: string;
    format: string;
}

interface TutorProfileForm {
    description: string;
    subjects: string;
    experience: string;
    price: string;
    educationItems: TutorEducationForm[];
    achievements: string;
}

interface TutorEducationForm {
    institution: string;
    specialty: string;
    graduationYear: string;
}

interface MessageForm {
    text: string;
}

interface ReviewForm {
    rating: string;
    text: string;
}

interface LessonForm {
    applicationId: string;
    studentAccountId: string;
    subject: string;
    startDateTime: string;
    durationMinutes: string;
    price: string;
    videoMeetingUrl: string;
}

function navigateTo(path: string) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
}

function openChat(conversationId: number, setActiveSection: (section: SectionKey) => void, setSelectedConversationId: (conversationId: number) => void) {
    setActiveSection("messages");
    setSelectedConversationId(conversationId);
    navigateTo(`/profile/chat/${conversationId}`);
}

function accountLabel(type: AccountType) {
    return type === "student" ? "Ученик" : "Репетитор";
}

function lessonStatusLabel(status: LessonStatus) {
    switch (status) {
        case "PLANNED":
            return "Запланировано";
        case "COMPLETED":
            return "Завершено";
        default:
            return "Отменено";
    }
}

const TUTOR_CARD_GRADE_OPTIONS = [
    ...Array.from({ length: 11 }, (_, index) => ({ value: index + 1, label: `${index + 1} класс` })),
    { value: 12, label: "Студенты" },
];

function formatSupportedGrades(grades: number[]) {
    if (!grades.length) {
        return "Классы не указаны";
    }

    return grades.map((grade) => (grade === 12 ? "Студенты" : `${grade} класс`)).join(", ");
}

function isPastLesson(lesson: LessonView) {
    return lesson.status !== "CANCELLED" && new Date(lesson.startDateTime).getTime() < Date.now();
}

function isUpcomingLesson(lesson: LessonView) {
    return lesson.status !== "CANCELLED" && new Date(lesson.startDateTime).getTime() >= Date.now();
}

function applicationStatusLabel(status: ApplicationStatus) {
    switch (status) {
        case "SENT":
        case "PENDING":
            return "Ожидает ответа";
        case "ACCEPTED":
            return "Принята";
        default:
            return "Отклонена";
    }
}

function formatDate(value: string | null | undefined) {
    if (!value) return "—";
    return new Date(value).toLocaleString("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatDateTimeLocal(value: string | null | undefined) {
    if (!value) return "";
    const date = new Date(value);
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
function emptyStudentProfile(): StudentProfileForm {
    return { description: "", subjects: "", gradeLevel: "", format: "" };
}

function emptyTutorEducation(): TutorEducationForm {
    return { institution: "", specialty: "", graduationYear: "" };
}

function parseTutorEducation(value: string | null | undefined): TutorEducationForm[] {
    if (!value) {
        return [emptyTutorEducation()];
    }

    try {
        const parsed = JSON.parse(value) as unknown;
        if (Array.isArray(parsed)) {
            const items = parsed
                .map((item) => {
                    const education = item as Partial<TutorEducationForm>;
                    return {
                        institution: String(education.institution ?? ""),
                        specialty: String(education.specialty ?? ""),
                        graduationYear: String(education.graduationYear ?? ""),
                    };
                })
                .filter((item) => item.institution || item.specialty || item.graduationYear);

            return items.length > 0 ? items : [emptyTutorEducation()];
        }
    } catch {
        // Legacy text values are shown as the institution field.
    }

    return [{ ...emptyTutorEducation(), institution: value }];
}

function serializeTutorEducation(items: TutorEducationForm[]) {
    const filledItems = items
        .map((item) => ({
            institution: item.institution.trim(),
            specialty: item.specialty.trim(),
            graduationYear: item.graduationYear.trim(),
        }))
        .filter((item) => item.institution || item.specialty || item.graduationYear);

    return filledItems.length > 0 ? JSON.stringify(filledItems) : "";
}

function emptyTutorProfile(): TutorProfileForm {
    return { description: "", subjects: "", experience: "", price: "", educationItems: [emptyTutorEducation()], achievements: "" };
}

function emptyTutorCard(): TutorCardForm {
    return {
        title: "",
        description: "",
        subject: "",
        pricePerLesson: "",
        format: "online",
        isActive: true,
        supportedGrades: [],
    };
}

function emptyMessage(): MessageForm {
    return { text: "" };
}

function emptyReview(): ReviewForm {
    return { rating: "5", text: "" };
}

function emptyLesson(): LessonForm {
    return {
        applicationId: "",
        studentAccountId: "",
        subject: "",
        startDateTime: "",
        durationMinutes: "60",
        price: "",
        videoMeetingUrl: "",
    };
}

function lessonFormFromView(lesson: LessonView): LessonForm {
    return {
        applicationId: String(lesson.applicationId),
        studentAccountId: String(lesson.studentAccountId),
        subject: lesson.subject,
        startDateTime: formatDateTimeLocal(lesson.startDateTime),
        durationMinutes: String(lesson.durationMinutes),
        price: String(lesson.price),
        videoMeetingUrl: lesson.videoMeetingUrl ?? "",
    };
}
function studentProfileFromView(profile: StudentProfileView | null | undefined): StudentProfileForm {
    return {
        description: profile?.description ?? "",
        subjects: profile?.subjects ?? "",
        gradeLevel: profile?.gradeLevel ?? "",
        format: profile?.format ?? "",
    };
}

function tutorProfileFromView(profile: TutorProfileView | null | undefined): TutorProfileForm {
    return {
        description: profile?.description ?? "",
        subjects: profile?.subjects ?? "",
        experience: profile?.experience ?? "",
        price: profile?.price == null ? "" : String(profile.price),
        educationItems: parseTutorEducation(profile?.education),
        achievements: profile?.achievements ?? "",
    };
}

function cardFormFromView(card: TutorCardView | null | undefined): TutorCardForm {
    return {
        title: card?.title ?? "",
        description: card?.description ?? "",
        subject: card?.subject ?? "",
        pricePerLesson: card?.pricePerLesson == null ? "" : String(card.pricePerLesson),
        format: card?.format ?? "online",
        isActive: card?.isActive ?? true,
        supportedGrades: card?.supportedGrades ?? [],
    };
}

function sectionTitle(section: SectionKey, type: AccountType | null) {
    if (section === "profile") return "Профиль";
    if (section === "lessons") return "Мои занятия";
    if (section === "contacts") return type === "student" ? "Мои репетиторы" : "Мои ученики";
    if (section === "applications") return type === "student" ? "Мои заявки" : "Заявки учеников";
    if (section === "messages") return "Сообщения";
    if (section === "cards") return "Мои карточки";
    if (section === "students") return "Мои ученики";
    if (section === "reviews") return "Мои отзывы";
    return "Настройки";
}

function sectionFromRoute(routePath: string): SectionKey | null {
    const match = routePath.match(/^\/(?:account|profile)(?:\/([^/?#]+))?/);
    if (!match) {
        return null;
    }

    const section = match[1];
    if (!section) {
        return "profile";
    }
    if (section === "students") return "students";
    if (section === "lessons") return "lessons";
    if (section === "applications") return "applications";
    if (section === "messages" || section === "chat") return "messages";
    if (section === "cards") return "cards";
    if (section === "reviews") return "reviews";
    if (section === "contacts") return "contacts";
    if (section === "settings") return "settings";
    return "profile";
}

function routeForSection(section: SectionKey) {
    if (section === "profile") {
        return "/profile";
    }
    return `/profile/${section}`;
}

interface AccountPageProps {
    initialConversationId?: number | null;
    routePath: string;
}

export function AccountPage({ initialConversationId = null, routePath }: AccountPageProps) {
    const { session, setSession, isLoading, logout } = useAuthSession();
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<SectionKey>("profile");
    const [isProfileEditing, setIsProfileEditing] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isMobileNavVisible, setIsMobileNavVisible] = useState(false);
    const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>(DEFAULT_SUBJECT_OPTIONS);

    const [studentProfile, setStudentProfile] = useState<StudentProfileForm>(emptyStudentProfile);
    const [tutorProfile, setTutorProfile] = useState<TutorProfileForm>(emptyTutorProfile);

    const [cards, setCards] = useState<TutorCardView[]>([]);
    const [cardDraft, setCardDraft] = useState<TutorCardForm>(emptyTutorCard);
    const [editingCardId, setEditingCardId] = useState<number | null>(null);
    const [isCardFormOpen, setIsCardFormOpen] = useState(false);

    const [applications, setApplications] = useState<ApplicationView[]>([]);
    const [conversations, setConversations] = useState<ConversationView[]>([]);
    const [messages, setMessages] = useState<MessageView[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [messageDraft, setMessageDraft] = useState<MessageForm>(emptyMessage);
    const [tutorStudents, setTutorStudents] = useState<TutorStudentView[]>([]);
    const [studentTutors, setStudentTutors] = useState<StudentTutorView[]>([]);
    const [studentReviews, setStudentReviews] = useState<ReviewView[]>([]);
    const [tutorReviews, setTutorReviews] = useState<ReviewView[]>([]);
    const [reviewDrafts, setReviewDrafts] = useState<Record<number, ReviewForm>>({});
    const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});

    const [lessons, setLessons] = useState<LessonView[]>([]);
    const [lessonDraft, setLessonDraft] = useState<LessonForm>(emptyLesson);
    const [lessonEditDraft, setLessonEditDraft] = useState<LessonForm>(emptyLesson);
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
    const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
    const [lessonFilter, setLessonFilter] = useState<LessonFilter>("all");
    const [lessonStudentFilter, setLessonStudentFilter] = useState("");

    const activeAccount = session?.activeAccount ?? null;
    const accounts = session?.accounts ?? [];
    const user = session?.user ?? null;

    const hasStudentAccount = accounts.some((account) => account.type === "student");
    const hasTutorAccount = accounts.some((account) => account.type === "tutor");
    const studentAccountIds = useMemo(
        () => new Set(accounts.filter((account) => account.type === "student").map((account) => account.id)),
        [accounts],
    );
    const userAccountIds = useMemo(() => new Set(accounts.map((account) => account.id)), [accounts]);
    const subjectLabel = (value: string) => subjectOptions.find((item) => item.value === value)?.label ?? value;
    const unreadMessagesCount = conversations.reduce((total, conversation) => total + (conversation.unreadMessagesCount ?? 0), 0);
    const pendingApplicationsCount =
        activeAccount?.type === "tutor" ? applications.filter((application) => application.status === "PENDING").length : 0;
    const lessonStudents = useMemo(() => {
        const students = new Map<number, string>();
        lessons.forEach((lesson) => {
            students.set(lesson.studentAccountId, `${lesson.studentFirstName} ${lesson.studentLastName}`.trim());
        });
        return Array.from(students.entries()).sort((left, right) => left[1].localeCompare(right[1], "ru"));
    }, [lessons]);
    const lessonFilterCounts = useMemo(
        () => ({
            all: lessons.length,
            past: lessons.filter(isPastLesson).length,
            cancelled: lessons.filter((lesson) => lesson.status === "CANCELLED").length,
            upcoming: lessons.filter(isUpcomingLesson).length,
        }),
        [lessons],
    );
    const filteredLessons = useMemo(() => {
        return lessons.filter((lesson) => {
            if (lessonFilter === "past" && !isPastLesson(lesson)) {
                return false;
            }
            if (lessonFilter === "cancelled" && lesson.status !== "CANCELLED") {
                return false;
            }
            if (lessonFilter === "upcoming" && !isUpcomingLesson(lesson)) {
                return false;
            }
            if (activeAccount?.type === "tutor" && lessonStudentFilter && lesson.studentAccountId !== Number(lessonStudentFilter)) {
                return false;
            }
            return true;
        });
    }, [activeAccount?.type, lessonFilter, lessonStudentFilter, lessons]);

    function openMobileNav() {
        setIsMobileNavOpen(true);
        window.requestAnimationFrame(() => setIsMobileNavVisible(true));
    }

    function closeMobileNav() {
        setIsMobileNavVisible(false);
        window.setTimeout(() => setIsMobileNavOpen(false), 220);
    }

    const navItems = useMemo(() => {
        const items: Array<{ key: SectionKey; label: string; icon: typeof UserRound; badge?: number }> = [
            { key: "profile", label: "Профиль", icon: UserRound },
        ];

        if (hasTutorAccount) {
            items.push({ key: "students", label: "Мои ученики", icon: Users });
        }

        items.push({ key: "lessons", label: "Мои занятия", icon: Calendar });

        if (hasStudentAccount) {
            items.push({ key: "contacts", label: "Мои репетиторы", icon: Users });
        }

        items.push({
            key: "applications",
            label: activeAccount?.type === "tutor" ? "Заявки учеников" : "Мои заявки",
            icon: BookOpen,
            badge: pendingApplicationsCount > 0 ? pendingApplicationsCount : undefined,
        });

        if (hasTutorAccount) {
            items.push({ key: "cards", label: "Мои карточки", icon: Edit3 });
        }

        if (hasStudentAccount || hasTutorAccount) {
            items.push({ key: "reviews", label: "Мои отзывы", icon: Check });
        }

        items.push(
            {
                key: "messages",
                label: "Сообщения",
                icon: MessageCircle,
                badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
            },
            { key: "settings", label: "Настройки", icon: Settings },
        );

        return items;
    }, [activeAccount?.type, hasStudentAccount, hasTutorAccount, pendingApplicationsCount, unreadMessagesCount]);

    useEffect(() => {
        if (!activeAccount) {
            return;
        }

        setStudentProfile(studentProfileFromView(activeAccount.studentProfile));
        setTutorProfile(tutorProfileFromView(activeAccount.tutorProfile));
        setCards([]);
        setApplications([]);
        setConversations([]);
        setMessages([]);
        setTutorStudents([]);
        setStudentTutors([]);
        setStudentReviews([]);
        setTutorReviews([]);
        setReviewDrafts({});
        setReplyDrafts({});
        setLessons([]);
        setSelectedConversationId(null);
        setMessageDraft(emptyMessage());
        setCardDraft(emptyTutorCard());
        setLessonDraft(emptyLesson());
        setLessonEditDraft(emptyLesson());
        setEditingCardId(null);
        setIsCardFormOpen(false);
        setEditingLessonId(null);
        setIsProfileEditing(false);
        setIsMobileNavOpen(false);
        setIsMobileNavVisible(false);
        setActiveSection("profile");
    }, [activeAccount?.id]);

    useEffect(() => {
        let cancelled = false;
        fetchSubjectOptions()
            .then((items) => {
                if (!cancelled && items.length > 0) {
                    setSubjectOptions(items);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSubjectOptions(DEFAULT_SUBJECT_OPTIONS);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!activeAccount) {
            return;
        }

        void loadConversations({ silent: true, preserveSelection: true });
        void loadApplications({ silent: true });

        if (activeSection === "cards" && activeAccount.type === "tutor") {
            void loadTutorCards();
        }
        if (activeSection === "applications") {
            void loadApplications();
        }
        if (activeSection === "contacts" && hasStudentAccount) {
            void loadStudentTutors();
        }
        if (activeSection === "students" && hasTutorAccount) {
            void loadTutorStudents();
        }
        if (activeSection === "lessons" && activeAccount.type === "tutor") {
            void loadApplications();
            void loadTutorStudents();
        }
        if (activeSection === "messages") {
            void loadConversations({ preserveSelection: true });
        }
        if (activeSection === "lessons") {
            void loadLessons();
        }
        if (activeSection === "reviews") {
            if (hasStudentAccount) {
                void loadStudentTutors();
                void loadStudentReviews();
            }
            if (hasTutorAccount) {
                void loadTutorReviews();
            }
        }
    }, [activeSection, activeAccount?.id, hasStudentAccount, hasTutorAccount]);

    useEffect(() => {
        if (!activeAccount) {
            return;
        }

        const routeSection = sectionFromRoute(routePath);

        if (!routeSection) {
            return;
        }

        if (routeSection === "profile") {
            setActiveSection("profile");
            setSelectedConversationId(null);
            setMessages([]);
            return;
        }

        if (initialConversationId != null) {
            setActiveSection("messages");
            setSelectedConversationId(initialConversationId);
            return;
        }

        setActiveSection(routeSection);
        setSelectedConversationId(null);
        setMessages([]);
    }, [initialConversationId, routePath, activeAccount?.id]);

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            setMessageDraft(emptyMessage());
            return;
        }

        setMessageDraft(emptyMessage());
        void loadMessages(selectedConversationId);
    }, [selectedConversationId]);

    useEffect(() => {
        if (activeAccount?.type !== "tutor" || !isLessonFormOpen) {
            return;
        }

        if (lessonDraft.applicationId || tutorStudents.length === 0 || applications.length === 0) {
            return;
        }

        const firstStudent = tutorStudents[0];
        const firstApplication = applications.find((application) => application.id === firstStudent.applicationId);
        if (!firstApplication) {
            return;
        }

        setLessonDraft({
            applicationId: String(firstStudent.applicationId),
            studentAccountId: String(firstStudent.studentAccountId),
            subject: firstApplication.tutorCard.subject,
            startDateTime: "",
            durationMinutes: "60",
            price: String(firstApplication.tutorCard.pricePerLesson),
        });
    }, [applications, tutorStudents, activeAccount?.type, isLessonFormOpen, lessonDraft.applicationId]);

    async function syncSession(response: AuthResponse) {
        setCookieToken(response.token);
        setSession(response);
        window.dispatchEvent(new Event("auth-state-changed"));
        setStudentProfile(studentProfileFromView(response.activeAccount?.studentProfile));
        setTutorProfile(tutorProfileFromView(response.activeAccount?.tutorProfile));
        setError(null);
    }

    async function selectAccount(type: AccountType) {
        if (!session) return;
        setIsBusy(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/select-account`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({ type }),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось выбрать аккаунт"));
            }
            await syncSession((await response.json()) as AuthResponse);
            setActiveSection("profile");
        } catch (selectError) {
            setError(selectError instanceof Error ? selectError.message : "Не удалось выбрать аккаунт");
        } finally {
            setIsBusy(false);
        }
    }

    async function createAccount(type: AccountType) {
        setIsBusy(true);
        try {
            const response = await fetch(`${API_BASE_URL}/accounts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({ type }),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось создать аккаунт"));
            }
            await syncSession((await response.json()) as AuthResponse);
            setActiveSection("settings");
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : "Не удалось создать аккаунт");
        } finally {
            setIsBusy(false);
        }
    }

    async function saveStudentProfile() {
        setIsBusy(true);
        try {
            const response = await fetch(`${API_BASE_URL}/accounts/me/student-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(studentProfile),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось сохранить профиль"));
            }
            await syncSession((await response.json()) as AuthResponse);
            setIsProfileEditing(false);
            setError(null);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить профиль");
        } finally {
            setIsBusy(false);
        }
    }

    async function saveTutorProfile() {
        if (tutorProfile.description.length > 4000) {
            setError("Описание о себе должно быть не длиннее 4000 символов");
            return;
        }
        setIsBusy(true);
        try {
            const response = await fetch(`${API_BASE_URL}/accounts/me/tutor-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    ...tutorProfile,
                    education: serializeTutorEducation(tutorProfile.educationItems),
                    educationItems: undefined,
                    price: tutorProfile.price === "" ? null : Number(tutorProfile.price),
                }),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось сохранить профиль"));
            }
            await syncSession((await response.json()) as AuthResponse);
            setIsProfileEditing(false);
            setError(null);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить профиль");
        } finally {
            setIsBusy(false);
        }
    }

    async function loadTutorCards() {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/tutor-cards/my`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось загрузить карточки"));
            }
            setCards((await response.json()) as TutorCardView[]);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить карточки");
        } finally {
            setIsBusy(false);
        }
    }

    async function saveTutorCard() {
        if (!activeAccount || activeAccount.type !== "tutor") return;
        if (cardDraft.supportedGrades.length === 0) {
            setError("Выберите хотя бы один класс или категорию студентов");
            return;
        }
        setIsBusy(true);
        try {
            const payload = {
                title: cardDraft.title,
                description: cardDraft.description,
                subject: cardDraft.subject,
                pricePerLesson: Number(cardDraft.pricePerLesson),
                format: cardDraft.format,
                isActive: cardDraft.isActive,
                supportedGrades: cardDraft.supportedGrades,
            };

            const response = await fetch(
                editingCardId ? `${MARKETPLACE_API_BASE_URL}/tutor-cards/${editingCardId}` : `${MARKETPLACE_API_BASE_URL}/tutor-cards`,
                {
                    method: editingCardId ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify(payload),
                },
            );
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось сохранить карточку"));
            }
            setEditingCardId(null);
            setCardDraft(emptyTutorCard());
            setIsCardFormOpen(false);
            await loadTutorCards();
            setActiveSection("cards");
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить карточку");
        } finally {
            setIsBusy(false);
        }
    }

    async function updateTutorCardVisibility(card: TutorCardView, isActive: boolean) {
        if (!isActive) {
            const confirmed = window.confirm("Вы действительно хотите скрыть карточку из поиска?");
            if (!confirmed) {
                return;
            }
        }

        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/tutor-cards/${card.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    title: card.title,
                    description: card.description ?? "",
                    subject: card.subject,
                    pricePerLesson: card.pricePerLesson,
                    format: card.format,
                    isActive,
                    supportedGrades: card.supportedGrades,
                }),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, isActive ? "Не удалось показать карточку" : "Не удалось скрыть карточку"));
            }
            setEditingCardId(null);
            setCardDraft(emptyTutorCard());
            setIsCardFormOpen(false);
            await loadTutorCards();
        } catch (visibilityError) {
            setError(visibilityError instanceof Error ? visibilityError.message : "Не удалось обновить карточку");
        } finally {
            setIsBusy(false);
        }
    }

    async function deleteTutorCard(id: number) {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/tutor-cards/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (!response.ok && response.status !== 204) {
                throw new Error(await readErrorMessage(response, "Не удалось удалить карточку"));
            }
            await loadTutorCards();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Не удалось удалить карточку");
        } finally {
            setIsBusy(false);
        }
    }

    async function loadApplications(options: { silent?: boolean } = {}) {
        if (!options.silent) {
            setIsBusy(true);
        }
        try {
            const path =
                activeAccount?.type === "tutor" ? `${MARKETPLACE_API_BASE_URL}/applications/incoming` : `${MARKETPLACE_API_BASE_URL}/applications/my`;
            const response = await fetch(path, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось загрузить заявки"));
            }
            setApplications((await response.json()) as ApplicationView[]);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заявки");
        } finally {
            if (!options.silent) {
                setIsBusy(false);
            }
        }
    }

    async function loadTutorStudents() {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/tutor/students`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось загрузить учеников"));
            }
            setTutorStudents((await response.json()) as TutorStudentView[]);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить учеников");
        } finally {
            setIsBusy(false);
        }
    }

    async function loadStudentTutors() {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/student/tutors`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось загрузить репетиторов"));
            }
            setStudentTutors((await response.json()) as StudentTutorView[]);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить репетиторов");
        } finally {
            setIsBusy(false);
        }
    }

    async function loadStudentReviews() {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/reviews/my`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось загрузить отзывы"));
            }
            setStudentReviews((await response.json()) as ReviewView[]);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить отзывы");
        } finally {
            setIsBusy(false);
        }
    }

    async function loadTutorReviews() {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/reviews/about-me`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось загрузить отзывы"));
            }
            const reviews = (await response.json()) as ReviewView[];
            setTutorReviews(reviews);
            setReplyDrafts((current) => {
                const next = { ...current };
                reviews.forEach((review) => {
                    if (next[review.id] == null) {
                        next[review.id] = review.tutorReply ?? "";
                    }
                });
                return next;
            });
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить отзывы");
        } finally {
            setIsBusy(false);
        }
    }

    async function createReview(tutorAccountId: number) {
        const draft = reviewDrafts[tutorAccountId] ?? emptyReview();
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    tutorAccountId,
                    rating: Number(draft.rating),
                    text: draft.text,
                }),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось отправить отзыв"));
            }
            setReviewDrafts((current) => ({ ...current, [tutorAccountId]: emptyReview() }));
            await loadStudentReviews();
        } catch (reviewError) {
            setError(reviewError instanceof Error ? reviewError.message : "Не удалось отправить отзыв");
        } finally {
            setIsBusy(false);
        }
    }

    async function replyToReview(reviewId: number) {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/reviews/${reviewId}/reply`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({ text: replyDrafts[reviewId] ?? "" }),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось отправить ответ"));
            }
            await loadTutorReviews();
        } catch (replyError) {
            setError(replyError instanceof Error ? replyError.message : "Не удалось отправить ответ");
        } finally {
            setIsBusy(false);
        }
    }

    async function acceptApplication(id: number) {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/applications/${id}/accept`, {
                method: "PATCH",
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось принять заявку"));
            }
            const updated = (await response.json()) as ApplicationView;
            setApplications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
            if (updated.conversationId) {
                openChat(updated.conversationId, setActiveSection, setSelectedConversationId);
            }
            if (activeAccount?.type === "tutor") {
                await loadTutorStudents();
            }
        } catch (acceptError) {
            setError(acceptError instanceof Error ? acceptError.message : "Не удалось принять заявку");
        } finally {
            setIsBusy(false);
        }
    }

    async function rejectApplication(id: number) {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/applications/${id}/reject`, {
                method: "PATCH",
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось отклонить заявку"));
            }
            const updated = (await response.json()) as ApplicationView;
            setApplications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        } catch (rejectError) {
            setError(rejectError instanceof Error ? rejectError.message : "Не удалось отклонить заявку");
        } finally {
            setIsBusy(false);
        }
    }

    async function loadConversations(options: { silent?: boolean; preserveSelection?: boolean } = {}) {
        if (!options.silent) {
            setIsBusy(true);
        }
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/conversations/my`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось загрузить переписку"));
            }
            const result = (await response.json()) as ConversationView[];
            setConversations(result);
            if (!options.preserveSelection && !selectedConversationId && result.length > 0) {
                setSelectedConversationId(result[0].id);
            }
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить переписку");
        } finally {
            if (!options.silent) {
                setIsBusy(false);
            }
        }
    }

    async function loadMessages(conversationId: number) {
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/conversations/${conversationId}/messages`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось загрузить сообщения"));
            }
            setMessages((await response.json()) as MessageView[]);
            await loadConversations({ preserveSelection: true });
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить сообщения");
        }
    }

    async function sendMessage() {
        if (!selectedConversationId) return;
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/conversations/${selectedConversationId}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(messageDraft),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось отправить сообщение"));
            }
            const sent = (await response.json()) as MessageView;
            setMessages((current) => [...current, sent]);
            setMessageDraft(emptyMessage());
            await loadConversations({ preserveSelection: true });
        } catch (sendError) {
            setError(sendError instanceof Error ? sendError.message : "Не удалось отправить сообщение");
        } finally {
            setIsBusy(false);
        }
    }

    async function loadLessons() {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/lessons/my`, {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось загрузить занятия"));
            }
            const loadedLessons = (await response.json()) as LessonView[];
            setLessons(loadedLessons.sort((left, right) => new Date(left.startDateTime).getTime() - new Date(right.startDateTime).getTime()));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить занятия");
        } finally {
            setIsBusy(false);
        }
    }

    async function createLesson() {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/lessons`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    studentAccountId: Number(lessonDraft.studentAccountId),
                    applicationId: Number(lessonDraft.applicationId),
                    subject: lessonDraft.subject,
                    startDateTime: new Date(lessonDraft.startDateTime).toISOString(),
                    durationMinutes: Number(lessonDraft.durationMinutes),
                    price: Number(lessonDraft.price),
                    videoMeetingUrl: lessonDraft.videoMeetingUrl.trim() || null,
                }),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось создать занятие"));
            }
            setLessonDraft(emptyLesson());
            setIsLessonFormOpen(false);
            await loadLessons();
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : "Не удалось создать занятие");
        } finally {
            setIsBusy(false);
        }
    }

    async function updateLesson(lessonId: number) {
        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/lessons/${lessonId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    subject: lessonEditDraft.subject,
                    startDateTime: new Date(lessonEditDraft.startDateTime).toISOString(),
                    durationMinutes: Number(lessonEditDraft.durationMinutes),
                    price: Number(lessonEditDraft.price),
                    videoMeetingUrl: lessonEditDraft.videoMeetingUrl.trim() || null,
                }),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось сохранить занятие"));
            }
            setEditingLessonId(null);
            setLessonEditDraft(emptyLesson());
            await loadLessons();
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : "Не удалось сохранить занятие");
        } finally {
            setIsBusy(false);
        }
    }

    async function cancelLesson(lessonId: number) {
        if (!window.confirm("Отменить это занятие?")) {
            return;
        }

        setIsBusy(true);
        try {
            const response = await fetch(`${MARKETPLACE_API_BASE_URL}/lessons/${lessonId}/cancel`, {
                method: "PATCH",
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, "Не удалось отменить занятие"));
            }
            if (editingLessonId === lessonId) {
                setEditingLessonId(null);
                setLessonEditDraft(emptyLesson());
            }
            await loadLessons();
        } catch (cancelError) {
            setError(cancelError instanceof Error ? cancelError.message : "Не удалось отменить занятие");
        } finally {
            setIsBusy(false);
        }
    }

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background px-4 py-10 text-foreground">
                <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
                    Загружаем кабинет...
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-background px-4 py-10 text-foreground">
                <section className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                        <UserRound size={22} />
                    </div>
                    <h1 className="mb-2 text-2xl font-semibold">Личный кабинет недоступен</h1>
                    <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
                        Для входа в кабинет нужно авторизоваться и создать аккаунт ученика или репетитора.
                    </p>
                    <button
                        onClick={() => navigateTo("/")}
                        className="rounded-xl bg-primary px-5 py-3 text-primary-foreground transition hover:bg-primary/90"
                    >
                        Вернуться на главную
                    </button>
                </section>
            </main>
        );
    }

    const displayName = `${user.firstName} ${user.lastName}`.trim() || "Пользователь";
    const isStudent = activeAccount?.type === "student";
    const isTutor = activeAccount?.type === "tutor";

    const acceptedApplications = applications.filter((application) => application.status === "ACCEPTED");
    const selectedConversation =
        conversations.find((conversation) => conversation.id === selectedConversationId) ?? null;
    const navigateAccountSection = (key: SectionKey) => {
        setActiveSection(key);
        closeMobileNav();
        navigateTo(routeForSection(key));
    };

    return (
        <main className="min-h-screen bg-background text-foreground">
            <AccountHeader
                displayName={displayName}
                activeAccountLabel={activeAccount ? accountLabel(activeAccount.type) : "Выберите аккаунт"}
                onBack={() => navigateTo("/")}
                onProfile={() => {
                    setActiveSection("profile");
                    closeMobileNav();
                    navigateTo("/profile");
                }}
                onLogout={() => logout()}
                onMenuToggle={openMobileNav}
            />

            {isMobileNavOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button
                        type="button"
                        aria-label="Закрыть меню"
                        onClick={closeMobileNav}
                        className={`absolute inset-0 bg-foreground/30 transition-opacity duration-200 ease-out ${isMobileNavVisible ? "opacity-100" : "opacity-0"
                            }`}
                    />
                    <div
                        className={`absolute left-0 top-0 h-full w-[min(86vw,320px)] overflow-y-auto bg-background p-3 shadow-2xl transition-transform duration-200 ease-out ${isMobileNavVisible ? "translate-x-0" : "-translate-x-full"
                            }`}
                    >
                        <AccountSidebar
                            displayName={displayName}
                            userEmail={user.email}
                            navItems={navItems}
                            activeSection={activeSection}
                            onNavigate={(key) => navigateAccountSection(key as SectionKey)}
                        />
                    </div>
                </div>
            )}

            <section className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:px-6 sm:py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
                <div className="hidden lg:block">
                    <AccountSidebar
                        displayName={displayName}
                        userEmail={user.email}
                        navItems={navItems}
                        activeSection={activeSection}
                        onNavigate={(key) => navigateAccountSection(key as SectionKey)}
                    />
                </div>

                <div className="min-w-0 space-y-4 sm:space-y-6">
                    {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

                    {!activeAccount && accounts.length === 0 && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h1 className="mb-2 text-2xl font-semibold">Создайте аккаунт</h1>
                            <p className="max-w-2xl text-muted-foreground">
                                После регистрации у пользователя пока нет ни одного аккаунта. Создайте аккаунт ученика или репетитора,
                                чтобы открыть нужный кабинет.
                            </p>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {!hasStudentAccount && (
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => createAccount("student")}
                                        className="flex items-center justify-between rounded-2xl border border-border bg-secondary p-5 text-left transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <span>
                                            <span className="mb-1 block text-base font-semibold">Создать аккаунт ученика</span>
                                            <span className="block text-sm text-muted-foreground">Откроет кабинет ученика с пустым профилем.</span>
                                        </span>
                                        <GraduationCap size={20} className="text-primary" />
                                    </button>
                                )}

                                {!hasTutorAccount && (
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => createAccount("tutor")}
                                        className="flex items-center justify-between rounded-2xl border border-border bg-secondary p-5 text-left transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <span>
                                            <span className="mb-1 block text-base font-semibold">Создать аккаунт репетитора</span>
                                            <span className="block text-sm text-muted-foreground">Откроет кабинет репетитора с пустым профилем.</span>
                                        </span>
                                        <BookOpen size={20} className="text-primary" />
                                    </button>
                                )}
                            </div>
                        </section>
                    )}

                    {!activeAccount && accounts.length > 0 && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h1 className="mb-2 text-2xl font-semibold">Выберите аккаунт</h1>
                            <p className="max-w-2xl text-muted-foreground">
                                У этого пользователя несколько аккаунтов. Выберите, какой кабинет открыть сейчас.
                            </p>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {accounts.map((account) => (
                                    <button
                                        key={account.id}
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => selectAccount(account.type)}
                                        className="flex items-center justify-between rounded-2xl border border-border bg-secondary p-5 text-left transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <span>
                                            <span className="mb-1 block text-base font-semibold">{accountLabel(account.type)}</span>
                                            <span className="block text-sm text-muted-foreground">
                                                {account.type === "student" ? "Кабинет ученика" : "Кабинет репетитора"}
                                            </span>
                                        </span>
                                        {account.type === "student" ? (
                                            <GraduationCap size={20} className="text-primary" />
                                        ) : (
                                            <BookOpen size={20} className="text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {activeAccount && activeSection === "profile" && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                    <h1 className="text-2xl font-semibold">Профиль</h1>
                                    <p className="text-sm text-muted-foreground">
                                        {activeAccount.type === "student"
                                            ? "Заполните данные для кабинета ученика"
                                            : "Заполните данные для кабинета репетитора"}
                                    </p>
                                </div>
                                {isProfileEditing ? (
                                    <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground">
                                        <Edit3 size={15} />
                                        Редактирование
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsProfileEditing(true)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary"
                                    >
                                        <Edit3 size={15} />
                                        Редактировать профиль
                                    </button>
                                )}
                            </div>

                            <fieldset disabled={!isProfileEditing || isBusy} className={!isProfileEditing ? "opacity-80" : ""}>
                                {activeAccount.type === "student" ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="block md:col-span-2">
                                            <span className="text-sm text-muted-foreground">Описание</span>
                                            <textarea
                                                value={studentProfile.description}
                                                onChange={(event) => setStudentProfile((current) => ({ ...current, description: event.target.value }))}
                                                className="mt-1 min-h-28 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Интересующие предметы</span>
                                            <input
                                                value={studentProfile.subjects}
                                                onChange={(event) => setStudentProfile((current) => ({ ...current, subjects: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Класс / курс</span>
                                            <input
                                                value={studentProfile.gradeLevel}
                                                onChange={(event) => setStudentProfile((current) => ({ ...current, gradeLevel: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <label className="block md:col-span-2">
                                            <span className="text-sm text-muted-foreground">Формат занятий</span>
                                            <input
                                                value={studentProfile.format}
                                                onChange={(event) => setStudentProfile((current) => ({ ...current, format: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {isProfileEditing ? (
                                            <>
                                                <label className="block md:col-span-2">
                                                    <span className="text-sm text-muted-foreground">Обо мне</span>
                                                    <textarea
                                                        maxLength={4000}
                                                        value={tutorProfile.description}
                                                        onChange={(event) => setTutorProfile((current) => ({ ...current, description: event.target.value }))}
                                                        placeholder="Расскажите, кто вы, как проводите занятия и чем можете быть полезны ученику. Можно использовать Markdown: **жирный текст**, *курсив*, списки."
                                                        className="mt-1 min-h-52 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                    />
                                                    <span className="mt-1 block text-xs text-muted-foreground">
                                                        Markdown поддерживается. {tutorProfile.description.length} / 4000 символов
                                                    </span>
                                                </label>
                                                {tutorProfile.description.trim() && (
                                                    <div className="md:col-span-2 rounded-2xl border border-border bg-secondary/60 p-4">
                                                        <div className="mb-2 text-sm text-muted-foreground">Предпросмотр описания</div>
                                                        <div
                                                            className="markdown-content text-sm leading-7 text-foreground"
                                                            dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(tutorProfile.description) }}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="md:col-span-2 rounded-2xl border border-border bg-secondary/60 p-4">
                                                <div className="mb-2 text-sm text-muted-foreground">Обо мне</div>
                                                {tutorProfile.description.trim() ? (
                                                    <div
                                                        className="markdown-content text-sm leading-7 text-foreground"
                                                        dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(tutorProfile.description) }}
                                                    />
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">Описание пока не заполнено.</div>
                                                )}
                                            </div>
                                        )}
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Предметы</span>
                                            <input
                                                value={tutorProfile.subjects}
                                                onChange={(event) => setTutorProfile((current) => ({ ...current, subjects: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Опыт преподавания, лет</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={tutorProfile.experience}
                                                onChange={(event) => setTutorProfile((current) => ({ ...current, experience: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Стоимость занятия</span>
                                            <input
                                                value={tutorProfile.price}
                                                onChange={(event) => setTutorProfile((current) => ({ ...current, price: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <div className="md:col-span-2">
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Образование</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Можно добавить несколько учебных заведений. Все поля необязательные.
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setTutorProfile((current) => ({
                                                            ...current,
                                                            educationItems: [...current.educationItems, emptyTutorEducation()],
                                                        }))
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition hover:bg-secondary"
                                                >
                                                    <Plus size={15} />
                                                    Добавить образование
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {tutorProfile.educationItems.map((education, index) => (
                                                    <div key={index} className="rounded-2xl border border-border bg-secondary/40 p-4">
                                                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_auto]">
                                                            <label className="block">
                                                                <span className="text-xs text-muted-foreground">Учебное заведение</span>
                                                                <input
                                                                    value={education.institution}
                                                                    onChange={(event) =>
                                                                        setTutorProfile((current) => ({
                                                                            ...current,
                                                                            educationItems: current.educationItems.map((item, itemIndex) =>
                                                                                itemIndex === index ? { ...item, institution: event.target.value } : item,
                                                                            ),
                                                                        }))
                                                                    }
                                                                    className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                />
                                                            </label>
                                                            <label className="block">
                                                                <span className="text-xs text-muted-foreground">Специальность</span>
                                                                <input
                                                                    value={education.specialty}
                                                                    onChange={(event) =>
                                                                        setTutorProfile((current) => ({
                                                                            ...current,
                                                                            educationItems: current.educationItems.map((item, itemIndex) =>
                                                                                itemIndex === index ? { ...item, specialty: event.target.value } : item,
                                                                            ),
                                                                        }))
                                                                    }
                                                                    className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                />
                                                            </label>
                                                            <label className="block">
                                                                <span className="text-xs text-muted-foreground">Год окончания</span>
                                                                <input
                                                                    value={education.graduationYear}
                                                                    onChange={(event) =>
                                                                        setTutorProfile((current) => ({
                                                                            ...current,
                                                                            educationItems: current.educationItems.map((item, itemIndex) =>
                                                                                itemIndex === index ? { ...item, graduationYear: event.target.value } : item,
                                                                            ),
                                                                        }))
                                                                    }
                                                                    className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                />
                                                            </label>
                                                            <button
                                                                type="button"
                                                                disabled={tutorProfile.educationItems.length === 1}
                                                                onClick={() =>
                                                                    setTutorProfile((current) => ({
                                                                        ...current,
                                                                        educationItems: current.educationItems.filter((_, itemIndex) => itemIndex !== index),
                                                                    }))
                                                                }
                                                                className="mt-5 inline-flex h-12 items-center justify-center rounded-xl border border-border px-3 text-sm text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <label className="block md:col-span-2">
                                            <span className="text-sm text-muted-foreground">Достижения</span>
                                            <textarea
                                                value={tutorProfile.achievements}
                                                onChange={(event) => setTutorProfile((current) => ({ ...current, achievements: event.target.value }))}
                                                className="mt-1 min-h-28 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                    </div>
                                )}
                            </fieldset>

                            {isProfileEditing && (
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={activeAccount.type === "student" ? saveStudentProfile : saveTutorProfile}
                                        disabled={isBusy}
                                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Save size={16} />
                                        Сохранить профиль
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    {activeAccount && activeSection === "cards" && activeAccount.type === "tutor" && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl font-semibold">Мои карточки</h2>
                                    <p className="text-sm text-muted-foreground">Создавайте, редактируйте и скрывайте карточки из поиска.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingCardId(null);
                                        setCardDraft(emptyTutorCard());
                                        setIsCardFormOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary"
                                >
                                    <Plus size={16} />
                                    Добавить новую карточку
                                </button>
                            </div>

                            <div className={`grid gap-4 ${isCardFormOpen ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : ""}`}>
                                <div className="space-y-3">
                                    {cards.length === 0 ? (
                                        <div className="rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                            Пока нет карточек. Создайте первую карточку предложения.
                                        </div>
                                    ) : (
                                        cards.map((card) => (
                                            <div
                                                key={card.id}
                                                className={`rounded-2xl border p-4 ${editingCardId === card.id ? "border-primary bg-secondary/60" : "border-border bg-card"}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="text-base font-semibold">{card.title}</div>
                                                        <div className="mt-1 text-sm text-muted-foreground">{subjectLabel(card.subject)}</div>
                                                    </div>
                                                    <div className="text-sm font-medium">{card.pricePerLesson.toLocaleString("ru-RU")} ₽</div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                    <span className="rounded-full bg-muted px-3 py-1">{card.format}</span>
                                                    <span className="rounded-full bg-muted px-3 py-1">
                                                        {formatSupportedGrades(card.supportedGrades)}
                                                    </span>
                                                    <span className="rounded-full bg-muted px-3 py-1">
                                                        {card.isActive ? "Активна" : "Скрыта"}
                                                    </span>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingCardId(card.id);
                                                            setCardDraft(cardFormFromView(card));
                                                            setIsCardFormOpen(true);
                                                        }}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition hover:bg-secondary"
                                                    >
                                                        <Edit3 size={15} />
                                                        Редактировать
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => void updateTutorCardVisibility(card, !card.isActive)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition hover:bg-secondary"
                                                    >
                                                        <EyeOff size={15} />
                                                        {card.isActive ? "Скрыть" : "Показать"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void deleteTutorCard(card.id)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
                                                    >
                                                        <Trash2 size={15} />
                                                        Удалить
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {isCardFormOpen && (
                                    <div className="rounded-2xl border border-border bg-card p-5">
                                        <h3 className="mb-4 text-lg font-semibold">
                                            {editingCardId ? "Редактирование карточки" : "Новая карточка"}
                                        </h3>

                                        <div className="space-y-4">
                                            <label className="block">
                                                <span className="text-sm text-muted-foreground">Название</span>
                                                <input
                                                    value={cardDraft.title}
                                                    onChange={(event) => setCardDraft((current) => ({ ...current, title: event.target.value }))}
                                                    className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="text-sm text-muted-foreground">Описание</span>
                                                <textarea
                                                    value={cardDraft.description}
                                                    onChange={(event) => setCardDraft((current) => ({ ...current, description: event.target.value }))}
                                                    className="mt-1 min-h-24 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                />
                                            </label>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <label className="block">
                                                    <span className="text-sm text-muted-foreground">Предмет</span>
                                                    <select
                                                        value={cardDraft.subject}
                                                        onChange={(event) => setCardDraft((current) => ({ ...current, subject: event.target.value }))}
                                                        className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                    >
                                                        <option value="">Выберите предмет</option>
                                                        {cardDraft.subject && !subjectOptions.some((subject) => subject.value === cardDraft.subject) && (
                                                            <option value={cardDraft.subject}>{subjectLabel(cardDraft.subject)}</option>
                                                        )}
                                                        {subjectOptions.map((subject) => (
                                                            <option key={subject.value} value={subject.value}>
                                                                {subject.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="block">
                                                    <span className="text-sm text-muted-foreground">Стоимость</span>
                                                    <input
                                                        value={cardDraft.pricePerLesson}
                                                        onChange={(event) => setCardDraft((current) => ({ ...current, pricePerLesson: event.target.value }))}
                                                        className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                    />
                                                </label>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">С какими классами готовы работать</div>
                                                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                    {TUTOR_CARD_GRADE_OPTIONS.map((option) => (
                                                        <label
                                                            key={option.value}
                                                            className="flex items-center gap-2 rounded-xl border border-border bg-input-background px-3 py-2 text-sm"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={cardDraft.supportedGrades.includes(option.value)}
                                                                onChange={(event) =>
                                                                    setCardDraft((current) => {
                                                                        const supportedGrades = event.target.checked
                                                                            ? Array.from(new Set([...current.supportedGrades, option.value])).sort((left, right) => left - right)
                                                                            : current.supportedGrades.filter((grade) => grade !== option.value);

                                                                        return { ...current, supportedGrades };
                                                                    })
                                                                }
                                                                className="h-4 w-4 accent-primary"
                                                            />
                                                            {option.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => void saveTutorCard()}
                                                disabled={isBusy}
                                                className="mr-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Save size={16} />
                                                Сохранить карточку
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCardFormOpen(false);
                                                    setEditingCardId(null);
                                                    setCardDraft(emptyTutorCard());
                                                }}
                                                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-secondary"
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeAccount && activeSection === "applications" && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <div className="mb-5">
                                <h2 className="text-2xl font-semibold">
                                    {activeAccount.type === "student" ? "Мои заявки" : "Заявки учеников"}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {activeAccount.type === "student"
                                        ? "Здесь видны ваши отправленные заявки и их статусы."
                                        : "Здесь видны входящие заявки на ваши карточки."}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {applications.length === 0 ? (
                                    <div className="rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                        Пока заявок нет.
                                    </div>
                                ) : (
                                    applications.map((application) => (
                                        <div key={application.id} className="rounded-2xl border border-border bg-card p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div>
                                                    <div className="text-base font-semibold">
                                                        {activeAccount.type === "student"
                                                            ? `${application.tutorFirstName} ${application.tutorLastName}`
                                                            : `${application.studentFirstName} ${application.studentLastName}`}
                                                    </div>
                                                    <div className="mt-1 text-sm text-muted-foreground">
                                                        {application.tutorCard.title} · {subjectLabel(application.tutorCard.subject)} ·{" "}
                                                        {application.tutorCard.pricePerLesson.toLocaleString("ru-RU")} ₽
                                                    </div>
                                                </div>
                                                <div className="rounded-full bg-secondary px-3 py-1 text-sm">{applicationStatusLabel(application.status)}</div>
                                            </div>

                                            <p className="mt-3 text-sm text-muted-foreground">{application.message || "Без сообщения"}</p>
                                            <div className="mt-3 text-xs text-muted-foreground">Отправлено: {formatDate(application.createdAt)}</div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {activeAccount.type === "tutor" && application.status === "PENDING" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => void acceptApplication(application.id)}
                                                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            Принять
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => void rejectApplication(application.id)}
                                                            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            Отклонить
                                                        </button>
                                                    </>
                                                )}

                                                {application.status === "ACCEPTED" && application.conversationId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            openChat(application.conversationId!, setActiveSection, setSelectedConversationId);
                                                        }}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary"
                                                    >
                                                        <MessageCircle size={15} />
                                                        Сообщения
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    )}

                    {activeAccount && activeSection === "students" && hasTutorAccount && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h2 className="mb-4 text-2xl font-semibold">Мои ученики</h2>
                            <div className="space-y-3">
                                {tutorStudents.length === 0 ? (
                                    <div className="rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                        Пока нет принятых заявок.
                                    </div>
                                ) : (
                                    tutorStudents.map((student) => (
                                        <div key={student.applicationId} className="rounded-2xl border border-border bg-card p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="font-semibold">
                                                        {student.studentFirstName} {student.studentLastName}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {subjectLabel(student.subject)} · {formatDate(student.acceptedAt)}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => openChat(student.conversationId, setActiveSection, setSelectedConversationId)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary"
                                                >
                                                    <MessageCircle size={15} />
                                                    Сообщения
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    )}

                    {activeAccount && activeSection === "contacts" && hasStudentAccount && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h2 className="mb-4 text-2xl font-semibold">Мои репетиторы</h2>
                            <div className="space-y-3">
                                {studentTutors.length === 0 ? (
                                    <div className="rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                        Пока нет связанных репетиторов.
                                    </div>
                                ) : (
                                    studentTutors.map((tutor) => (
                                        <div key={tutor.applicationId} className="rounded-2xl border border-border bg-card p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="font-semibold">
                                                        {tutor.tutorFirstName} {tutor.tutorLastName}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {subjectLabel(tutor.subject)} · {formatDate(tutor.acceptedAt)}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => openChat(tutor.conversationId, setActiveSection, setSelectedConversationId)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm transition hover:bg-secondary"
                                                >
                                                    <MessageCircle size={15} />
                                                    Сообщения
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    )}

                    {activeAccount && activeSection === "messages" && (
                        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl font-semibold">Сообщения</h2>
                                    <p className="text-sm text-muted-foreground">Переписка доступна после принятия заявки.</p>
                                </div>
                                {unreadMessagesCount > 0 && (
                                    <div className="rounded-full bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground">
                                        {unreadMessagesCount} непрочитанных
                                    </div>
                                )}
                            </div>

                            {!selectedConversationId ? (
                                <div className="space-y-2">
                                    {conversations.length === 0 ? (
                                        <div className="rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                            Пока нет диалогов.
                                        </div>
                                    ) : (
                                        conversations.map((conversation) => {
                                            const isStudentConversation = studentAccountIds.has(conversation.studentAccountId);
                                            const companionName = isStudentConversation
                                                ? `${conversation.tutorFirstName} ${conversation.tutorLastName}`
                                                : `${conversation.studentFirstName} ${conversation.studentLastName}`;

                                            return (
                                                <button
                                                    key={conversation.id}
                                                    type="button"
                                                    onClick={() => openChat(conversation.id, setActiveSection, setSelectedConversationId)}
                                                    className="flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-sm font-semibold">{companionName}</span>
                                                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                                                            {conversation.lastMessageText || "Нет сообщений"}
                                                        </span>
                                                    </span>
                                                    <span className="flex shrink-0 items-center gap-2">
                                                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                                                            {isStudentConversation ? "Репетитор" : "Ученик"}
                                                        </span>
                                                        {conversation.unreadMessagesCount > 0 ? (
                                                            <span className="rounded-full bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground">
                                                                {conversation.unreadMessagesCount}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <div className="min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-4">
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedConversationId(null);
                                                setMessages([]);
                                                navigateTo("/profile/messages");
                                            }}
                                            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                                        >
                                            <ArrowLeft size={16} />
                                            К списку чатов
                                        </button>

                                        {selectedConversation ? (
                                            <div className="min-w-0 text-right">
                                                <div className="truncate text-sm font-semibold">
                                                    {studentAccountIds.has(selectedConversation.studentAccountId)
                                                        ? `${selectedConversation.tutorFirstName} ${selectedConversation.tutorLastName}`
                                                        : `${selectedConversation.studentFirstName} ${selectedConversation.studentLastName}`}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {studentAccountIds.has(selectedConversation.studentAccountId) ? "Репетитор" : "Ученик"}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
                                        {messages.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">Сообщений пока нет.</div>
                                        ) : (
                                            messages.map((message) => {
                                                const isMine = userAccountIds.has(message.senderAccountId);
                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div
                                                            className={`max-w-[88%] break-words rounded-2xl px-4 py-3 text-sm sm:max-w-[75%] ${isMine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                                                                }`}
                                                        >
                                                            <div className="mb-1 text-xs opacity-70">
                                                                {message.senderFirstName} {message.senderLastName}
                                                            </div>
                                                            {message.text}
                                                            {isMine ? (
                                                                <div className="mt-2 flex justify-end">
                                                                    {message.readAt ? (
                                                                        <CheckCheck size={14} className="opacity-90" />
                                                                    ) : (
                                                                        <Check size={14} className="opacity-80" />
                                                                    )}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                        <textarea
                                            value={messageDraft.text}
                                            onChange={(event) => setMessageDraft({ text: event.target.value })}
                                            className="min-h-24 min-w-0 flex-1 rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            placeholder="Напишите сообщение..."
                                        />
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => void sendMessage()}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                        >
                                            <Save size={16} />
                                            Отправить
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {activeAccount && activeSection === "lessons" && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl font-semibold">Мои занятия</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {activeAccount.type === "tutor"
                                            ? "Вы можете создать занятие после принятия заявки."
                                            : "Здесь отображаются ваши занятия."}
                                    </p>
                                </div>

                                {activeAccount.type === "tutor" && (
                                    <button
                                        type="button"
                                        onClick={() => setIsLessonFormOpen((current) => !current)}
                                        disabled={tutorStudents.length === 0}
                                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Plus size={16} />
                                        {isLessonFormOpen ? "Скрыть форму" : "Добавить занятие"}
                                    </button>
                                )}
                            </div>

                            {activeAccount.type === "tutor" && tutorStudents.length === 0 && (
                                <div className="mb-6 rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                    У вас пока нет учеников. Примите заявку ученика, чтобы запланировать занятие.
                                </div>
                            )}

                            {activeAccount.type === "tutor" && isLessonFormOpen && tutorStudents.length > 0 && (
                                <div className="mb-6 rounded-2xl border border-border bg-secondary/40 p-4">
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Ученик</span>
                                            <select
                                                value={lessonDraft.applicationId}
                                                onChange={(event) => {
                                                    const selectedApplicationId = Number(event.target.value);
                                                    const selectedStudent = tutorStudents.find((item) => item.applicationId === selectedApplicationId);
                                                    const selectedApplication = applications.find((item) => item.id === selectedApplicationId);
                                                    setLessonDraft((current) => ({
                                                        ...current,
                                                        applicationId: event.target.value,
                                                        studentAccountId: selectedStudent ? String(selectedStudent.studentAccountId) : current.studentAccountId,
                                                        subject: selectedApplication ? selectedApplication.tutorCard.subject : current.subject,
                                                        price: selectedApplication ? String(selectedApplication.tutorCard.pricePerLesson) : current.price,
                                                    }));
                                                }}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="">Выберите ученика</option>
                                                {tutorStudents.map((student) => (
                                                    <option key={student.applicationId} value={student.applicationId}>
                                                        {student.studentFirstName} {student.studentLastName} — {subjectLabel(student.subject)}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Предмет</span>
                                            <input
                                                value={lessonDraft.subject}
                                                onChange={(event) => setLessonDraft((current) => ({ ...current, subject: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Дата и время</span>
                                            <input
                                                type="datetime-local"
                                                value={lessonDraft.startDateTime}
                                                onChange={(event) => setLessonDraft((current) => ({ ...current, startDateTime: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Длительность, минут</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={lessonDraft.durationMinutes}
                                                onChange={(event) => setLessonDraft((current) => ({ ...current, durationMinutes: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm text-muted-foreground">Цена</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={lessonDraft.price}
                                                onChange={(event) => setLessonDraft((current) => ({ ...current, price: event.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                        <label className="block md:col-span-2 xl:col-span-3">
                                            <span className="text-sm text-muted-foreground">Ссылка на созвон</span>
                                            <input
                                                value={lessonDraft.videoMeetingUrl}
                                                onChange={(event) => setLessonDraft((current) => ({ ...current, videoMeetingUrl: event.target.value }))}
                                                placeholder="https://telemost.yandex.ru/..."
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            disabled={isBusy || tutorStudents.length === 0}
                                            onClick={() => void createLesson()}
                                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Plus size={16} />
                                            Создать занятие
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsLessonFormOpen(false);
                                                setLessonDraft(emptyLesson());
                                            }}
                                            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-secondary"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            )}

                            {lessons.length > 0 && (
                                <div className="mb-6 rounded-2xl border border-border bg-secondary/30 p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { key: "all" as LessonFilter, label: "Все", count: lessonFilterCounts.all },
                                            { key: "upcoming" as LessonFilter, label: "Предстоящие", count: lessonFilterCounts.upcoming },
                                            { key: "past" as LessonFilter, label: "Прошедшие", count: lessonFilterCounts.past },
                                            { key: "cancelled" as LessonFilter, label: "Отмененные", count: lessonFilterCounts.cancelled },
                                        ].map((filter) => (
                                            <button
                                                key={filter.key}
                                                type="button"
                                                onClick={() => setLessonFilter(filter.key)}
                                                className={`rounded-xl px-4 py-2 text-sm transition ${lessonFilter === filter.key
                                                        ? "bg-primary text-primary-foreground"
                                                        : "border border-border bg-card hover:bg-secondary"
                                                    }`}
                                            >
                                                {filter.label} · {filter.count}
                                            </button>
                                        ))}
                                    </div>

                                    {activeAccount.type === "tutor" && lessonStudents.length > 0 && (
                                        <label className="mt-4 block max-w-sm">
                                            <span className="text-sm text-muted-foreground">Сортировать по ученику</span>
                                            <select
                                                value={lessonStudentFilter}
                                                onChange={(event) => setLessonStudentFilter(event.target.value)}
                                                className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="">Все ученики</option>
                                                {lessonStudents.map(([studentAccountId, studentName]) => (
                                                    <option key={studentAccountId} value={studentAccountId}>
                                                        {studentName || "Ученик"}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    )}
                                </div>
                            )}
                            <div className="space-y-3">
                                {lessons.length === 0 ? (
                                    <div className="rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                        {activeAccount.type === "student"
                                            ? "У вас пока нет запланированных занятий."
                                            : "Пока занятий нет."}
                                    </div>
                                ) : filteredLessons.length === 0 ? (
                                    <div className="rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                        По выбранным фильтрам занятий нет.
                                    </div>
                                ) : (
                                    filteredLessons.map((lesson) => {
                                        const isStudentView = activeAccount.type === "student";
                                        const participantName = isStudentView
                                            ? lesson.tutorFirstName + " " + lesson.tutorLastName
                                            : lesson.studentFirstName + " " + lesson.studentLastName;
                                        const canManageLesson = userAccountIds.has(lesson.tutorAccountId);
                                        const isEditingLesson = editingLessonId === lesson.id;
                                        return (
                                            <div key={lesson.id} className="rounded-2xl border border-border bg-card p-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <div className="text-base font-semibold">{subjectLabel(lesson.subject)}</div>
                                                        <div className="mt-1 text-sm text-muted-foreground">
                                                            {isStudentView ? "Репетитор: " + participantName : "Ученик: " + participantName}
                                                            {" · "}
                                                            {lessonStatusLabel(lesson.status)}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-full bg-secondary px-3 py-1 text-sm">
                                                        {lesson.price.toLocaleString("ru-RU")} ₽ / час
                                                    </div>
                                                </div>
                                                {canManageLesson && (
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingLessonId(lesson.id);
                                                                setLessonEditDraft(lessonFormFromView(lesson));
                                                            }}
                                                            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition hover:bg-secondary"
                                                        >
                                                            <Edit3 size={15} />
                                                            Редактировать
                                                        </button>
                                                        {lesson.status !== "CANCELLED" && (
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={() => void cancelLesson(lesson.id)}
                                                                className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                <EyeOff size={15} />
                                                                Отменить занятие
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                                                    <div>Дата: {formatDate(lesson.startDateTime)}</div>
                                                    <div>Длительность: {lesson.durationMinutes} мин</div>
                                                    {!isStudentView && (
                                                        <div>
                                                            Ученик: {lesson.studentFirstName} {lesson.studentLastName}
                                                        </div>
                                                    )}
                                                    {isStudentView && (
                                                        <div>
                                                            Репетитор: {lesson.tutorFirstName} {lesson.tutorLastName}
                                                        </div>
                                                    )}
                                                    <div>Карточка: {lesson.tutorCardTitle}</div>
                                                </div>
                                                {canManageLesson && isEditingLesson && (
                                                    <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            <label className="block">
                                                                <span className="text-sm text-muted-foreground">Предмет</span>
                                                                <input
                                                                    value={lessonEditDraft.subject}
                                                                    onChange={(event) => setLessonEditDraft((current) => ({ ...current, subject: event.target.value }))}
                                                                    className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                />
                                                            </label>
                                                            <label className="block">
                                                                <span className="text-sm text-muted-foreground">Дата и время</span>
                                                                <input
                                                                    type="datetime-local"
                                                                    value={lessonEditDraft.startDateTime}
                                                                    onChange={(event) => setLessonEditDraft((current) => ({ ...current, startDateTime: event.target.value }))}
                                                                    className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                />
                                                            </label>
                                                            <label className="block">
                                                                <span className="text-sm text-muted-foreground">Длительность, минут</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={lessonEditDraft.durationMinutes}
                                                                    onChange={(event) => setLessonEditDraft((current) => ({ ...current, durationMinutes: event.target.value }))}
                                                                    className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                />
                                                            </label>
                                                            <label className="block">
                                                                <span className="text-sm text-muted-foreground">Цена</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={lessonEditDraft.price}
                                                                    onChange={(event) => setLessonEditDraft((current) => ({ ...current, price: event.target.value }))}
                                                                    className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                />
                                                            </label>
                                                            <label className="block md:col-span-2">
                                                                <span className="text-sm text-muted-foreground">Ссылка на созвон</span>
                                                                <input
                                                                    value={lessonEditDraft.videoMeetingUrl}
                                                                    onChange={(event) => setLessonEditDraft((current) => ({ ...current, videoMeetingUrl: event.target.value }))}
                                                                    placeholder="https://telemost.yandex.ru/..."
                                                                    className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                />
                                                            </label>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap gap-3">
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={() => void updateLesson(lesson.id)}
                                                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                <Save size={16} />
                                                                Сохранить
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingLessonId(null);
                                                                    setLessonEditDraft(emptyLesson());
                                                                }}
                                                                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm transition hover:bg-secondary"
                                                            >
                                                                Отмена
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="mt-4">
                                                    {lesson.videoMeetingUrl ? (
                                                        <a
                                                            href={lesson.videoMeetingUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 md:w-auto md:px-6"
                                                        >
                                                            Перейти на занятие
                                                        </a>
                                                    ) : (
                                                        <div className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                                                            Ссылка ещё не создана
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    )}
                    {activeSection === "reviews" && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h2 className="mb-2 text-2xl font-semibold">Мои отзывы</h2>
                            <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
                                Ученики могут оставить отзыв репетитору после принятой заявки, а репетитор может ответить на отзыв.
                            </p>

                            {hasStudentAccount && (
                                <div className="mb-8">
                                    <h3 className="mb-3 text-lg font-semibold">Отзывы, которые я оставил</h3>
                                    {studentTutors.length === 0 ? (
                                        <div className="rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                            У вас пока нет репетиторов, которым можно оставить отзыв.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {studentTutors.map((tutor) => {
                                                const existingReview = studentReviews.find((review) => review.tutorAccountId === tutor.tutorAccountId);
                                                const draft = reviewDrafts[tutor.tutorAccountId] ?? emptyReview();

                                                return (
                                                    <div key={tutor.tutorAccountId} className="rounded-2xl border border-border bg-card p-4">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <div className="font-semibold">
                                                                    {tutor.tutorFirstName} {tutor.tutorLastName}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {subjectLabel(tutor.subject)} · заявка принята {formatDate(tutor.acceptedAt)}
                                                                </div>
                                                            </div>
                                                            {existingReview ? (
                                                                <div className="rounded-full bg-secondary px-3 py-1 text-sm">
                                                                    {existingReview.rating} / 5
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        {existingReview ? (
                                                            <div className="mt-4 space-y-3 text-sm">
                                                                <div className="rounded-xl bg-secondary p-4">
                                                                    <div className="mb-1 font-medium">Ваш отзыв</div>
                                                                    <div>{existingReview.text}</div>
                                                                    <div className="mt-2 text-xs text-muted-foreground">{formatDate(existingReview.createdAt)}</div>
                                                                </div>
                                                                {existingReview.tutorReply ? (
                                                                    <div className="rounded-xl border border-border p-4">
                                                                        <div className="mb-1 font-medium">Ответ репетитора</div>
                                                                        <div>{existingReview.tutorReply}</div>
                                                                        <div className="mt-2 text-xs text-muted-foreground">
                                                                            {formatDate(existingReview.tutorRepliedAt)}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-sm text-muted-foreground">Репетитор пока не ответил.</div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="mt-4 space-y-3">
                                                                <label className="block">
                                                                    <span className="text-sm text-muted-foreground">Оценка</span>
                                                                    <select
                                                                        value={draft.rating}
                                                                        onChange={(event) =>
                                                                            setReviewDrafts((current) => ({
                                                                                ...current,
                                                                                [tutor.tutorAccountId]: { ...draft, rating: event.target.value },
                                                                            }))
                                                                        }
                                                                        className="mt-1 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                    >
                                                                        {[5, 4, 3, 2, 1].map((rating) => (
                                                                            <option key={rating} value={rating}>
                                                                                {rating} звезд
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </label>
                                                                <label className="block">
                                                                    <span className="text-sm text-muted-foreground">Текст отзыва</span>
                                                                    <textarea
                                                                        value={draft.text}
                                                                        onChange={(event) =>
                                                                            setReviewDrafts((current) => ({
                                                                                ...current,
                                                                                [tutor.tutorAccountId]: { ...draft, text: event.target.value },
                                                                            }))
                                                                        }
                                                                        className="mt-1 min-h-24 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                                    />
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    disabled={isBusy}
                                                                    onClick={() => void createReview(tutor.tutorAccountId)}
                                                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    <Save size={16} />
                                                                    Оставить отзыв
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {hasTutorAccount && (
                                <div>
                                    <h3 className="mb-3 text-lg font-semibold">Отзывы обо мне</h3>
                                    {tutorReviews.length === 0 ? (
                                        <div className="rounded-2xl border border-border bg-secondary p-5 text-sm text-muted-foreground">
                                            У вас пока нет отзывов от учеников.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {tutorReviews.map((review) => (
                                                <div key={review.id} className="rounded-2xl border border-border bg-card p-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <div className="font-semibold">
                                                                {review.studentFirstName} {review.studentLastName}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</div>
                                                        </div>
                                                        <div className="rounded-full bg-secondary px-3 py-1 text-sm">{review.rating} / 5</div>
                                                    </div>
                                                    <div className="mt-4 rounded-xl bg-secondary p-4 text-sm">{review.text}</div>

                                                    <div className="mt-4">
                                                        <label className="block">
                                                            <span className="text-sm text-muted-foreground">Ответ репетитора</span>
                                                            <textarea
                                                                value={replyDrafts[review.id] ?? review.tutorReply ?? ""}
                                                                onChange={(event) =>
                                                                    setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))
                                                                }
                                                                className="mt-1 min-h-24 w-full rounded-xl border border-border bg-input-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring"
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => void replyToReview(review.id)}
                                                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <Save size={16} />
                                                            {review.tutorReply ? "Обновить ответ" : "Ответить"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}
                    {activeSection === "settings" && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h2 className="mb-2 text-2xl font-semibold">Настройки</h2>
                            <p className="max-w-3xl text-muted-foreground">
                                Один пользователь может иметь несколько аккаунтов. Здесь можно создать недостающий тип аккаунта и
                                переключаться между ними.
                            </p>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {!hasStudentAccount && (
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => createAccount("student")}
                                        className="flex items-center justify-between rounded-2xl border border-border bg-secondary p-5 text-left transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <span>
                                            <span className="mb-1 block text-base font-semibold">Создать аккаунт ученика</span>
                                            <span className="block text-sm text-muted-foreground">После создания появится пустой профиль.</span>
                                        </span>
                                        <GraduationCap size={20} className="text-primary" />
                                    </button>
                                )}

                                {!hasTutorAccount && (
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => createAccount("tutor")}
                                        className="flex items-center justify-between rounded-2xl border border-border bg-secondary p-5 text-left transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <span>
                                            <span className="mb-1 block text-base font-semibold">Создать аккаунт репетитора</span>
                                            <span className="block text-sm text-muted-foreground">После создания появится пустой профиль.</span>
                                        </span>
                                        <BookOpen size={20} className="text-primary" />
                                    </button>
                                )}
                            </div>

                            {accounts.length > 1 && (
                                <div className="mt-6">
                                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Переключение аккаунта
                                    </h3>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {accounts.map((account) => (
                                            <button
                                                key={account.id}
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => selectAccount(account.type)}
                                                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${account.active ? "border-primary bg-secondary/70" : "border-border bg-card hover:border-primary/40"
                                                    }`}
                                            >
                                                <span>
                                                    <span className="mb-1 block text-sm font-semibold">{accountLabel(account.type)}</span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {account.active ? "Активный аккаунт" : "Переключиться"}
                                                    </span>
                                                </span>
                                                {account.type === "student" ? (
                                                    <GraduationCap size={18} className="text-primary" />
                                                ) : (
                                                    <BookOpen size={18} className="text-primary" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </section>
        </main>
    );
}

