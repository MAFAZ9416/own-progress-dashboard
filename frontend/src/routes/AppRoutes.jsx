import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'

// Pages
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import Skills from '../pages/Skills'
import Tasks from '../pages/Tasks'

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
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes — wrapped in the shared sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/skills"    element={<Skills />} />
          <Route path="/tasks"     element={<Tasks />} />
        </Route>
      </Route>

      {/* Fallback: redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
