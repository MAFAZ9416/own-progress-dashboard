import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNavigation from './BottomNavigation'
import { usePWA } from '../../hooks/usePWA'
import OfflineScreen from '../../components/common/OfflineScreen'
import './AdminLayout.css'

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // PWA integration
  const { 
    isOffline, 
    canInstall, 
    installApp, 
    updateAvailable, 
    updateApp, 
    dismissUpdate 
  } = usePWA()

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="admin-layout">
      {/* Offline Page overlay blocker */}
      <OfflineScreen isOffline={isOffline} />

      {/* PWA Update Toast banner */}
      {updateAvailable && (
        <div className="pwa-update-toast">
          <p>A new version of Progressly Admin is available!</p>
          <div className="pwa-update-actions">
            <button className="pwa-update-btn-primary" onClick={updateApp}>Update Now</button>
            <button className="pwa-update-btn-secondary" onClick={dismissUpdate}>Later</button>
          </div>
        </div>
      )}

      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="admin-layout__overlay" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        canInstall={canInstall}
        installApp={installApp}
      />

      {/* Main Content Area Wrapper */}
      <div className="admin-layout__main-wrapper">
        <Topbar onToggleSidebar={toggleSidebar} />
        
        <main className="admin-layout__content">
          <div className="admin-layout__content-inner">
            {children}
          </div>
        </main>
        
        {/* Bottom Tab Bar for Mobile Navigation */}
        <BottomNavigation
          onToggleMore={toggleSidebar}
        />
      </div>
    </div>
  )
}
