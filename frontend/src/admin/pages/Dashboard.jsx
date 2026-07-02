import React from 'react'
import { LayoutDashboard } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Dashboard() {
  return (
    <PagePlaceholder
      title="Dashboard"
      icon={LayoutDashboard}
      phaseText="The core dashboard statistics, charts, tables, and actions will be built in Phase 2."
    />
  )
}
