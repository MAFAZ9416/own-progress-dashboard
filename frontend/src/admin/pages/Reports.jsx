import React from 'react'
import { FileText } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Reports() {
  return (
    <PagePlaceholder
      title="Reports"
      icon={FileText}
      phaseText="This module's dashboard sub-view will be introduced in subsequent phases."
    />
  )
}
