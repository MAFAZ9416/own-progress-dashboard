import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import './index.css'

/**
 * App
 *
 * Root component. Wraps the entire app in:
 *   1. BrowserRouter — provides routing context
 *   2. AuthProvider  — provides authentication state to all children
 *
 * All routes are delegated to <AppRoutes />.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
