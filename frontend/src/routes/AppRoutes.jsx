import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'
import PageLoader from '../components/common/PageLoader'
import { useAuth } from '../contexts/AuthContext'

const AdminRedirect = () => {
  const { user } = useAuth()
  const landingPage = user?.preferences?.dashboard?.landing_page || '/admin/dashboard'
  return <Navigate to={landingPage} replace />
}

// User Protected Pages
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/ResetPassword'))
const AdminLogin = lazy(() => import('../pages/AdminLogin'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Skills = lazy(() => import('../pages/Skills'))
const Tasks = lazy(() => import('../pages/Tasks'))
const Profile = lazy(() => import('../pages/Profile'))
const Settings = lazy(() => import('../pages/Settings'))
const Notifications = lazy(() => import('../pages/Notifications'))
const Achievements = lazy(() => import('../pages/Achievements'))
const PublicProfile = lazy(() => import('../pages/PublicProfile'))

// Admin Protected Pages
const AdminDashboard = lazy(() => import('../admin/pages/AdminDashboard'))
const AdminDashboardView = lazy(() => import('../admin/pages/Dashboard'))
const AdminUsersView = lazy(() => import('../admin/pages/Users'))
const AdminSkillsView = lazy(() => import('../admin/pages/Skills'))
const AdminTasksView = lazy(() => import('../admin/pages/Tasks'))
const AdminAchievementsView = lazy(() => import('../admin/pages/Achievements'))
const AdminAnalyticsView = lazy(() => import('../admin/pages/Analytics'))
const AdminReportsView = lazy(() => import('../admin/pages/Reports'))
const AdminNotificationsView = lazy(() => import('../admin/pages/Notifications'))
const AdminFeedbackView = lazy(() => import('../admin/pages/Feedback'))
const AdminEmailLogsView = lazy(() => import('../admin/pages/EmailLogs'))
const AdminDatabaseView = lazy(() => import('../admin/pages/Database'))
const AdminSystemHealthView = lazy(() => import('../admin/pages/SystemHealth'))
const AdminBackupsView = lazy(() => import('../admin/pages/Backups'))
const AdminRolesView = lazy(() => import('../admin/pages/Roles'))
const AdminActivityLogsView = lazy(() => import('../admin/pages/ActivityLogs'))
const AdminSettingsView = lazy(() => import('../admin/pages/Settings'))
const AdminLoginHistoryView = lazy(() => import('../admin/pages/LoginHistory'))

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

/**
 * Central route configuration for the application.
 *
 * Public routes  → /login, /register, /forgot-password, /admin/login
 * User Protected routes (requires auth) → /dashboard, /skills, /tasks, /profile, /settings
 * Admin Protected routes (requires admin rights) → /admin/*
 *
 * Redirects:
 *   Root path redirects to /dashboard (which then checks auth).
 *   Admin route root /admin redirects to /admin/dashboard.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
      <Route path="/register" element={<LazyPage><Register /></LazyPage>} />
      <Route path="/forgot-password" element={<LazyPage><ForgotPassword /></LazyPage>} />
      <Route path="/reset-password/:token" element={<LazyPage><ResetPassword /></LazyPage>} />
      <Route path="/admin/login" element={<LazyPage><AdminLogin /></LazyPage>} />

      {/* Public profile — no auth required */}
      <Route path="/p/:slug" element={<LazyPage><PublicProfile /></LazyPage>} />


      {/* Standard Protected routes — wrapped in the standard user sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<LazyPage><Dashboard /></LazyPage>} />
          <Route path="/skills" element={<LazyPage><Skills /></LazyPage>} />
          <Route path="/tasks" element={<LazyPage><Tasks /></LazyPage>} />
          <Route path="/achievements" element={<LazyPage><Achievements /></LazyPage>} />
          <Route path="/profile" element={<LazyPage><Profile /></LazyPage>} />
          <Route path="/settings" element={<LazyPage><Settings /></LazyPage>} />
          <Route path="/notifications" element={<LazyPage><Notifications /></LazyPage>} />
        </Route>
      </Route>

      {/* Admin Protected routes — wrapped in the admin layout */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<AdminDashboard />}>
          <Route path="/admin/dashboard" element={<LazyPage><AdminDashboardView /></LazyPage>} />
          <Route path="/admin/users" element={<LazyPage><AdminUsersView /></LazyPage>} />
          <Route path="/admin/skills" element={<LazyPage><AdminSkillsView /></LazyPage>} />
          <Route path="/admin/tasks" element={<LazyPage><AdminTasksView /></LazyPage>} />
          <Route path="/admin/achievements" element={<LazyPage><AdminAchievementsView /></LazyPage>} />
          <Route path="/admin/analytics" element={<LazyPage><AdminAnalyticsView /></LazyPage>} />
          <Route path="/admin/reports" element={<LazyPage><AdminReportsView /></LazyPage>} />
          <Route path="/admin/notifications" element={<LazyPage><AdminNotificationsView /></LazyPage>} />
          <Route path="/admin/feedback" element={<LazyPage><AdminFeedbackView /></LazyPage>} />
          <Route path="/admin/email-logs" element={<LazyPage><AdminEmailLogsView /></LazyPage>} />
          <Route path="/admin/database" element={<LazyPage><AdminDatabaseView /></LazyPage>} />
          <Route path="/admin/system-health" element={<LazyPage><AdminSystemHealthView /></LazyPage>} />
          <Route path="/admin/backups" element={<LazyPage><AdminBackupsView /></LazyPage>} />
          <Route path="/admin/roles" element={<LazyPage><AdminRolesView /></LazyPage>} />
          <Route path="/admin/activity-logs" element={<LazyPage><AdminActivityLogsView /></LazyPage>} />
          <Route path="/admin/settings" element={<LazyPage><AdminSettingsView /></LazyPage>} />
          <Route path="/admin/login-history" element={<LazyPage><AdminLoginHistoryView /></LazyPage>} />

          
          {/* Admin home path fallback */}
          <Route path="/admin" element={<AdminRedirect />} />
        </Route>
      </Route>

      {/* Fallback: redirect root to user dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
