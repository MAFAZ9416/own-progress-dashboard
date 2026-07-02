import React from 'react'
import { ClipboardList } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Tasks() {
  return (
    <PagePlaceholder
      title="Tasks"
      icon={ClipboardList}
      phaseText="The tasks queue, assignment matrix, and task filters will be built in Phase 5."
    />
  )
}
