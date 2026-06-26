import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Login from './pages/Login'
import RoleSelect from './pages/RoleSelect'

import TeacherLayout from './layouts/TeacherLayout'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherCourses from './pages/teacher/Courses'
import TeacherCourseDetail from './pages/teacher/CourseDetail'
import AIInsights from './pages/teacher/AIInsights'
import ExamGenerator from './pages/teacher/ExamGenerator'
import LessonDraft from './pages/teacher/LessonDraft'

import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminTeachers from './pages/admin/Teachers'
import AdminStudents from './pages/admin/Students'
import AdminAnnouncements from './pages/admin/Announcements'

import StudentLayout from './layouts/StudentLayout'
import StudentDashboard from './pages/student/Dashboard'
import StudentCourses from './pages/student/Courses'
import StudentCourseDetail from './pages/student/CourseDetail'
import LessonPage from './pages/student/LessonPage'
import ChatPage from './pages/student/ChatPage'
import LabsPage from './pages/student/LabsPage'
import ExamPage from './pages/student/ExamPage'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/login" element={<Login />} />

        <Route path="/teacher" element={
          <ProtectedRoute role="TEACHER">
            <TeacherLayout />
          </ProtectedRoute>
        }>
          <Route index element={<TeacherDashboard />} />
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="courses/:id" element={<TeacherCourseDetail />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="exam" element={<ExamGenerator />} />
          <Route path="lesson-draft" element={<LessonDraft />} />
        </Route>

        <Route path="/admin" element={
          <ProtectedRoute role="SCHOOL_ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
        </Route>

        <Route path="/student" element={
          <ProtectedRoute role="STUDENT">
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:id" element={<StudentCourseDetail />} />
          <Route path="courses/:courseId/lessons/:lessonId" element={<LessonPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="labs" element={<LabsPage />} />
          <Route path="exam" element={<ExamPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
