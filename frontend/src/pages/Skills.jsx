import React, { useState, useEffect, useCallback } from 'react'
import skillsService from '../services/skillsService'
import { SkillCard, SkillModal, DeleteConfirmModal } from '../components/skills'
import { Plus, Layers, AlertCircle } from 'lucide-react'

/* ─── Skeleton Card ─────────────────────────────────────────────────── */
function SkillCardSkeleton() {
  return (
    <div className="sc-skeleton">
      <div className="sc-skeleton__header">
        <div className="sc-skeleton__icon" />
        <div className="sc-skeleton__name-wrap">
          <div className="sc-skeleton__line sc-skeleton__line--title" />
          <div className="sc-skeleton__line sc-skeleton__line--sub" />
        </div>
      </div>
      <div className="sc-skeleton__progress">
        <div className="sc-skeleton__label-row">
          <div className="sc-skeleton__line sc-skeleton__line--label" />
          <div className="sc-skeleton__line sc-skeleton__line--pct" />
        </div>
        <div className="sc-skeleton__bar" />
        <div className="sc-skeleton__footer">
          <div className="sc-skeleton__line sc-skeleton__line--count" />
          <div className="sc-skeleton__line sc-skeleton__line--count" />
        </div>
      </div>
    </div>
  )
}

/* ─── Error Banner ──────────────────────────────────────────────────── */
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="dash-error" role="alert">
      <div className="dash-error__inner">
        <AlertCircle size={20} className="dash-error__icon text-red-400" />
        <div>
          <p className="dash-error__title">Failed to load skills</p>
          <p className="dash-error__msg">{message}</p>
        </div>
      </div>
      <button id="skills-retry-btn" className="dash-error__retry cursor-pointer" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

/* ─── Empty State ───────────────────────────────────────────────────── */
function EmptyState({ onAdd }) {
  return (
    <div className="sc-empty">
      {/* Glowing stacked-layers illustration */}
      <div className="sc-empty__illus" aria-hidden="true">
        <div className="sc-empty__orb sc-empty__orb--1" />
        <div className="sc-empty__orb sc-empty__orb--2" />
        <div className="sc-empty__illus-icon">
          <Layers size={48} strokeWidth={1} />
          {/* Sparkles */}
          <span className="sc-empty__spark sc-empty__spark--tl">✦</span>
          <span className="sc-empty__spark sc-empty__spark--tr">✦</span>
          <span className="sc-empty__spark sc-empty__spark--bl">✦</span>
          <span className="sc-empty__spark sc-empty__spark--br">✦</span>
        </div>
      </div>

      <h3 className="sc-empty__title">Add your first skill</h3>
      <p className="sc-empty__desc">
        Start building your technical journey by adding your first competency.
      </p>

      <button
        onClick={onAdd}
        className="sc-empty__cta"
        id="skills-empty-add-btn"
        aria-label="Add your first skill"
      >
        <Plus size={18} strokeWidth={2.5} />
        Add Skill
      </button>
    </div>
  )
}

/* ─── Skills Page ────────────────────────────────────────────────────── */
/**
 * Skills — V3 Premium Redesign
 *
 * Page controller for the Skills management interface.
 * Manages rendering of skill cards, loading/error states, and CRUD modals.
 *
 * All business logic is preserved exactly as-is.
 * Only the UI/layout has been updated.
 */
export default function Skills() {
  const [skills, setSkills] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal control states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedEditSkill, setSelectedEditSkill] = useState(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDeleteSkill, setSelectedDeleteSkill] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch Skills from backend APIs
  const fetchSkills = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await skillsService.getAll()
      setSkills(data || [])
    } catch (err) {
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to fetch skills. Please check backend connection.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fire on page load
  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const handleOpenCreateModal = useCallback(() => {
    setSelectedEditSkill(null)
    setIsFormModalOpen(true)
  }, [])

  const handleOpenEditModal = useCallback((skill) => {
    setSelectedEditSkill(skill)
    setIsFormModalOpen(true)
  }, [])

  const handleOpenDeleteModal = useCallback((skill) => {
    setSelectedDeleteSkill(skill)
    setIsDeleteModalOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedDeleteSkill) return
    setIsDeleting(true)
    try {
      await skillsService.remove(selectedDeleteSkill.id)
      setSkills((prev) => prev.filter((s) => s.id !== selectedDeleteSkill.id))
      setIsDeleteModalOpen(false)
      setSelectedDeleteSkill(null)
    } catch (err) {
      alert(
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to delete skill.'
      )
    } finally {
      setIsDeleting(false)
    }
  }, [selectedDeleteSkill])

  const handleCloseFormModal = useCallback(() => setIsFormModalOpen(false), [])
  const handleCloseDeleteModal = useCallback(() => setIsDeleteModalOpen(false), [])

  return (
    <div id="page-skills" className="sc-page animate-fade-in">

      {/* ══ Page Header ══════════════════════════════════════════════ */}
      <div className="sc-header">
        <div className="sc-header__text">
          <h1 className="sc-header__title">Skills &amp; Competencies</h1>
          <p className="sc-header__sub">
            Define, monitor, and master your technical capabilities.
          </p>
        </div>

        {/* Desktop Add Skill button */}
        <button
          id="skills-add-btn"
          onClick={handleOpenCreateModal}
          className="sc-add-btn sc-add-btn--desktop"
          aria-label="Add new skill"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Skill
        </button>
      </div>

      {/* ══ Error Banner ══════════════════════════════════════════════ */}
      {error && <ErrorBanner message={error} onRetry={fetchSkills} />}

      {/* ══ Mobile Add Skill button (full width) ══════════════════════ */}
      {!error && (
        <button
          onClick={handleOpenCreateModal}
          className="sc-add-btn sc-add-btn--mobile"
          aria-label="Add new skill"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Skill
        </button>
      )}

      {/* ══ Skills Grid / Content Area ════════════════════════════════ */}
      {isLoading ? (
        <div className="sc-grid">
          {[1, 2, 3, 4].map((i) => <SkillCardSkeleton key={i} />)}
        </div>
      ) : skills.length === 0 && !error ? (
        <EmptyState onAdd={handleOpenCreateModal} />
      ) : !error ? (
        <div className="sc-grid">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
            />
          ))}
        </div>
      ) : null}

      {/* ══ Modals ════════════════════════════════════════════════════ */}

      {isFormModalOpen && (
        <SkillModal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          onSaveSuccess={fetchSkills}
          editSkill={selectedEditSkill}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          skillName={selectedDeleteSkill?.name || ''}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
