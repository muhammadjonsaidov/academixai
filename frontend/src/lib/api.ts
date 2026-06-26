import { getToken } from "./auth";

type RequestInit2 = Omit<RequestInit, "headers"> & { headers?: Record<string, string> };

async function request<T>(path: string, init: RequestInit2 = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
  title: string;
  subject: string;
  gradeLevel: string;
  emoji?: string;
  teacherName?: string;
  lessons?: Lesson[];
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
export const getCourse = (id: number) => api.get<Course>(`/api/courses/${id}`);
export const getLesson = (courseId: number, lessonId: number) =>
  api.get<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}`);
// ── Teacher ───────────────────────────────────────────────────────────────────
export const getTeacherCourses = () => api.get<Course[]>("/api/teacher/courses");
export const getCourseAnalytics = (courseId: number) =>
  api.get<{ studentCount: number; avgScore: number; aiInsight: string }>(`/api/teacher/courses/${courseId}/analytics`);

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
  id: number; fullName: string; email: string; role: string; subscriptionTier: string; createdAt: string;
}
export const getProfile = () => api.get<StudentProfile>("/api/student/me");
export const updateProfile = (fullName: string) => api.put<StudentProfile>("/api/student/me", { fullName });

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
  api.get<{ notifications: AppNotification[]; unreadCount: number }>("/api/student/notifications");
export const markNotificationRead = (id: number) =>
  api.put<{ message: string }>(`/api/student/notifications/${id}/read`, {});

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
export const addTeacher = (fullName: string, email: string) =>
  api.post<AdminUser>("/api/admin/teachers", { fullName, email });
export const addStudent = (fullName: string, email: string) =>
  api.post<AdminUser>("/api/admin/students", { fullName, email });
