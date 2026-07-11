import { useState, useEffect, useCallback } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePWA() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)

  // Use Register Service Worker from vite-plugin-pwa
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.error('SW Registration error:', error)
    }
  })

  // Online / Offline handlers
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Catch the install prompt event
  useEffect(() => {
    const handleInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setCanInstall(false)
      console.log('Progressly App installed successfully!')
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User installation decision: ${outcome}`)
    setDeferredPrompt(null)
    setCanInstall(false)
  }, [deferredPrompt])

  const updateApp = useCallback(() => {
    updateServiceWorker(true)
  }, [updateServiceWorker])

  return {
    isOffline,
    canInstall,
    installApp,
    updateAvailable: needRefresh,
    updateApp,
    dismissUpdate: () => setNeedRefresh(false)
  }
}
