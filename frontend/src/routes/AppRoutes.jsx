import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'
import PageLoader from '../components/common/PageLoader'

const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/ResetPassword'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Skills = lazy(() => import('../pages/Skills'))
const Tasks = lazy(() => import('../pages/Tasks'))
const Profile = lazy(() => import('../pages/Profile'))
const Settings = lazy(() => import('../pages/Settings'))

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

/**
 * Central route configuration for the application.
 *
 * Public routes  → /login, /register
 * Protected routes (requires auth) → /dashboard, /skills, /tasks
 *
 * The root path redirects to /dashboard; if the user is unauthenticated,
 * ProtectedRoute will redirect them to /login.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
      <Route path="/register" element={<LazyPage><Register /></LazyPage>} />
      <Route path="/forgot-password" element={<LazyPage><ForgotPassword /></LazyPage>} />
      <Route path="/reset-password/:token" element={<LazyPage><ResetPassword /></LazyPage>} />

      {/* Protected routes — wrapped in the shared sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<LazyPage><Dashboard /></LazyPage>} />
          <Route path="/skills" element={<LazyPage><Skills /></LazyPage>} />
          <Route path="/tasks" element={<LazyPage><Tasks /></LazyPage>} />
          <Route path="/profile" element={<LazyPage><Profile /></LazyPage>} />
          <Route path="/settings" element={<LazyPage><Settings /></LazyPage>} />
        </Route>
      </Route>

      {/* Fallback: redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
