import React from 'react'
import { MessageSquare } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Feedback() {
  return (
    <PagePlaceholder
      title="Feedback"
      icon={MessageSquare}
      phaseText="This module's dashboard sub-view will be introduced in subsequent phases."
    />
  )
}
