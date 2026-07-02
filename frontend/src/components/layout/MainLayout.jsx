import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

/**
 * MainLayout
 *
 * Shell for all protected pages.
 * Renders a fixed sidebar on the left and a topbar at the top.
 * Page content is rendered via <Outlet />.
 */
export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), [])

  // Close sidebar automatically when path changes (i.e. selecting a menu item)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a] relative">
      {/* Dark overlay behind sidebar on mobile */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Fixed sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar onToggleSidebar={toggleSidebar} />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-700"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
