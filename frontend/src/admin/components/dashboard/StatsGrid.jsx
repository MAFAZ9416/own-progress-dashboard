import React from 'react'
import { Users, UserCheck, Award, ClipboardList, Target, Flame } from 'lucide-react'
import StatCard from './StatCard'

export default function StatsGrid({ stats, isLoading }) {
  // Stat items definitions
  const statItems = [
    {
      key: 'total_users',
      title: 'Total Users',
      color: 'purple',
      icon: Users
    },
    {
      key: 'active_users',
      title: 'Active Users',
      color: 'blue',
      icon: UserCheck
    },
    {
      key: 'total_skills',
      title: 'Total Skills',
      color: 'yellow',
      icon: Award
    },
    {
      key: 'total_tasks',
      title: 'Total Tasks',
      color: 'red',
      icon: ClipboardList
    },
    {
      key: 'completion_rate',
      title: 'Completion Rate',
      color: 'green',
      icon: Target
    },
    {
      key: 'active_streaks',
      title: 'Active Streaks',
      color: 'orange',
      icon: Flame
    }
  ]

  return (
    <div className="admin-stats-grid">
      {statItems.map((item) => {
        const data = stats?.[item.key] || {}
        return (
          <StatCard
            key={item.key}
            title={item.title}
            value={data.value}
            trend={data.trend}
            trendDirection={data.trend_direction}
            sparkline={data.sparkline}
            color={item.color}
            icon={item.icon}
            isLoading={isLoading}
          />
        )
      })}

      <style>{`
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 1200px) {
          .admin-stats-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}
