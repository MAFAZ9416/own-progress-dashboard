import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)

// Smoothly remove PWA splash screen after React mounts
const splash = document.getElementById('pwa-splash')
if (splash) {
  splash.style.opacity = '0'
  splash.style.visibility = 'hidden'
  setTimeout(() => {
    splash.remove()
  }, 500)
}
