import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

/**
 * MainLayout
 *
 * Shell for all protected pages.
 * Renders a fixed sidebar on the left and a topbar at the top.
 * Page content is rendered via <Outlet />.
 *
 * Layout grid:
 *   ┌──────────┬──────────────────────────┐
 *   │          │  Topbar                  │
 *   │ Sidebar  ├──────────────────────────┤
 *   │          │  <Outlet /> (page)       │
 *   └──────────┴──────────────────────────┘
 */
export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a]">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
