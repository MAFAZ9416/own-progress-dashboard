import React from 'react'
import { Users as UsersIcon } from 'lucide-react'
import PagePlaceholder from '../components/PagePlaceholder'

export default function Users() {
  return (
    <PagePlaceholder
      title="Users"
      icon={UsersIcon}
      phaseText="The user management database, search filters, and user profiles will be built in Phase 3."
    />
  )
}
