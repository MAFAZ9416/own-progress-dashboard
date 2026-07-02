import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNavigation from './BottomNavigation'
import './AdminLayout.css'

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="admin-layout">
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
