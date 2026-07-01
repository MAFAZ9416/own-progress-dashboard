import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * AdminRoute
 *
 * Guards admin-only routes.
 * If the user is not authenticated or not staff/superuser,
 * they are redirected to /dashboard.
 */
export default function AdminRoute() {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#070B17]">
        <span className="text-slate-400 text-sm animate-pulse">Loading…</span>
      </div>
    )
  }

  const isAdmin = isAuthenticated && (user?.is_staff || user?.is_superuser)

  return isAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />
}
