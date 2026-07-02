import React from 'react'
import { History } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function ActivityLogs() {
  return (
    <PagePlaceholder
      title="Activity Logs"
      icon={History}
      phaseText="This module's dashboard sub-view will be introduced in subsequent phases."
    />
  )
}
