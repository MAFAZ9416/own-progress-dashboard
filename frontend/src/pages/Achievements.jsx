import React, { useState, useEffect, useCallback } from 'react'
import achievementsService from '../services/achievementsService'
import { Trophy, Lock, Star, Zap, Flame, Target, Crown, AlertCircle } from 'lucide-react'
import './Achievements.css'

/* ─── Helpers ──────────────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ─── Skeleton ─────────────────────────────────────────────────────── */
function AchievementSkeleton() {
  return (
    <div className="ach-card ach-card--skeleton">
      <div className="ach-card__icon-wrap skeleton-shimmer" style={{ width: 64, height: 64, borderRadius: '50%' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton-shimmer" style={{ height: 16, width: '60%', borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ height: 12, width: '80%', borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ height: 8, width: '100%', borderRadius: 4, marginTop: 4 }} />
      </div>
    </div>
  )
}

/* ─── Achievement Card ─────────────────────────────────────────────── */
function AchievementCard({ achievement }) {
  const { name, description, icon, unlocked, unlocked_at, progress_pct, progress_val, progress_max } = achievement

  const gradients = {
    '🥇': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    '🔥': 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    '⚡': 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    '👑': 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    '🏆': 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  }
  const gradient = gradients[icon] || 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'

  return (
    <div className={`ach-card ${unlocked ? 'ach-card--unlocked' : 'ach-card--locked'}`}>
      {/* Glow behind icon when unlocked */}
      {unlocked && (
        <div className="ach-card__glow" style={{ background: gradient.replace('linear-gradient(135deg,', 'radial-gradient(circle,') }} />
      )}

      {/* Icon wrapper */}
      <div
        className="ach-card__icon-wrap"
        style={unlocked
          ? { background: gradient, boxShadow: `0 8px 32px ${gradient.includes('#f59e0b') ? '#f59e0b44' : '#7c3aed44'}` }
          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
        }
      >
        {unlocked ? (
          <span className="ach-card__emoji">{icon}</span>
        ) : (
          <Lock size={28} className="ach-card__lock-icon" strokeWidth={1.5} />
        )}
      </div>

      {/* Content */}
      <div className="ach-card__content">
        <div className="ach-card__name-row">
          <h3 className={`ach-card__name ${unlocked ? '' : 'ach-card__name--locked'}`}>{name}</h3>
          {unlocked && <span className="ach-card__badge-unlocked">✓ Unlocked</span>}
        </div>
        <p className="ach-card__desc">{description}</p>

        {/* Progress bar */}
        {!unlocked && (
          <div className="ach-card__progress-wrap">
            <div className="ach-card__progress-row">
              <span className="ach-card__progress-label">Progress</span>
              <span className="ach-card__progress-val">{progress_val} / {progress_max}</span>
            </div>
            <div className="ach-card__bar-track">
              <div
                className="ach-card__bar-fill"
                style={{ width: `${progress_pct}%`, background: gradient }}
              />
            </div>
          </div>
        )}

        {unlocked && unlocked_at && (
          <p className="ach-card__unlock-date">🗓 Unlocked {formatDate(unlocked_at)}</p>
        )}
      </div>
    </div>
  )
}

/* ─── Stats Row ────────────────────────────────────────────────────── */
function AchievementStats({ achievements }) {
  const unlocked = achievements.filter(a => a.unlocked).length
  const total = achievements.length
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0

  return (
    <div className="ach-stats">
      <div className="ach-stat">
        <span className="ach-stat__value">{unlocked}</span>
        <span className="ach-stat__label">Unlocked</span>
      </div>
      <div className="ach-stat__divider" />
      <div className="ach-stat">
        <span className="ach-stat__value">{total - unlocked}</span>
        <span className="ach-stat__label">Remaining</span>
      </div>
      <div className="ach-stat__divider" />
      <div className="ach-stat">
        <span className="ach-stat__value">{pct}%</span>
        <span className="ach-stat__label">Complete</span>
      </div>
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function Achievements() {
  const [achievements, setAchievements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all | unlocked | locked

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await achievementsService.getAchievements()
      setAchievements(data)
    } catch (err) {
      setError(err?.response?.data?.detail ?? err?.message ?? 'Failed to load achievements.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked
    if (filter === 'locked') return !a.unlocked
    return true
  })

  const unlockedAchievements = achievements.filter(a => a.unlocked)

  return (
    <div id="page-achievements" className="ach-page">

      {/* ── Hero header ───────────────────────────────────────────── */}
      <div className="ach-hero">
        <div className="ach-hero__icon">🏆</div>
        <div>
          <h2 className="ach-hero__title">Achievements</h2>
          <p className="ach-hero__sub">Earn badges by hitting milestones in your learning journey.</p>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      {!isLoading && !error && <AchievementStats achievements={achievements} />}

      {/* ── Error banner ──────────────────────────────────────────── */}
      {error && (
        <div className="dash-error" role="alert">
          <div className="dash-error__inner">
            <AlertCircle size={20} className="dash-error__icon" />
            <div>
              <p className="dash-error__title">Failed to load achievements</p>
              <p className="dash-error__msg">{error}</p>
            </div>
          </div>
          <button className="dash-error__retry" onClick={load}>Retry</button>
        </div>
      )}

      {/* ── Filter tabs ───────────────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="ach-filters">
          {[
            { value: 'all', label: 'All Badges' },
            { value: 'unlocked', label: `Unlocked (${unlockedAchievements.length})` },
            { value: 'locked', label: `Locked (${achievements.length - unlockedAchievements.length})` },
          ].map(tab => (
            <button
              key={tab.value}
              id={`ach-filter-${tab.value}`}
              className={`tc-tab ${filter === tab.value ? 'tc-tab--active' : 'tc-tab--inactive'}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div className="ach-grid">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <AchievementSkeleton key={i} />)
        ) : !error && filtered.length === 0 ? (
          <div className="ach-empty">
            <div className="ach-empty__icon">🏅</div>
            <h3 className="ach-empty__title">
              {filter === 'unlocked'
                ? 'No badges unlocked yet'
                : filter === 'locked'
                ? 'All badges unlocked! 🎉'
                : 'No achievements found'}
            </h3>
            <p className="ach-empty__desc">
              {filter === 'unlocked'
                ? 'Complete tasks and build streaks to earn your first badge.'
                : 'Keep learning to unlock more achievements 🏆'}
            </p>
          </div>
        ) : (
          filtered.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))
        )}
      </div>
    </div>
  )
}
