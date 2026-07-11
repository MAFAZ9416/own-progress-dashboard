import { dbPromise, setCachedData } from './offlineDatabase'
import axios from 'axios'

// Delay utility for retry strategies
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Delay intervals based on retry count
const RETRY_DELAYS = [0, 2000, 5000, 15000, 30000]

export let isSyncing = false
export let lastSyncTime = localStorage.getItem('pwa_last_sync_time') || null

// Unique tab ID to identify the current tab context for multi-tab synchronization lock
const tabId = Math.random().toString(36).substring(2)

// Custom event to trigger immediate UI reactivity across layout components
export function notifySyncStatusChange() {
  window.dispatchEvent(new CustomEvent('progressly-pwa-sync-status'))
}

// Generate random UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Check if request is authenticated/sensitive
function isSensitiveRequest(url) {
  const lowercaseUrl = url.toLowerCase()
  return (
    lowercaseUrl.includes('/token') ||
    lowercaseUrl.includes('/users/login') ||
    lowercaseUrl.includes('/users/register') ||
    lowercaseUrl.includes('/users/logout') ||
    lowercaseUrl.includes('/users/change-password') ||
    lowercaseUrl.includes('/users/forgot-password') ||
    lowercaseUrl.includes('/users/reset-password') ||
    lowercaseUrl.includes('/admin/backups') ||
    lowercaseUrl.includes('/reports/export')
  )
}

// Enqueue a mutation while offline
export async function enqueueMutation(url, method, payload) {
  if (isSensitiveRequest(url)) {
    console.warn('Skipping sensitive request from offline queue:', url)
    return null
  }

  const db = await dbPromise
  const uuid = generateUUID()
  const queuedRequest = {
    uuid,
    url,
    method,
    payload,
    created_at: new Date().toISOString(),
    retry_count: 0,
    status: 'PENDING'
  }

  await db.put('mutations', queuedRequest)
  
  // Track offline queued analytics
  const qVal = parseInt(localStorage.getItem('pwa_queued_requests') || '0', 10) + 1
  localStorage.setItem('pwa_queued_requests', qVal.toString())

  notifySyncStatusChange()
  return uuid
}

// Read mutations from IndexedDB
export async function getQueuedRequests() {
  try {
    const db = await dbPromise
    return await db.getAll('mutations')
  } catch (error) {
    console.error('Error fetching queued requests:', error)
    return []
  }
}

// Clear mutations queue completely
export async function clearQueuedRequests() {
  const db = await dbPromise
  await db.clear('mutations')
  notifySyncStatusChange()
}

// Remove single request from queue
export async function deleteQueuedRequest(uuid) {
  const db = await dbPromise
  await db.delete('mutations', uuid)
  notifySyncStatusChange()
}

export async function uploadOfflineAnalytics() {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    const sessions = parseInt(localStorage.getItem('pwa_offline_sessions') || '0', 10)
    const queued = parseInt(localStorage.getItem('pwa_queued_requests') || '0', 10)
    const failed = parseInt(localStorage.getItem('pwa_failed_requests') || '0', 10)
    const syncs = parseInt(localStorage.getItem('pwa_successful_syncs') || '0', 10)
    const syncTime = parseInt(localStorage.getItem('pwa_total_sync_time_ms') || '0', 10)

    const payload = {
      offline_sessions: sessions,
      queued_requests: queued,
      failed_requests: failed,
      successful_syncs: syncs,
      total_sync_time_ms: syncTime
    }

    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      if (userData) {
        userData.preferences = userData.preferences || {}
        userData.preferences.offline_analytics = payload

        const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
        const cleanApiBase = apiBase.endsWith('/') ? apiBase : `${apiBase}/`
        
        await axios.put(`${cleanApiBase}users/profile/`, {
          preferences: userData.preferences
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        localStorage.setItem('user', JSON.stringify(userData))
        console.log('PWA: Uploaded offline usage statistics successfully.')
      }
    }
  } catch (e) {
    console.error('PWA: Failed to upload offline analytics:', e)
  }
}

