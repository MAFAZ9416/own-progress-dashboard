import React from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Settings() {
  return (
    <PagePlaceholder
      title="Settings"
      icon={SettingsIcon}
      phaseText="This module's dashboard sub-view will be introduced in subsequent phases."
    />
  )
}
