import { getToken } from "./auth";

type RequestInit2 = Omit<RequestInit, "headers"> & { headers?: Record<string, string> };

function getAcceptLanguage(): string {
  try {
    const stored = typeof localStorage !== "undefined"
      ? localStorage.getItem("academix_lang")
      : null;
    if (stored && ["uz", "en", "ru"].includes(stored)) return stored;
  } catch {}
  return "uz";
}

async function request<T>(path: string, init: RequestInit2 = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": getAcceptLanguage(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ── Courses ──────────────────────────────────────────────────────────────────
export interface Course {
  id: number;
  title?: string;
  titleUz?: string;
  titleEn?: string;
  subject: string;
  gradeLevel: number | string;
  emoji?: string;
  coverEmoji?: string;
  teacherName?: string;
  lessons?: Lesson[];
  lessonCount?: number;
  studentCount?: number;
}

export interface Lesson {
  id: number;
  title: string;
  titleUz?: string;
  contentUz?: string;
  orderIndex: number;
  orderNum?: number;
  phetUrl?: string;
  videoUrl?: string;
}

export const getCourses = () => api.get<Course[]>("/api/courses");
export const getAllCourses = () => api.get<Course[]>("/api/courses/all").catch(() => api.get<Course[]>("/api/courses"));
export const getCourse = (id: number) => api.get<Course>(`/api/courses/${id}`);
export const getLesson = (courseId: number, lessonId: number) =>
  api.get<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}`);
export const enrollCourse = (courseId: number) =>
  api.post<{ message: string }>(`/api/courses/${courseId}/enroll`, {});
// ── Teacher ───────────────────────────────────────────────────────────────────
export const getTeacherCourses = () => api.get<Course[]>("/api/teacher/courses");
export const getCourseAnalytics = (courseId: number) =>
  api.get<{ studentCount: number; avgScore: number; aiInsight: string }>(`/api/teacher/courses/${courseId}/analytics`);
export const createCourse = (data: { titleUz: string; subject: string; gradeLevel: number; descriptionUz?: string; coverEmoji?: string }) =>
  api.post<Course>("/api/teacher/courses", data);
export const createLesson = (courseId: number, data: { titleUz: string; contentUz?: string; phetUrl?: string; videoUrl?: string; orderNum?: number }) =>
  api.post<Lesson>(`/api/teacher/courses/${courseId}/lessons`, data);
export const generateLessonDraft = (topic: string, subject: string, gradeLevel: number) =>
  api.post<{ draft: string }>("/api/teacher/lesson-draft", { topic, subject, gradeLevel });

export interface TeacherStudent { id: number; fullName: string; email: string; avgScore: number; courseCount: number; }
export const getTeacherStudents = () => api.get<TeacherStudent[]>("/api/teacher/students");

export interface AttendanceRecord { id: number; studentId?: number; studentName: string; studentEmail?: string; courseName?: string; date: string; present: boolean; }
export const getCourseAttendance = (courseId: number, date?: string) =>
  api.get<AttendanceRecord[]>(`/api/teacher/courses/${courseId}/attendance${date ? `?date=${date}` : ""}`);
export const markAttendance = (courseId: number, studentId: number, date: string, present: boolean) =>
  api.post<{ message: string }>(
    `/api/teacher/courses/${courseId}/attendance?studentId=${studentId}&date=${date}&present=${present}`,
    {}
  );

export interface TeacherExamResult { id: number; studentName: string; lessonTitle: string; courseName: string; score: number; feedbackUz?: string; takenAt: string; }
export const getTeacherExamResults = () => api.get<TeacherExamResult[]>("/api/teacher/exam-results");

export const teacherAiChat = (message: string) =>
  api.post<{ reply: string }>("/api/teacher/ai-chat", { message });

export const getParentNotifications = () =>
  api.get<{ notifications: AppNotification[]; unreadCount: number }>("/api/parent/notifications");

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface ChatSource { fileName: string; snippet: string; }
export interface ChatResponse {
  reply: string; response: string; timestamp: string;
  sources?: ChatSource[]; usedKnowledgeBase?: boolean;
}
export const sendChat = (message: string, lessonId?: number) =>
  api.post<ChatResponse>("/api/chat", { message, lessonId })
    .then(r => ({ ...r, response: r.reply ?? r.response ?? "" }));
export const getChatHistory = () => api.get<ChatMessage[]>("/api/chat/history");

// ── Student profile, notes & dashboard ───────────────────────────────────────

export interface StudentProfile {
  id: number; fullName: string; email: string; role: string; subscriptionTier: string; createdAt: string; avatarUrl?: string;
}
export const getProfile = () => api.get<StudentProfile>("/api/user/me");
export const updateProfile = (fullName: string) => api.put<StudentProfile>("/api/user/me", { fullName });

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const { getToken } = await import("./auth");
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/user/me/avatar", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json();
}
export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put<{ message: string }>("/api/user/me/password", { currentPassword, newPassword });

// ── Notification preferences ──────────────────────────────────────────────────
export interface NotifPrefs {
  emailNotif: boolean;
  pushNotif: boolean;
  weeklyReport: boolean;
  aiTips: boolean;
}
export const getPreferences = () => api.get<NotifPrefs>("/api/user/me/preferences");
export const updatePreferences = (prefs: Partial<NotifPrefs>) =>
  api.put<NotifPrefs>("/api/user/me/preferences", prefs);

export interface PushSubscriptionPayload {
  endpoint: string;
  keys?: { p256dh: string; auth: string };
}
export const getVapidPublicKey = () =>
  api.get<{ publicKey: string; enabled: boolean }>("/api/user/notifications/vapid-public-key");
export const subscribePush = (subscription: PushSubscriptionPayload) =>
  api.post<{ message: string }>("/api/user/notifications/push-subscribe", subscription);
export const unsubscribePush = () =>
  api.delete<{ message: string }>("/api/user/notifications/push-subscribe");

export interface StudentNote {
  id: number; content: string; lessonId?: number; lessonTitle?: string; createdAt: string;
}
export const getNotes = () => api.get<StudentNote[]>("/api/student/notes");
export const createNote = (content: string, lessonId?: number) =>
  api.post<StudentNote>("/api/student/notes", { content, lessonId });
export const deleteNote = (id: number) => api.delete<{ message: string }>(`/api/student/notes/${id}`);

export interface DashboardStats {
  enrolledCount: number; avgScore: number; chatCount: number;
  recentExams: Array<{ id: number; score: number; lessonTitle: string; courseName: string; takenAt: string }>;
}
export const getDashboard = () => api.get<DashboardStats>("/api/student/dashboard");

// ── Homework ──────────────────────────────────────────────────────────────────
export interface HomeworkResult {
  id?: number; subject: string; status: string;
  ocrText: string; isCorrect: boolean; score: number;
  method: string; errors: string[]; feedback: string;
  resubmitRequired: boolean; resubmitReason?: string;
  imageData?: string; aiFeedback?: string; createdAt?: string;
}
export const getHomeworkList = () => api.get<HomeworkResult[]>("/api/student/homework");
export async function submitHomework(file: File, subject = "Matematika"): Promise<HomeworkResult> {
  const { getToken } = await import("./auth");
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  fd.append("subject", subject);
  const res = await fetch("/api/student/homework/submit", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Exam ──────────────────────────────────────────────────────────────────────

export interface ExamQuestion {
  question: string;
  options: string[];
  correctIndex?: number;
}

export interface ExamResultDetail {
  id: number; score: number; feedbackUz?: string; takenAt: string;
  lessonId?: number; lessonTitle?: string; courseId?: number; courseName?: string;
}

export const generateExam = (lessonId: number, questionCount = 5) =>
  api.post<ExamQuestion[]>("/api/exam/generate", { lessonId, questionCount });
export const gradeExam = (data: { studentId: number; lessonId: number; answers: string[] }) =>
  api.post<{ score: number; feedbackUz: string }>("/api/exam/grade", data);
export const getExamResults = () => api.get<ExamResultDetail[]>("/api/exam/results");

// ── Notifications ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: number; type: string; title: string; body: string; isRead: boolean; createdAt: string;
}
export const getNotifications = () =>
  api.get<{ notifications: AppNotification[]; unreadCount: number }>("/api/user/notifications");
export const markNotificationRead = (id: number) =>
  api.put<{ message: string }>(`/api/user/notifications/${id}/read`, {});

// ── Documents (Teacher RAG) ───────────────────────────────────────────────────

export interface TeacherDocument {
  id: number; fileName: string; fileType: string; tag: string; subject?: string;
  chunkCount: number; createdAt: string;
}
export const getTeacherDocuments = () => api.get<TeacherDocument[]>("/api/teacher/documents");
export const deleteTeacherDocument = (id: number) =>
  api.delete<{ message: string }>(`/api/teacher/documents/${id}`);

export async function uploadTeacherDocument(file: File, tag: string, subject?: string): Promise<TeacherDocument> {
  const { getToken } = await import("./auth");
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  fd.append("tag", tag);
  if (subject) fd.append("subject", subject);
  const res = await fetch("/api/teacher/documents", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Parent ────────────────────────────────────────────────────────────────────

export interface SentimentPoint { score: number; label: string; createdAt: string; }
export interface ChildInfo {
  hasChildren: boolean;
  children: Array<{
    id: number; fullName: string; email: string;
    avgScore: number; chatCount: number;
    recentExams: ExamResultDetail[];
    enrolledCourses: Array<{ id: number; title: string; subject: string; emoji: string }>;
    sentimentTrend: SentimentPoint[];
    latestNarrative?: string;
  }>;
}
export const getChildInfo = () => api.get<ChildInfo>("/api/parent/children");
export const askAboutChild = (question: string) =>
  api.post<{ answer: string; childName: string }>("/api/parent/ask", { question });
export const generateChildReport = (childId: number) =>
  api.post<{ narrative: string; avgScore: number }>(`/api/parent/children/${childId}/report`, {});

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export const getAdminAnalytics = () =>
  api.get<{ teacherCount: number; studentCount: number; avgScore: number; totalAbsences: number; atRiskAnalysis: string }>("/api/admin/analytics");
export const getAdminStudents = () => api.get<AdminUser[]>("/api/admin/students");
export const getAdminTeachers = () => api.get<AdminUser[]>("/api/admin/teachers");
export const addTeacher = (fullName: string, email: string, password?: string) =>
  api.post<AdminUser>("/api/admin/teachers", { fullName, email, ...(password ? { password } : {}) });
export const addStudent = (fullName: string, email: string, password?: string) =>
  api.post<AdminUser>("/api/admin/students", { fullName, email, ...(password ? { password } : {}) });
export const addParent = (fullName: string, email: string, password?: string) =>
  api.post<AdminUser>("/api/admin/parents", { fullName, email, ...(password ? { password } : {}) });
export const getAdminParents = () => api.get<AdminUser[]>("/api/admin/parents");
export const linkParent = (studentId: number, parentEmail: string) =>
  api.post<{ message: string }>(`/api/admin/students/${studentId}/link-parent`, { parentEmail });

export const getAdminAttendance = () => api.get<AttendanceRecord[]>("/api/admin/attendance");

export interface AttendanceStats {
  total: number; present: number; missed: number; attendanceRate: number;
  topAbsentStudents: { name: string; studentId: number; missed: number }[];
  topAbsentCourses: { course: string; courseId: number; missed: number }[];
  recentMissed: AttendanceRecord[];
}
export const getAdminAttendanceStats = () => api.get<AttendanceStats>("/api/admin/attendance/stats");

// ── School Classes ────────────────────────────────────────────────────────────
export interface SchoolClass {
  id: number;
  name: string;
  gradeLevel: number | null;
  schoolId: number;
  homeroomTeacherId: number | null;
  homeroomTeacherName: string | null;
  studentCount: number;
  createdAt: string;
}

export const getClasses = () => api.get<SchoolClass[]>("/api/admin/classes");
export const createClass = (name: string, gradeLevel?: number, homeroomTeacherId?: number) =>
  api.post<SchoolClass>("/api/admin/classes", { name, gradeLevel, homeroomTeacherId });
export const updateClass = (id: number, data: { name?: string; gradeLevel?: number; homeroomTeacherId?: number | null }) =>
  api.put<SchoolClass>(`/api/admin/classes/${id}`, data);
export const deleteClass = (id: number) =>
  api.delete<{ message: string }>(`/api/admin/classes/${id}`);
export const getClassStudents = (id: number) =>
  api.get<{ id: number; fullName: string; email: string }[]>(`/api/admin/classes/${id}/students`);
export const assignStudentToClass = (classId: number, studentId: number) =>
  api.post<{ message: string }>(`/api/admin/classes/${classId}/students/${studentId}`, {});
export const removeStudentFromClass = (classId: number, studentId: number) =>
  api.delete<{ message: string }>(`/api/admin/classes/${classId}/students/${studentId}`);
export const assignTeacherToClass = (classId: number, teacherId: number) =>
  api.post<{ message: string }>(`/api/admin/classes/${classId}/teacher/${teacherId}`, {});

// ── Announcements ─────────────────────────────────────────────────────────────
export interface Announcement {
  id: number;
  schoolId: number;
  authorId: number;
  title: string;
  body: string;
  target: string;
  createdAt: string;
}

export const getAnnouncements = () => api.get<Announcement[]>("/api/announcements");
export const createAnnouncement = (title: string, body: string, target = "ALL") =>
  api.post<Announcement>("/api/announcements", { title, body, target });
export const deleteAnnouncement = (id: number) =>
  api.delete<void>(`/api/announcements/${id}`);
