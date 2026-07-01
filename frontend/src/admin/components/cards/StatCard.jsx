import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function StatCard({
  title,
  value,
  icon,
  pct = '0%',
  isPositive = true,
  subtext = 'vs last month',
  iconColor = 'purple' // purple, emerald, blue, amber, rose
}) {
  // Map color schemes to Tailwind classes
  const colorMap = {
    purple: {
      bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    },
    blue: {
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    },
    rose: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    }
  }

  const activeColors = colorMap[iconColor] || colorMap.purple

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-[#111827]/60 border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:shadow-[0_8px_32px_rgba(139,92,246,0.08)] hover:border-purple-500/15 transition-all duration-300 relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{title}</p>
          <h3 className="text-xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${activeColors.bg}`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5">
        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
          isPositive ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {pct}
        </span>
        <span className="text-slate-500 text-[9px] font-medium">{subtext}</span>
      </div>
    </motion.div>
  )
}
