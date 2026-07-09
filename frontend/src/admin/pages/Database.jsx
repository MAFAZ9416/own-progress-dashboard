import React, { useState, useEffect, useCallback } from 'react'
import { Database as DatabaseIcon, RefreshCw, AlertCircle, Loader2, Table, HardDrive } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { adminDatabaseService } from '../services/databaseService'
import './Database.css'

const StatCard = ({ label, value, sub }) => (
  <div className="db-stat-card admin-glow-card">
    <span className="db-stat-card__label">{label}</span>
    <span className="db-stat-card__value">{value ?? '—'}</span>
    {sub && <span className="db-stat-card__sub">{sub}</span>}
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="db-tooltip">
      <div className="db-tooltip__label">{label}</div>
      <div className="db-tooltip__val">{payload[0].value} rows</div>
    </div>
  )
}

export default function Database() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminDatabaseService.getDatabaseOverview()
      setData(result)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load database overview.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const tables = data?.tables || []
  const chartData = tables.slice(0, 12).map(t => ({ name: t.name.replace(/^.*_/, ''), rows: t.rows }))

  return (
    <div className="db-page">
      {/* Header */}
      <div className="db-header">
        <div className="db-header__left">
          <div className="db-header__icon"><DatabaseIcon size={22} /></div>
          <div>
            <h1 className="db-header__title">Database Monitor</h1>
            <p className="db-header__sub">Read-only monitoring — no write operations</p>
          </div>
        </div>
        <button className="db-refresh-btn" onClick={fetchData} disabled={isLoading} id="db-refresh-btn">
          <RefreshCw size={14} className={isLoading ? 'db-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="db-error"><AlertCircle size={15} /><span>{error}</span></div>
      )}

      {isLoading ? (
        <div className="db-loading"><Loader2 size={32} className="db-spin" /></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="db-stats-grid">
            <StatCard label="Engine" value={data?.database_name} />
            <StatCard label="Total Size" value={data?.total_size} />
            <StatCard label="Tables" value={tables.length} />
            <StatCard label="Total Rows" value={data?.total_rows?.toLocaleString()} />
            <StatCard label="Connections" value={data?.connections} />
            <StatCard label="Indexes" value={data?.indexes} />
          </div>

          {/* Bar Chart */}
          <div className="db-chart-card admin-glow-card">
            <div className="db-chart-header">
              <HardDrive size={16} />
              <h3>Table Row Counts</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rows" name="Rows" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tables list */}
          <div className="db-tables-card admin-glow-card">
            <div className="db-tables-header">
              <Table size={16} />
              <h3>Table Details</h3>
              <span className="db-tables-badge">{tables.length} tables</span>
            </div>
            <div className="db-tables-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Table Name</th>
                    <th>Rows</th>
                    <th>Table Size</th>
                    <th>Index Size</th>
                    <th>Total Size</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((t, i) => (
                    <tr key={i}>
                      <td className="db-table__name">{t.name}</td>
                      <td className="db-table__rows">{t.rows?.toLocaleString()}</td>
                      <td>{t.table_size || '—'}</td>
                      <td>{t.index_size || '—'}</td>
                      <td>{t.total_size || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
