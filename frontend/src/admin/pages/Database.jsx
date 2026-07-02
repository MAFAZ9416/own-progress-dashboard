import React from 'react'
import { Database as DatabaseIcon } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Database() {
  return (
    <PagePlaceholder
      title="Database"
      icon={DatabaseIcon}
      phaseText="This module's dashboard sub-view will be introduced in subsequent phases."
    />
  )
}
