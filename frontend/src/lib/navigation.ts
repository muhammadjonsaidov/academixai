import type { UserRole } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import {
  Home, Sparkles, ClipboardList, GraduationCap, NotebookPen, Trophy, Compass,
  User, Settings, Users, Calendar, MessageSquare, BarChart3, FileText,
  Megaphone, BookOpen, Brain, HeartHandshake, School, Bell, Wand2, type LucideIcon,
} from "lucide-react";

export interface NavItem { label: string; to: string; icon: LucideIcon; badge?: string; }
export interface NavSection { label?: string; items: NavItem[]; }

export function useNavigation(): { sections: Record<UserRole, NavSection[]>; roleLabel: Record<UserRole, string> } {
  const { t, lang } = useT();
  const n = t.nav;

  const account = lang === "en" ? "Account" : lang === "ru" ? "Аккаунт" : "Hisob";

  const byRole: Record<UserRole, NavSection[]> = {
    student: [
      {
        items: [
          { label: n.home, to: "/student", icon: Home },
          { label: n.courses, to: "/student/courses", icon: BookOpen },
          { label: n.aiTutor, to: "/student/ai-tutor", icon: Sparkles, badge: "AI" },
          { label: n.assignments, to: "/student/assignments", icon: ClipboardList },
          { label: n.exams, to: "/student/exams", icon: GraduationCap },
          { label: n.labs, to: "/student/labs", icon: Brain },
          { label: n.notes, to: "/student/notes", icon: NotebookPen },
          { label: n.achievements, to: "/student/achievements", icon: Trophy },
          { label: n.career, to: "/student/career", icon: Compass },
          { label: n.notifications, to: "/student/notifications", icon: Bell },
        ],
      },
      { label: account, items: [
        { label: n.profile, to: "/student/profile", icon: User },
        { label: n.settings, to: "/student/settings", icon: Settings },
      ]},
    ],
    parent: [
      {
        items: [
          { label: n.home, to: "/parent", icon: Home },
          { label: n.myChild, to: "/parent/child", icon: HeartHandshake },
          { label: n.progress, to: "/parent/progress", icon: BarChart3 },
          { label: n.aiReport, to: "/parent/ai-report", icon: Brain },
          { label: n.aiSuggestions, to: "/parent/ai-suggestions", icon: Sparkles },
          { label: n.messages, to: "/parent/messages", icon: MessageSquare },
        ],
      },
      { label: account, items: [{ label: n.settings, to: "/parent/settings", icon: Settings }] },
    ],
    teacher: [
      {
        items: [
          { label: n.dashboard, to: "/teacher", icon: Home },
          { label: n.students, to: "/teacher/students", icon: Users },
          { label: n.assignments, to: "/teacher/assignments", icon: ClipboardList },
          { label: n.exams, to: "/teacher/exams", icon: GraduationCap },
          { label: n.attendance, to: "/teacher/attendance", icon: BookOpen },
          { label: n.aiAssistant, to: "/teacher/ai-assistant", icon: Sparkles },
          { label: "Dars loyihasi", to: "/teacher/lesson-draft", icon: Wand2, badge: "AI" },
          { label: n.reports, to: "/teacher/reports", icon: FileText },
          { label: n.messages, to: "/teacher/messages", icon: MessageSquare },
          { label: n.calendar, to: "/teacher/calendar", icon: Calendar },
        ],
      },
      { label: account, items: [{ label: n.settings, to: "/teacher/settings", icon: Settings }] },
    ],
    admin: [
      {
        items: [
          { label: n.dashboard, to: "/admin", icon: Home },
          { label: n.teachers, to: "/admin/teachers", icon: Users },
          { label: n.students, to: "/admin/students", icon: GraduationCap },
          { label: n.parents, to: "/admin/parents", icon: HeartHandshake },
          { label: n.classes, to: "/admin/classes", icon: School },
          { label: n.attendance, to: "/admin/attendance", icon: BookOpen },
          { label: n.reports, to: "/admin/reports", icon: FileText },
          { label: n.analytics, to: "/admin/analytics", icon: BarChart3 },
          { label: n.announcements, to: "/admin/announcements", icon: Megaphone },
        ],
      },
      { label: account, items: [{ label: n.settings, to: "/admin/settings", icon: Settings }] },
    ],
  };

  const roleLabelMap: Record<UserRole, string> = {
    student: lang === "en" ? "Student" : lang === "ru" ? "Ученик" : "O'quvchi",
    parent: lang === "en" ? "Parent" : lang === "ru" ? "Родитель" : "Ota-ona",
    teacher: lang === "en" ? "Teacher" : lang === "ru" ? "Учитель" : "O'qituvchi",
    admin: lang === "en" ? "Admin" : lang === "ru" ? "Администратор" : "Maktab admini",
  };

  return { sections: byRole, roleLabel: roleLabelMap };
}

// kept for Header search — static Uzbek fallback
export function navForRole(role: UserRole): NavSection[] {
  const base: Record<UserRole, NavSection[]> = {
    student: [{ items: [
      { label: "Bosh sahifa", to: "/student", icon: Home },
      { label: "Kurslarim", to: "/student/courses", icon: BookOpen },
      { label: "AI Ustoz", to: "/student/ai-tutor", icon: Sparkles },
      { label: "Topshiriqlar", to: "/student/assignments", icon: ClipboardList },
      { label: "Imtihonlar", to: "/student/exams", icon: GraduationCap },
      { label: "Eslatmalar", to: "/student/notes", icon: NotebookPen },
      { label: "Yutuqlar", to: "/student/achievements", icon: Trophy },
      { label: "Bildirishnomalar", to: "/student/notifications", icon: Bell },
      { label: "Profil", to: "/student/profile", icon: User },
      { label: "Sozlamalar", to: "/student/settings", icon: Settings },
    ]}],
    parent: [{ items: [
      { label: "Bosh sahifa", to: "/parent", icon: Home },
      { label: "Farzandim", to: "/parent/child", icon: HeartHandshake },
      { label: "Sozlamalar", to: "/parent/settings", icon: Settings },
    ]}],
    teacher: [{ items: [
      { label: "Dashboard", to: "/teacher", icon: Home },
      { label: "O'quvchilar", to: "/teacher/students", icon: Users },
      { label: "Davomat", to: "/teacher/attendance", icon: BookOpen },
      { label: "Sozlamalar", to: "/teacher/settings", icon: Settings },
    ]}],
    admin: [{ items: [
      { label: "Dashboard", to: "/admin", icon: Home },
      { label: "Sozlamalar", to: "/admin/settings", icon: Settings },
    ]}],
  };
  return base[role];
}

export function roleLabel(role: UserRole): string {
  return { student: "O'quvchi", parent: "Ota-ona", teacher: "O'qituvchi", admin: "Maktab admini" }[role];
}
