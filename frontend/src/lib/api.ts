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
export const enrollCourse = (courseId: number) =>
  api.post<void>(`/api/courses/${courseId}/enroll`, {});

// ── Teacher ───────────────────────────────────────────────────────────────────
export const getTeacherCourses = () => api.get<Course[]>("/api/teacher/courses");
export const createCourse = (data: { title: string; subject: string; gradeLevel: string }) =>
  api.post<Course>("/api/teacher/courses", data);
export const addLesson = (courseId: number, data: { title: string; contentUz: string; orderIndex: number }) =>
  api.post<Lesson>(`/api/teacher/courses/${courseId}/lessons`, data);
export const getCourseAnalytics = (courseId: number) =>
  api.get<{ studentCount: number; avgScore: number; aiInsight: string }>(`/api/teacher/courses/${courseId}/analytics`);
export const generateLessonDraft = (data: { subject: string; topic: string; gradeLevel: string }) =>
  api.post<{ draft: string }>("/api/teacher/lesson-draft", data);

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export const sendChat = (message: string, lessonId?: number) =>
  api.post<{ reply: string; response?: string; timestamp: string }>("/api/chat", { message, lessonId })
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

// ── Parent ────────────────────────────────────────────────────────────────────

export interface ChildInfo {
  hasChild: boolean;
  child?: { id: number; fullName: string; email: string };
  avgScore?: number;
  chatCount?: number;
  recentExams?: ExamResultDetail[];
  enrolledCourses?: Array<{ id: number; title: string; subject: string; emoji: string }>;
}
export const getChildInfo = () => api.get<ChildInfo>("/api/parent/child");

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