// Process the offline queue (FIFO)
export async function processOfflineQueue() {
  if (isSyncing) return
  if (!navigator.onLine) return

  const db = await dbPromise
  const syncStart = Date.now()
  
  // Acquire multi-tab sync lock
  try {
    const tx = db.transaction('metadata', 'readwrite')
    const existingLock = await tx.store.get('sync_lock')
    const nowMs = Date.now()
    if (existingLock) {
      const acquiredTime = new Date(existingLock.acquired_at).getTime()
      if (existingLock.tab_id !== tabId && (nowMs - acquiredTime) < 30000) {
        console.log('PWA: Sync lock held by another tab, skipping sync in this tab.')
        return
      }
    }
    await tx.store.put({
      id: 'sync_lock',
      acquired_at: new Date().toISOString(),
      tab_id: tabId
    })
    await tx.done
  } catch (e) {
    console.error('PWA: Failed to acquire sync lock:', e)
  }

  const mutations = await db.getAll('mutations')
  
  // Filter pending or previously failed attempts
  const activeQueue = mutations
    .filter((m) => m.status === 'PENDING' || m.status === 'RETRYING')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  if (activeQueue.length === 0) {
    // Release lock since nothing to process
    try {
      const tx = db.transaction('metadata', 'readwrite')
      await tx.store.delete('sync_lock')
      await tx.done
    } catch (e) {}
    return
  }

  isSyncing = true
  notifySyncStatusChange()

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
  const cleanApiBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase

  let queueSuccessCount = 0
  let queueFailCount = 0

  try {
    for (const request of activeQueue) {
      if (!navigator.onLine) {
        break
      }

      let success = false
      let currentRetries = request.retry_count

      while (currentRetries < 5 && !success) {
        if (!navigator.onLine) break

        const waitMs = RETRY_DELAYS[currentRetries] || 0
        if (waitMs > 0) {
          await delay(waitMs)
        }

        try {
          const fullUrl = request.url.startsWith('http') 
            ? request.url 
            : `${cleanApiBase}${request.url.startsWith('/') ? '' : '/'}${request.url}`

          const accessToken = localStorage.getItem('accessToken')
          const headers = { 'Content-Type': 'application/json' }
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`
          }

          headers['X-Request-UUID'] = request.uuid

          const response = await axios({
            url: fullUrl,
            method: request.method,
            data: request.payload,
            headers
          })

          if (response.status >= 200 && response.status < 300) {
            success = true
            await db.delete('mutations', request.uuid)
            queueSuccessCount++
            console.log(`Replayed offline request successfully: ${request.uuid} (${request.url})`)
          }
        } catch (error) {
          console.error(`Offline request replay failed (Attempt ${currentRetries + 1}):`, error)
          if (error.response?.status >= 400 && error.response?.status < 500) {
            currentRetries = 5
            break
          }
          currentRetries++
        }
      }

      if (!success) {
        queueFailCount++
        const updatedRequest = {
          ...request,
          retry_count: currentRetries,
          status: 'FAILED'
        }
        await db.put('mutations', updatedRequest)
        console.warn(`Request failed permanently after maximum retries: ${request.uuid}`)
      }
    }
  } finally {
    // Release multi-tab sync lock and update states
    isSyncing = false
    lastSyncTime = new Date().toISOString()
    localStorage.setItem('pwa_last_sync_time', lastSyncTime)
    localStorage.setItem('last_api_sync_time', lastSyncTime)
    
    // Save success syncs and durations in localStorage
    if (queueSuccessCount > 0) {
      const sVal = parseInt(localStorage.getItem('pwa_successful_syncs') || '0', 10) + queueSuccessCount
      localStorage.setItem('pwa_successful_syncs', sVal.toString())
      
      const duration = Date.now() - syncStart
      const tVal = parseInt(localStorage.getItem('pwa_total_sync_time_ms') || '0', 10) + duration
      localStorage.setItem('pwa_total_sync_time_ms', tVal.toString())
    }

    if (queueFailCount > 0) {
      const fVal = parseInt(localStorage.getItem('pwa_failed_requests') || '0', 10) + queueFailCount
      localStorage.setItem('pwa_failed_requests', fVal.toString())
    }

    // Save logs to IndexedDB metadata for persistence
    try {
      const analyticsPayload = {
        offline_sessions: parseInt(localStorage.getItem('pwa_offline_sessions') || '0', 10),
        queued_requests: parseInt(localStorage.getItem('pwa_queued_requests') || '0', 10),
        failed_requests: parseInt(localStorage.getItem('pwa_failed_requests') || '0', 10),
        successful_syncs: parseInt(localStorage.getItem('pwa_successful_syncs') || '0', 10),
        total_sync_time_ms: parseInt(localStorage.getItem('pwa_total_sync_time_ms') || '0', 10)
      }
      await db.put('metadata', {
        id: 'offline_analytics',
        cached_at: new Date().toISOString(),
        data: analyticsPayload
      })
    } catch (e) {}

    // Upload analytics to server
    if (queueSuccessCount > 0 || queueFailCount > 0) {
      await uploadOfflineAnalytics()
    }
    
    try {
      const txRelease = db.transaction('metadata', 'readwrite')
      const currentLock = await txRelease.store.get('sync_lock')
      if (currentLock && currentLock.tab_id === tabId) {
        await txRelease.store.delete('sync_lock')
      }
      await txRelease.done
    } catch (e) {
      console.error('PWA: Failed to release sync lock:', e)
    }

    notifySyncStatusChange()
  }
}

// Retry all failed requests manually
export async function retryFailedRequests() {
  const db = await dbPromise
  const mutations = await db.getAll('mutations')
  const failed = mutations.filter((m) => m.status === 'FAILED')

  for (const request of failed) {
    const resetRequest = {
      ...request,
      retry_count: 0,
      status: 'PENDING'
    }
    await db.put('mutations', resetRequest)
  }
  notifySyncStatusChange()
  
  // Trigger sync process async
  setTimeout(() => {
    processOfflineQueue()
  }, 100)
}

// Connection event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Browser is back online. Syncing PWA queue...')
    processOfflineQueue()
  })

  // Startup sync trigger
  window.addEventListener('load', () => {
    if (navigator.onLine) {
      processOfflineQueue()
    }
  })
}
