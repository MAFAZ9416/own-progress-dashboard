import React from 'react'
import { Calendar, Download } from 'lucide-react'
import './HeroBanner.css'

export default function HeroBanner({ adminName, onExportReport, isExporting }) {
  // Format current date dynamically
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="admin-hero">
      <div className="admin-hero__left">
        <h1 className="admin-hero__welcome">
          Welcome back, {adminName || "MOHAMMED MAFAZ"}! 👋
        </h1>
        <p className="admin-hero__sub">
          Here's what's happening with your Progressly platform today.
        </p>
        <div className="admin-hero__date">
          <Calendar size={14} className="admin-hero__date-icon" />
          <span>{formattedDate}</span>
        </div>
      </div>
      
      <div className="admin-hero__right">
        {/* Abstract Glowing Graphic */}
        <div className="admin-hero__graphic">
          <svg viewBox="0 0 200 100" fill="none" className="admin-hero__svg">
            <path 
              d="M10,80 Q45,20 75,50 T145,20 T190,40" 
              stroke="rgba(167, 139, 250, 0.45)" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
            <path 
              d="M10,80 Q45,20 75,50 T145,20 T190,40 L190,100 L10,100 Z" 
              fill="url(#hero-svg-grad)" 
              opacity="0.15"
            />
            <defs>
              <linearGradient id="hero-svg-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <button 
          onClick={onExportReport} 
          disabled={isExporting}
          className="admin-hero__export-btn"
          id="admin-hero-export-btn"
        >
          {isExporting ? (
            <>
              <div className="admin-hero__spinner" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download size={15} />
              <span>Export Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
