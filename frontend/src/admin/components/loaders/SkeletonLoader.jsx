import React from 'react'

export default function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-white/5 rounded-lg w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-white/5 rounded-2xl"></div>
        <div className="h-32 bg-white/5 rounded-2xl"></div>
        <div className="h-32 bg-white/5 rounded-2xl"></div>
      </div>
      <div className="h-64 bg-white/5 rounded-2xl"></div>
    </div>
  )
}
