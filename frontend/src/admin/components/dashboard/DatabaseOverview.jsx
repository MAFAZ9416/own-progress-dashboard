import React from 'react'
import { Database, HardDrive, Hash, Link2, Key } from 'lucide-react'
import './DatabaseOverview.css'

export default function DatabaseOverview({ databaseData = {}, isLoading }) {
  if (isLoading) {
    return (
      <div className="admin-list-card admin-glow-card">
        <div className="admin-list-card__header">
          <div className="admin-list-card__title-skeleton skeleton-shimmer" />
          <div className="admin-list-card__link-skeleton skeleton-shimmer" />
        </div>
        <div className="admin-list-card__body">
          <div className="admin-db-metrics-skeleton">
            <div className="admin-db-metric-box-skeleton skeleton-shimmer" />
            <div className="admin-db-metric-box-skeleton skeleton-shimmer" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="admin-db-table-row admin-db-table-row--skeleton">
              <div className="admin-db-table-info-skeleton">
                <div className="admin-db-table-name-skeleton skeleton-shimmer" />
                <div className="admin-db-table-meta-skeleton skeleton-shimmer" />
              </div>
              <div className="admin-db-table-size-skeleton skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const tables = databaseData?.tables || []
  const totalSize = databaseData?.total_size || '0 MB'
  const totalRows = databaseData?.total_rows || 0
  const activeConnections = databaseData?.connections || 1
  const indexCount = databaseData?.indexes || 0
  const dbName = databaseData?.database_name || 'PostgreSQL'

  const hasTables = tables.length > 0

  return (
    <div className="admin-list-card admin-glow-card">
      <div className="admin-list-card__header">
        <div className="admin-list-card__title-group">
          <h3 className="admin-list-card__title">Database Overview</h3>
          <span className="admin-list-card__subtitle">Engine status & relations</span>
        </div>
        <div className="admin-db-header__engine">
          <Database size={12} className="admin-db-engine-icon" />
          <span>{dbName}</span>
        </div>
      </div>

      <div className="admin-list-card__body">
        {/* Key Metrics grid */}
        <div className="admin-db-metrics-grid">
          <div className="admin-db-metric-box">
            <div className="admin-db-metric-box__icon-wrap">
              <HardDrive size={13} />
            </div>
            <div className="admin-db-metric-box__info">
              <span className="admin-db-metric-box__label">Size</span>
              <span className="admin-db-metric-box__value">{totalSize}</span>
            </div>
          </div>

          <div className="admin-db-metric-box">
            <div className="admin-db-metric-box__icon-wrap">
              <Hash size={13} />
            </div>
            <div className="admin-db-metric-box__info">
              <span className="admin-db-metric-box__label">Rows</span>
              <span className="admin-db-metric-box__value">{totalRows.toLocaleString()}</span>
            </div>
          </div>

          <div className="admin-db-metric-box">
            <div className="admin-db-metric-box__icon-wrap">
              <Link2 size={13} />
            </div>
            <div className="admin-db-metric-box__info">
              <span className="admin-db-metric-box__label">Conns</span>
              <span className="admin-db-metric-box__value">{activeConnections} Active</span>
            </div>
          </div>

          <div className="admin-db-metric-box">
            <div className="admin-db-metric-box__icon-wrap">
              <Key size={13} />
            </div>
            <div className="admin-db-metric-box__info">
              <span className="admin-db-metric-box__label">Indexes</span>
              <span className="admin-db-metric-box__value">{indexCount}</span>
            </div>
          </div>
        </div>

        {/* Relations sizes */}
        {hasTables ? (
          <div className="admin-db-tables-list">
            <span className="admin-db-section-title">Core Tables</span>
            <div className="admin-db-table-rows">
              {tables.map((table) => (
                <div key={table.name} className="admin-db-table-row">
                  <div className="admin-db-table-info">
                    <span className="admin-db-table-name">{table.name}</span>
                    <span className="admin-db-table-rows-count">{table.rows.toLocaleString()} rows</span>
                  </div>
                  <span className="admin-db-table-size">{table.size}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-list-card__empty">No relational metrics available.</div>
        )}
      </div>
    </div>
  )
}
