import React from 'react'
import { motion } from 'framer-motion'

export const COLORS = {
  bg: '#070B14',
  card: '#111827',
  primary: '#8B5CF6',
  accent: '#A855F7',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  blue: '#3B82F6'
}

export function TabTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  )
}
