import type { UserRole } from "@/lib/auth";
import {
  Home,
  Sparkles,
  ClipboardList,
  GraduationCap,
  NotebookPen,
  Trophy,
  Compass,
  User,
  Settings,
  Users,
  Calendar,
  MessageSquare,
  BarChart3,
  FileText,
  Megaphone,
  BookOpen,
  Brain,
  HeartHandshake,
  School,
  Bell,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const studentNav: NavSection[] = [
  {
    items: [
      { label: "Bosh sahifa", to: "/student", icon: Home },
      { label: "Kurslarim", to: "/student/kurslar", icon: BookOpen },
      { label: "AI Ustoz", to: "/student/ai-ustoz", icon: Sparkles, badge: "AI" },
      { label: "Topshiriqlar", to: "/student/topshiriqlar", icon: ClipboardList },
      { label: "Imtihonlar", to: "/student/imtihonlar", icon: GraduationCap },
      { label: "Laboratoriya", to: "/student/labs", icon: Brain },
      { label: "Eslatmalar", to: "/student/eslatmalar", icon: NotebookPen },
      { label: "Yutuqlar", to: "/student/yutuqlar", icon: Trophy },
      { label: "Kasbiy yo'l", to: "/student/kasbiy-yol", icon: Compass },
      { label: "Bildirishnomalar", to: "/student/bildirishnomalar", icon: Bell },
    ],
  },
  {
    label: "Hisob",
    items: [
      { label: "Profil", to: "/student/profil", icon: User },
      { label: "Sozlamalar", to: "/student/sozlamalar", icon: Settings },
    ],
  },
];

export const parentNav: NavSection[] = [
  {
    items: [
      { label: "Bosh sahifa", to: "/parent", icon: Home },
      { label: "Farzandim", to: "/parent/farzandim", icon: HeartHandshake },
      { label: "O'zlashtirish", to: "/parent/ozlashtirish", icon: BarChart3 },
      { label: "AI Hisobot", to: "/parent/ai-hisobot", icon: Brain },
      { label: "AI Tavsiyalar", to: "/parent/ai-tavsiyalar", icon: Sparkles },
      { label: "Xabarlar", to: "/parent/xabarlar", icon: MessageSquare },
    ],
  },
  { label: "Hisob", items: [{ label: "Sozlamalar", to: "/parent/sozlamalar", icon: Settings }] },
];

export const teacherNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", to: "/teacher", icon: Home },
      { label: "O'quvchilar", to: "/teacher/oquvchilar", icon: Users },
      { label: "Topshiriqlar", to: "/teacher/topshiriqlar", icon: ClipboardList },
      { label: "Imtihonlar", to: "/teacher/imtihonlar", icon: GraduationCap },
      { label: "Davomat", to: "/teacher/davomat", icon: BookOpen },
      { label: "AI Yordamchi", to: "/teacher/ai-yordamchi", icon: Sparkles },
      { label: "Hisobotlar", to: "/teacher/hisobotlar", icon: FileText },
      { label: "Xabarlar", to: "/teacher/xabarlar", icon: MessageSquare },
      { label: "Kalendar", to: "/teacher/kalendar", icon: Calendar },
    ],
  },
  { label: "Hisob", items: [{ label: "Sozlamalar", to: "/teacher/sozlamalar", icon: Settings }] },
];

export const adminNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", to: "/admin", icon: Home },
      { label: "O'qituvchilar", to: "/admin/oqituvchilar", icon: Users },
      { label: "O'quvchilar", to: "/admin/oquvchilar", icon: GraduationCap },
      { label: "Sinflar", to: "/admin/sinflar", icon: School },
      { label: "Davomat", to: "/admin/davomat", icon: BookOpen },
      { label: "Hisobotlar", to: "/admin/hisobotlar", icon: FileText },
      { label: "Analitika", to: "/admin/analitika", icon: BarChart3 },
      { label: "E'lonlar", to: "/admin/elonlar", icon: Megaphone },
    ],
  },
  { label: "Hisob", items: [{ label: "Sozlamalar", to: "/admin/sozlamalar", icon: Settings }] },
];

export function navForRole(role: UserRole): NavSection[] {
  switch (role) {
    case "student": return studentNav;
    case "parent": return parentNav;
    case "teacher": return teacherNav;
    case "admin": return adminNav;
  }
}

export function roleLabel(role: UserRole): string {
  return {
    student: "O'quvchi",
    parent: "Ota-ona",
    teacher: "O'qituvchi",
    admin: "Maktab admini",
  }[role];
}
