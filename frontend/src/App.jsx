import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'
import { usePWA } from './hooks/usePWA'
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
  const { updateAvailable, updateApp, dismissUpdate } = usePWA()

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        
        {updateAvailable && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#1e1b4b',
            border: '1px solid #4f46e5',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxWidth: '320px'
          }}>
            <div>
              <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>New Version Available</h4>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.4' }}>
                A fresh release update is ready. Save any active changes and reload now to apply updates.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button"
                onClick={updateApp}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Update Now
              </button>
              <button 
                type="button"
                onClick={dismissUpdate}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Later
              </button>
            </div>
          </div>
        )}
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
