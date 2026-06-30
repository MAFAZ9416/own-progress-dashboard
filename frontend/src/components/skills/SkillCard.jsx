import React, { memo } from 'react'
import { Pencil, Trash2, Code2 } from 'lucide-react'

/* ─── Technology Icon Map ─────────────────────────────────────────────
   SVG icon components keyed by lowercase skill name fragments.
   Falls back to a generic <Code2 /> icon if no match is found.
─────────────────────────────────────────────────────────────────────── */

function PythonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <path d="M12 2C9.27 2 7.25 2.64 7.25 4.5V6.75H12v.75H4.75C2.9 7.5 2 9.23 2 12s.9 4.5 2.75 4.5H6v-2.25C6 12.1 7.1 11 9.25 11H15c1.93 0 3-1.07 3-2.75V4.5C18 2.64 15.73 2 12 2zm-1.5 2.25a.75.75 0 110 1.5.75.75 0 010-1.5z" fill="#3776ab"/>
      <path d="M12 22c2.73 0 4.75-.64 4.75-2.5V17.25H12v-.75h7.25C21.1 16.5 22 14.77 22 12s-.9-4.5-2.75-4.5H18v2.25C18 11.9 16.9 13 14.75 13H9c-1.93 0-3 1.07-3 2.75v3.75C6 21.36 8.27 22 12 22zm1.5-2.25a.75.75 0 110-1.5.75.75 0 010 1.5z" fill="#ffd43b"/>
    </svg>
  )
}

function ReactIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <circle cx="12" cy="12" r="2.05" fill="#61dafb"/>
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="10" ry="3.8" cx="12" cy="12"/>
        <ellipse rx="10" ry="3.8" cx="12" cy="12" transform="rotate(60 12 12)"/>
        <ellipse rx="10" ry="3.8" cx="12" cy="12" transform="rotate(120 12 12)"/>
      </g>
    </svg>
  )
}

function DjangoIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <path d="M11.5 2h2.8v12.6c-1.4.27-2.45.37-3.57.37-3.36 0-5.11-1.52-5.11-4.43 0-2.8 1.85-4.62 4.73-4.62.45 0 .79.04 1.15.12V2zm0 10.77V7.98c-.32-.09-.58-.13-.92-.13-1.73 0-2.73 1.07-2.73 2.94 0 1.83.96 2.84 2.73 2.84.3 0 .57-.02.92-.09v.23zM15.8 8.57h2.8V19c0 3.49-1.76 4.79-5.4 4.79-.79 0-1.49-.07-2.36-.25l.37-2.18c.73.17 1.28.24 1.87.24 1.7 0 2.72-.77 2.72-2.7V8.57z" fill="#092e20"/>
    </svg>
  )
}

function DockerIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <path d="M13.5 9h2.25v2.25H13.5V9zm-2.75 0h2.25v2.25H10.75V9zm-2.75 0H10.25v2.25H8V9zm-2.75 2.25H7.5V9H5.25v2.25zM10.75 6.25H13v2.25h-2.25V6.25zm-2.75 0h2.25v2.25H8V6.25zM5.25 9H7.5V6.75H5.25V9zM22 11.37a3.88 3.88 0 00-2.13-.58h-.13c-.16-1.09-.85-2.04-1.95-2.67l-.38-.23-.25.37a4.7 4.7 0 00-.62 2.12c0 .54.1 1.07.3 1.54a5.6 5.6 0 01-2.6.7H2.26A2.25 2.25 0 002 13.9c-.07 1.45.27 2.9 1 4.16.8 1.35 2 2.35 3.44 2.78 1.6.47 3.28.5 4.89.05a8.4 8.4 0 003.1-1.4 9.17 9.17 0 002.37-3.2 11.8 11.8 0 001.65-4.02h.04a2.61 2.61 0 001.96-.92A3.1 3.1 0 0022 11.37z" fill="#2396ed"/>
    </svg>
  )
}

function JavaScriptIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <rect width="24" height="24" rx="3" fill="#f7df1e"/>
      <path d="M7.3 18.5l1.6-1c.3.55.58.98 1.2.98.6 0 .98-.24.98-1.17V12h2v5.36c0 1.92-1.13 2.8-2.77 2.8-1.48 0-2.35-.77-2.79-1.7l1.78-.06zm5.8-.22l1.6-.98c.42.68.96 1.18 1.93 1.18.81 0 1.33-.4 1.33-.96 0-.67-.53-.9-1.43-1.29l-.49-.21c-1.42-.6-2.36-1.37-2.36-2.97 0-1.48 1.13-2.6 2.9-2.6 1.26 0 2.17.44 2.82 1.6l-1.55 1a1.3 1.3 0 00-1.27-.84c-.58 0-.94.36-.94.84 0 .59.37.83 1.22 1.2l.49.2c1.67.72 2.61 1.46 2.61 3.11 0 1.78-1.4 2.74-3.28 2.74-1.83 0-3.02-.87-3.6-2.02z" fill="#000"/>
    </svg>
  )
}

function SQLIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <path d="M12 2C7.58 2 4 3.34 4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5c0-1.66-3.58-3-8-3zm0 2c3.87 0 6 1.06 6 1s-2.13 1-6 1-6-1.06-6-1 2.13-1 6-1zm0 16c-3.87 0-6-1.12-6-2V7.24C7.58 8.01 9.7 8.5 12 8.5s4.42-.49 6-1.26V18c0 .88-2.13 2-6 2z" fill="#336791"/>
    </svg>
  )
}

function NodeIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <path d="M12 1.85L2.5 7.4v9.2l9.5 5.55 9.5-5.55V7.4L12 1.85zm0 2.3L19.5 8.5l-7.5 4.35L4.5 8.5 12 4.15zm-8.5 5.1l7.75 4.5v8.5L3.5 17.7V9.25zm17 0V17.7l-7.75 4.5v-8.5l7.75-4.5z" fill="#8cc84b"/>
    </svg>
  )
}

function TailwindIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" fill="#38bdf8"/>
    </svg>
  )
}

function TypeScriptIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <rect width="24" height="24" rx="3" fill="#3178c6"/>
      <path d="M5 13.5h3.5V20h2v-6.5H14V12H5v1.5zM15 15.5c0-1.7 1.3-3 3.5-3 .9 0 1.7.2 2.5.6v1.8c-.7-.4-1.5-.6-2.4-.6-.8 0-1.4.3-1.4.9 0 .6.4.9 1.7 1.3 1.7.5 2.7 1.3 2.7 2.7 0 1.8-1.4 3-3.7 3a6.5 6.5 0 01-2.8-.6V19.9c.8.4 1.8.7 2.7.7.9 0 1.5-.4 1.5-1 0-.6-.5-.9-1.7-1.4C16 17.7 15 16.9 15 15.5z" fill="#fff"/>
    </svg>
  )
}

function GitIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
      <path d="M23.15 10.587L13.413.85a2.926 2.926 0 00-4.144 0L7.154 2.966l2.6 2.6a3.468 3.468 0 013.816.748 3.475 3.475 0 01.748 3.818l2.509 2.508a3.47 3.47 0 013.819.748 3.482 3.482 0 01-4.924 4.924 3.483 3.483 0 01-.746-3.822L12.5 11.41v6.354a3.463 3.463 0 01.918 5.571 3.482 3.482 0 01-4.924-4.924 3.473 3.473 0 011.738-1.001V11.31a3.47 3.47 0 01-1.738-1.001A3.484 3.484 0 018.247 6.5l-2.555-2.555L.85 9.267a2.926 2.926 0 000 4.143L10.587 23.15a2.926 2.926 0 004.143 0l8.42-8.42a2.926 2.926 0 000-4.143" fill="#f05032"/>
    </svg>
  )
}

/* Map of keyword → icon component */
const ICON_MAP = [
  { keys: ['python'],       Icon: PythonIcon,     bg: 'rgba(55,118,171,0.15)',  border: 'rgba(55,118,171,0.3)'  },
  { keys: ['react'],        Icon: ReactIcon,      bg: 'rgba(97,218,251,0.12)',  border: 'rgba(97,218,251,0.28)' },
  { keys: ['django'],       Icon: DjangoIcon,     bg: 'rgba(9,46,32,0.3)',      border: 'rgba(9,46,32,0.5)'     },
  { keys: ['docker'],       Icon: DockerIcon,     bg: 'rgba(35,150,237,0.12)', border: 'rgba(35,150,237,0.28)' },
  { keys: ['javascript','js'], Icon: JavaScriptIcon, bg: 'rgba(247,223,30,0.1)', border: 'rgba(247,223,30,0.25)' },
  { keys: ['sql','postgres','mysql','database','db'], Icon: SQLIcon, bg: 'rgba(51,103,145,0.15)', border: 'rgba(51,103,145,0.3)' },
  { keys: ['node','express'],  Icon: NodeIcon,    bg: 'rgba(140,200,75,0.12)', border: 'rgba(140,200,75,0.28)'  },
  { keys: ['tailwind','css'],  Icon: TailwindIcon,bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.28)'  },
  { keys: ['typescript','ts'], Icon: TypeScriptIcon, bg: 'rgba(49,120,198,0.15)', border: 'rgba(49,120,198,0.3)'  },
  { keys: ['git','github'],    Icon: GitIcon,     bg: 'rgba(240,80,50,0.12)',  border: 'rgba(240,80,50,0.28)'   },
]

