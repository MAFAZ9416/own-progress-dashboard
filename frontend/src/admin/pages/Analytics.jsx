import React from 'react'
import { LineChart } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Analytics() {
  return (
    <PagePlaceholder
      title="Analytics"
      icon={LineChart}
      phaseText="This module's dashboard sub-view will be introduced in subsequent phases."
    />
  )
}
