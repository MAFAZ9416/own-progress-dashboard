import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, Clock, Database } from 'lucide-react'
import { getQueuedRequests } from '../../utils/offlineQueue'
import './OfflineScreen.css'

export default function OfflineScreen({ isOffline }) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [lastSyncText, setLastSyncText] = useState('Recently')
  const [queuedCount, setQueuedCount] = useState(0)

  // Load sync metrics and queued count
  useEffect(() => {
    const timestamp = localStorage.getItem('last_api_sync_time')
    if (timestamp) {
      try {
        const date = new Date(timestamp)
        setLastSyncText(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      } catch (e) {
        setLastSyncText('Recently')
      }
    }

    async function loadQueueCount() {
      const queue = await getQueuedRequests()
      setQueuedCount(queue.length)
    }

    if (isOffline) {
      loadQueueCount()
      window.addEventListener('progressly-pwa-sync-status', loadQueueCount)
    }

    return () => {
      window.removeEventListener('progressly-pwa-sync-status', loadQueueCount)
    }
  }, [isOffline])

  const handleRetry = () => {
    setIsRetrying(true)
    setTimeout(() => {
      setIsRetrying(false)
      // Check window connectivity
      if (navigator.onLine) {
        window.location.reload()
      }
    }, 1200)
  }

  if (!isOffline) return null

  return (
    <div className="pwa-offline-overlay">
      <div className="pwa-offline-card admin-glow-card">
        {/* Animated WifiOff icon */}
        <div className="pwa-offline-icon-wrapper">
          <WifiOff size={48} className="pwa-offline-icon" />
          <span className="pwa-offline-pulse" />
        </div>

        <h2 className="pwa-offline-title">Connection Lost</h2>
        <p className="pwa-offline-message">
          You are currently viewing Progressly in offline mode.
        </p>

        {/* Cached Data & Queued status alerts */}
        <div className="flex flex-col gap-2 w-full mb-6">
          <div className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-950/60 border border-slate-900 text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Database size={13} />
              <span>Cached Data</span>
            </span>
            <span className="font-bold text-emerald-400 text-[10px] uppercase bg-emerald-500/10 px-2 py-0.5 rounded">Available</span>
          </div>

          {queuedCount > 0 && (
            <div className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-950/60 border border-slate-900 text-slate-300">
              <span className="text-slate-400">Pending Sync Changes</span>
              <span className="font-bold text-violet-400 text-[11px] bg-violet-500/15 px-2.5 py-0.5 rounded-full">
                {queuedCount} queued
              </span>
            </div>
          )}
        </div>

        {/* Sync Info */}
        <div className="pwa-offline-sync-info">
          <Clock size={14} className="sync-icon" />
          <span>Last Synced: {lastSyncText}</span>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleRetry} 
          disabled={isRetrying} 
          className="pwa-offline-retry-btn"
          id="pwa-offline-retry-btn"
        >
          <RefreshCw size={14} className={`retry-icon ${isRetrying ? 'spin-anim' : ''}`} />
          <span>{isRetrying ? 'Verifying...' : 'Retry Connection'}</span>
        </button>
      </div>
    </div>
  )
}