function resolveIcon(skillName) {
  const lower = skillName?.toLowerCase() ?? ''
  for (const entry of ICON_MAP) {
    if (entry.keys.some((k) => lower.includes(k))) {
      return entry
    }
  }
  return null
}

/* ─── SkillCard ─────────────────────────────────────────────────────── */
/**
 * SkillCard — V3 Premium Redesign
 *
 * Large glassmorphic card with:
 *   - Glowing circular technology icon
 *   - Bold skill name + target tasks
 *   - Progress label + bold percentage
 *   - 12px tall purple-gradient progress bar with animation
 *   - Completed / remaining task counters from backend
 *   - Hover lift + purple glow
 *   - Edit / Delete action buttons
 *
 * Props:
 *   - skill: skill object from API
 *   - onEdit: callback when edit is triggered
 *   - onDelete: callback when delete is triggered
 */
const SkillCard = memo(function SkillCard({ skill, onEdit, onDelete }) {
  // Derive completed/remaining from backend progress field + target_tasks
  const completedTasks = Math.round((skill.progress / 100) * skill.target_tasks)
  const remainingTasks = Math.max(0, skill.target_tasks - completedTasks)
  const clampedProgress = Math.min(100, Math.max(0, skill.progress))

  const iconEntry = resolveIcon(skill.name)
  const skillColor = skill.color || '#8B5CF6'

  return (
    <div
      className="sc-card"
      id={`skill-card-${skill.id}`}
      style={{ '--skill-color': skillColor }}
    >
      {/* Background glow orb */}
      <div
        className="sc-card__glow"
        style={{ background: `radial-gradient(circle at 80% 10%, ${skillColor}22 0%, transparent 65%)` }}
      />

      {/* ── Card Header: Icon + Title + Actions ── */}
      <div className="sc-card__header">

        {/* Technology Icon */}
        <div
          className="sc-card__icon"
          style={iconEntry
            ? { background: iconEntry.bg, borderColor: iconEntry.border }
            : { background: `${skillColor}18`, borderColor: `${skillColor}35` }
          }
        >
          {iconEntry
            ? <iconEntry.Icon />
            : <Code2 size={26} strokeWidth={1.5} style={{ color: skillColor }} />
          }
        </div>

        {/* Name + Target */}
        <div className="sc-card__name-wrap">
          <h3 className="sc-card__name" title={skill.name}>{skill.name}</h3>
          <p className="sc-card__target">{skill.target_tasks} target tasks</p>
        </div>

        {/* Action Buttons */}
        <div className="sc-card__actions">
          <button
            onClick={() => onEdit(skill)}
            className="sc-card__action-btn sc-card__action-btn--edit"
            title="Edit Skill"
            aria-label={`Edit ${skill.name}`}
          >
            <Pencil size={15} strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete(skill)}
            className="sc-card__action-btn sc-card__action-btn--delete"
            title="Delete Skill"
            aria-label={`Delete ${skill.name}`}
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Progress Section ── */}
      <div className="sc-card__progress-wrap">
        <div className="sc-card__progress-label-row">
          <span className="sc-card__progress-label">Progress</span>
          <span
            className="sc-card__progress-pct"
            style={{ color: clampedProgress > 0 ? skillColor : '#64748b' }}
          >
            {clampedProgress}%
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="sc-card__bar-track">
          <div
            className="sc-card__bar-fill"
            style={{
              width: `${clampedProgress}%`,
              background: clampedProgress > 0
                ? `linear-gradient(90deg, #7C3AED 0%, ${skillColor} 100%)`
                : 'transparent',
            }}
          />
        </div>

        {/* Footer Counters */}
        <div className="sc-card__counters">
          <span className="sc-card__counter">{completedTasks} completed</span>
          <span className="sc-card__counter">{remainingTasks} left</span>
        </div>
      </div>
    </div>
  )
})

export default SkillCard
