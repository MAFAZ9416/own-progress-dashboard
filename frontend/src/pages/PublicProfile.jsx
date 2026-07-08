import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Brain, Trophy, ClipboardList, CheckCircle, Calendar, Share2, Check, ExternalLink, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

/**
 * PublicProfile
 *
 * A fully public page accessible at /p/:slug (no authentication required).
 * Displays a user's avatar, name, bio, skills progress, achievements, and stats.
 *
 * NEVER displays: email, tasks details, settings, login history, admin flags.
 */
export default function PublicProfile() {
  const { slug } = useParams()
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!slug) return
    setIsLoading(true)
    setError(null)

    axios.get(`${API_BASE}/users/public/${slug}/`)
      .then(res => {
        setProfile(res.data)
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setError('This profile does not exist or has been removed.')
        } else {
          setError('Could not load profile. Please try again.')
        }
      })
      .finally(() => setIsLoading(false))
  }, [slug])

  const handleShare = async () => {
    const url = window.location.href
    const text = `Check out ${profile?.name || 'this learner'}'s progress on Progressly 🚀\n${url}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile?.name}'s Progressly Profile`, text, url })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        // Fallback: nothing we can do
      }
    }
  }

  if (isLoading) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-container">
          <div className="public-profile-hero">
            <div className="skeleton-shimmer" style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 1rem' }} />
            <div className="skeleton-shimmer" style={{ height: 24, width: '60%', borderRadius: 8, margin: '0 auto 0.5rem' }} />
            <div className="skeleton-shimmer" style={{ height: 14, width: '80%', borderRadius: 6, margin: '0 auto' }} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2 style={{ color: '#f1f5f9', marginBottom: '0.5rem' }}>Profile Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>{error}</p>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: 'white',
              borderRadius: '0.75rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            Go to Progressly <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    )
  }

  const completionRate = profile.stats.total_tasks > 0
    ? Math.round((profile.stats.completed_tasks / profile.stats.total_tasks) * 100)
    : 0

  return (
    <div className="public-profile-page">
      <div className="public-profile-container">

        {/* ── Hero card ── */}
        <div className="public-profile-hero">
          {/* Avatar */}
          <div className="public-profile-avatar-wrap">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="public-profile-avatar"
              />
            ) : (
              <div className="public-profile-avatar-placeholder">
                {(profile.name || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="public-profile-name">{profile.name}</h1>

          {profile.bio && (
            <p className="public-profile-bio">{profile.bio}</p>
          )}

          <div className="public-profile-meta">
            {profile.country && (
              <span className="public-profile-tag">📍 {profile.country}</span>
            )}
            <span className="public-profile-tag">
              <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
              Member since {profile.member_since}
            </span>
          </div>

          {/* Share button */}
          <button
            id="btn-share-profile"
            className="public-profile-share-btn"
            onClick={handleShare}
          >
            {copied ? (
              <>
                <Check size={15} />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 size={15} />
                Share Profile
              </>
            )}
          </button>

          {/* Powered by Progressly */}
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#475569' }}>
            Tracked on{' '}
            <Link to="/login" style={{ color: '#7c3aed', fontWeight: 600 }}>
              Progressly
            </Link>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="public-profile-stats">
          <div className="public-profile-stat">
            <div className="public-profile-stat__value">{profile.stats.total_skills}</div>
            <div className="public-profile-stat__label">
              <Brain size={13} style={{ display: 'inline', marginRight: 4 }} />
              Skills
            </div>
          </div>
          <div className="public-profile-stat">
            <div className="public-profile-stat__value">{profile.stats.completed_tasks}</div>
            <div className="public-profile-stat__label">
              <ClipboardList size={13} style={{ display: 'inline', marginRight: 4 }} />
              Tasks Done
            </div>
          </div>
          <div className="public-profile-stat">
            <div className="public-profile-stat__value">{completionRate}%</div>
            <div className="public-profile-stat__label">
              <CheckCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
              Completion
            </div>
          </div>
          <div className="public-profile-stat">
            <div className="public-profile-stat__value">{profile.stats.achievements_unlocked}</div>
            <div className="public-profile-stat__label">
              <Trophy size={13} style={{ display: 'inline', marginRight: 4 }} />
              Achievements
            </div>
          </div>
        </div>

        {/* ── Skills progress ── */}
        {profile.skills.length > 0 && (
          <div className="public-profile-section">
            <h2 className="public-profile-section__title">
              <Brain size={18} /> Learning Skills
            </h2>
            <div className="public-profile-skills">
              {profile.skills.map((skill, i) => (
                <div key={i} className="public-profile-skill">
                  <div className="public-profile-skill__header">
                    <span className="public-profile-skill__name">{skill.name}</span>
                    <span
                      className="public-profile-skill__pct"
                      style={{ color: skill.color }}
                    >
                      {skill.progress}%
                    </span>
                  </div>
                  <div className="public-profile-skill__track">
                    <div
                      className="public-profile-skill__fill"
                      style={{
                        width: `${skill.progress}%`,
                        background: skill.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Achievements ── */}
        {profile.achievements.length > 0 && (
          <div className="public-profile-section">
            <h2 className="public-profile-section__title">
              <Trophy size={18} /> Achievements Unlocked
            </h2>
            <div className="public-profile-achievements">
              {profile.achievements.map((ach, i) => (
                <div key={i} className="public-profile-achievement">
                  <span className="public-profile-achievement__icon">{ach.icon}</span>
                  <div>
                    <p className="public-profile-achievement__name">{ach.name}</p>
                    <p className="public-profile-achievement__desc">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="public-profile-cta">
          <p>Track your own learning journey</p>
          <Link to="/register" className="public-profile-cta__btn">
            Start with Progressly — Free 🚀
          </Link>
        </div>

      </div>
    </div>
  )
}
