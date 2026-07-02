import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminLayout from '../layout/AdminLayout'
import './AdminDashboard.css' // Import CSS if needed for dashboard-wide layouts

export default function AdminDashboard() {
  // Serves as the central orchestrator for the admin section, wrapping the layout.
  // Can be expanded to manage global admin context, permissions, or system triggers.
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}
