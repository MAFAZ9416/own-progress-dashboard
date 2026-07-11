import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const RefreshContext = createContext(null)

export function AdminRefreshProvider({ children }) {
  const { user } = useAuth()
  const [ticks, setTicks] = useState({
    dashboard: 0,
    notifications: 0,
    health: 0,
  })

  const timers = useRef({
    dashboard: null,
    notifications: null,
    health: null,
  })

  const getIntervalMs = () => {
    const autoRefreshPref = user?.preferences?.dashboard?.auto_refresh || user?.preferences?.application?.auto_refresh || 'off'
    if (autoRefreshPref === 'off') return null
    if (autoRefreshPref === '30s') return 30000
    if (autoRefreshPref === '1m') return 60000
    if (autoRefreshPref === '5m') return 300000
    return null
  }

  const triggerManualRefresh = (group) => {
    setTicks((prev) => ({
      ...prev,
      [group]: prev[group] + 1,
    }))
  }

  useEffect(() => {
    const startTimer = (group) => {
      if (timers.current[group]) {
        clearInterval(timers.current[group])
        timers.current[group] = null
      }

      const ms = getIntervalMs()
      if (ms) {
        timers.current[group] = setInterval(() => {
          triggerManualRefresh(group)
        }, ms)
      }
    }

    startTimer('dashboard')
    startTimer('notifications')
    startTimer('health')

    return () => {
      if (timers.current.dashboard) clearInterval(timers.current.dashboard)
      if (timers.current.notifications) clearInterval(timers.current.notifications)
      if (timers.current.health) clearInterval(timers.current.health)
    }
  }, [user?.preferences?.dashboard?.auto_refresh, user?.preferences?.application?.auto_refresh])

  return (
    <RefreshContext.Provider value={{ ticks, triggerManualRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export function useAdminRefresh(group, callback) {
  const context = useContext(RefreshContext)
  if (!context) {
    throw new Error('useAdminRefresh must be used within an AdminRefreshProvider')
  }

  const { ticks, triggerManualRefresh } = context
  const tickVal = ticks[group] || 0

  useEffect(() => {
    if (tickVal > 0 && callback) {
      callback()
    }
  }, [tickVal])

  return { triggerManualRefresh: () => triggerManualRefresh(group) }
}
