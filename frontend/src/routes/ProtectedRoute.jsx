import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * ProtectedRoute
 *
 * Guards all child routes behind authentication.
 * If the user is not logged in, they are redirected to /login.
 * If adminOnly is true, verifies that the user has admin status (is_staff or is_superuser).
 * Uses React Router's <Outlet /> so it can wrap nested route groups.
 */
export default function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  // Show nothing (or a spinner) while auth state is being resolved
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
        <span className="text-[var(--text-secondary)] text-sm animate-pulse">Loading…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If page requires admin rights, and the user is NOT staff or superuser,
  // redirect them back to standard user dashboard
  if (adminOnly && !user?.is_staff && !user?.is_superuser) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
