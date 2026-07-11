import React, { useState } from 'react'
import { Calendar, Download, FileJson, FileSpreadsheet, X, HelpCircle } from 'lucide-react'
import './HeroBanner.css'

export default function HeroBanner({ adminName, onExportReport, isExporting }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [format, setFormat] = useState('csv')
  const [range, setRange] = useState('all')
  const [module, setModule] = useState('all')

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onExportReport) {
      onExportReport({ format, range, module })
    }
    setIsModalOpen(false)
  }

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
          onClick={() => setIsModalOpen(true)} 
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

      {/* Export Options Modal */}
      {isModalOpen && (
        <div className="hero-export-modal-backdrop">
          <div className="hero-export-modal admin-glow-card animate-scale-up">
            <div className="modal-header">
              <div className="modal-header-title">
                <Download className="title-icon" size={16} />
                <h3>Generate Analytical Export</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Select Target Dataset Module</label>
                <select value={module} onChange={(e) => setModule(e.target.value)}>
                  <option value="all">All Modules Combined</option>
                  <option value="users">Users Register Only</option>
                  <option value="skills">Learning Skills Directory</option>
                  <option value="tasks">Platform Tasks Hub</option>
                  <option value="feedback">Submissions Feedback Logs</option>
                </select>
              </div>

              <div className="form-group">
                <label>Select Timeframe Query Range</label>
                <select value={range} onChange={(e) => setRange(e.target.value)}>
                  <option value="all">All Lifetime Data Records</option>
                  <option value="7_days">Past 7 Calendar Days</option>
                  <option value="30_days">Past 30 Calendar Days</option>
                  <option value="1_year">Past 1 Calendar Year</option>
                </select>
              </div>

              <div className="form-group">
                <label>File Export Format</label>
                <div className="format-selection-row">
                  <label className={`format-option ${format === 'csv' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="export-format" 
                      value="csv" 
                      checked={format === 'csv'}
                      onChange={() => setFormat('csv')} 
                    />
                    <FileSpreadsheet size={16} className="format-icon text-emerald" />
                    <span>CSV Spreadsheet</span>
                  </label>
                  
                  <label className={`format-option ${format === 'json' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="export-format" 
                      value="json" 
                      checked={format === 'json'}
                      onChange={() => setFormat('json')} 
                    />
                    <FileJson size={16} className="format-icon text-blue" />
                    <span>JSON Format</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Generate &amp; Download
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
