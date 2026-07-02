import React from 'react'
import { Bell } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Notifications() {
  return (
    <PagePlaceholder
      title="Notifications"
      icon={Bell}
      phaseText="This module's dashboard sub-view will be introduced in subsequent phases."
    />
  )
}
