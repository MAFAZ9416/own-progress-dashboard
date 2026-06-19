import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * ProtectedRoute
 *
 * Guards all child routes behind authentication.
 * If the user is not logged in, they are redirected to /login.
 * Uses React Router's <Outlet /> so it can wrap nested route groups.
 *
 * Usage (in AppRoutes):
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  // Show nothing (or a spinner) while auth state is being resolved
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <span className="text-slate-400 text-sm animate-pulse">Loading…</span>
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
