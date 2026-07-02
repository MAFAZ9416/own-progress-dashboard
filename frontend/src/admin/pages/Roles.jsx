import React from 'react'
import { ShieldCheck } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Roles() {
  return (
    <PagePlaceholder
      title="Roles & Permissions"
      icon={ShieldCheck}
      phaseText="This module's dashboard sub-view will be introduced in subsequent phases."
    />
  )
}
