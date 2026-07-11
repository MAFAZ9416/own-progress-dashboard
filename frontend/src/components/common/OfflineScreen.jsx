import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, Clock } from 'lucide-react'
import './OfflineScreen.css'

export default function OfflineScreen({ isOffline }) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [lastSyncText, setLastSyncText] = useState('Recently')

  // Get last successful API sync time from localStorage
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
          You are currently viewing Progressly in offline mode. Don't worry, your cached pages are accessible.
        </p>

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
