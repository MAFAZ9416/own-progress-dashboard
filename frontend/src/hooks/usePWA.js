import { useState, useEffect, useCallback } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { dbPromise, getCachedData, setCachedData, clearCacheCategory } from '../utils/offlineDatabase'
import { versionManager } from '../utils/versionManager'
import axios from 'axios'

// Helper to convert VAPID public key for push subscription request
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePWA() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [swRegistration, setSwRegistration] = useState(null)

  // Use Register Service Worker from vite-plugin-pwa
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
      setSwRegistration(r)
      checkPushSubscription(r)
    },
    onRegisterError(error) {
      console.error('SW Registration error:', error)
    }
  })

  // Check current Push status
  const checkPushSubscription = async (reg) => {
    if (!reg || !reg.pushManager) return
    try {
      const sub = await reg.pushManager.getSubscription()
      setPushEnabled(!!sub)
    } catch (e) {
      console.warn('Error checking push status:', e)
    }
  }

  // Session stats logger helper
  const logOfflineMetric = async (key, increment = 1) => {
    try {
      const val = parseInt(localStorage.getItem(`pwa_${key}`) || '0', 10) + increment
      localStorage.setItem(`pwa_${key}`, val.toString())
      
      const db = await dbPromise
      let analytics = await getCachedData('metadata', 'offline_analytics') || {
        offline_sessions: 0,
        queued_requests: 0,
        failed_requests: 0,
        successful_syncs: 0,
        total_sync_time_ms: 0
      }
      analytics[key] = (analytics[key] || 0) + increment
      await setCachedData('metadata', 'offline_analytics', analytics)
    } catch (err) {
      console.error('Failed to log offline analytics metric:', err)
    }
  }

  // Listen to network status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
    }

    const handleOffline = () => {
      setIsOffline(true)
      // Increment offline session count
      logOfflineMetric('offline_sessions', 1)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Listen to installation trigger prompts
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

  // Request push notifications permission and subscribe
  const enablePushNotifications = async () => {
    if (!swRegistration || !swRegistration.pushManager) {
      alert('Push notifications are not supported on this device/browser.')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Notifications permission denied.')
        return false
      }

      // Fetch public VAPID key from backend
      const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
      const cleanApiBase = apiBase.endsWith('/') ? apiBase : `${apiBase}/`
      const accessToken = localStorage.getItem('accessToken')

      const statusRes = await axios.get(`${cleanApiBase}push/status/`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const vapidPublicKey = statusRes.data.public_key

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })

      // Send subscription object to backend
      const userAgent = navigator.userAgent
      const platform = navigator.platform || 'Unknown'
      
      const payload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
        },
        browser_name: navigator.appName || 'Browser',
        browser_version: navigator.appVersion || 'Unknown',
        platform: platform,
        user_agent: userAgent
      }

      await axios.post(`${cleanApiBase}push/subscribe/`, payload, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      })

      setPushEnabled(true)
      console.log('Push notification subscription successful.')
      return true
    } catch (e) {
      console.error('Failed to subscribe to Push:', e)
      alert('Failed to subscribe to push notifications. Check connection.')
      return false
    }
  }

  // Unsubscribe from Push Notifications
  const disablePushNotifications = async () => {
    if (!swRegistration) return false
    try {
      const sub = await swRegistration.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        
        const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
        const cleanApiBase = apiBase.endsWith('/') ? apiBase : `${apiBase}/`
        const accessToken = localStorage.getItem('accessToken')

        // Notify backend of unsubscription
        await axios.delete(`${cleanApiBase}push/unsubscribe/`, {
          data: { endpoint: sub.endpoint },
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      }
      setPushEnabled(false)
      console.log('Push notification unsubscription successful.')
      return true
    } catch (e) {
      console.error('Failed to unsubscribe from Push:', e)
      return false
    }
  }

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

  // Clear obsolete caches
  const clearCaches = async (category) => {
    await clearCacheCategory(category)
  }

  return {
    isOffline,
    canInstall,
    installApp,
    pushEnabled,
    enablePush: enablePushNotifications,
    disablePush: disablePushNotifications,
    updateAvailable: needRefresh,
    updateApp,
    dismissUpdate: () => setNeedRefresh(false),
    clearCaches,
    versionInfo: versionManager,
    logOfflineMetric
  }
}
