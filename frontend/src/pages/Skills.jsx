import React, { useState, useEffect, useCallback } from 'react'
import skillsService from '../services/skillsService'
import { SkillCard, SkillModal, DeleteConfirmModal } from '../components/skills'
import { Plus, Brain, AlertCircle } from 'lucide-react'

/**
 * SkillCardSkeleton
 *
 * Shimmer placeholder that matches the shape of a SkillCard.
 * Rendered while fetching skills.
 */
function SkillCardSkeleton() {
  return (
    <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 h-[178px] flex flex-col justify-between animate-pulse">
      <div>
        <div className="flex justify-between items-start">
          <div className="h-6 bg-slate-800/60 rounded w-1/2" />
          <div className="flex gap-1.5">
            <div className="h-7 w-7 bg-slate-800/60 rounded-lg" />
            <div className="h-7 w-7 bg-slate-800/60 rounded-lg" />
          </div>
        </div>
        <div className="h-4 bg-slate-800/60 rounded w-1/3 mt-2" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="flex justify-between">
          <div className="h-3 bg-slate-800/60 rounded w-1/4" />
          <div className="h-3 bg-slate-800/60 rounded w-1/12" />
        </div>
        <div className="h-2 bg-slate-800/60 rounded-full w-full" />
        <div className="flex justify-between pt-0.5">
          <div className="h-3 bg-slate-800/60 rounded w-1/5" />
          <div className="h-3 bg-slate-800/60 rounded w-1/6" />
        </div>
      </div>
    </div>
  )
}

/**
 * ErrorBanner
 *
 * Rendered when the skills fetch API request fails.
 */
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

/**
 * Skills
 *
 * Page controller representing the Skills page.
 * Manages rendering of skills list, loading states, edit/delete actions,
 * and page-level modals.
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

  // Create Skill Handlers
  const handleOpenCreateModal = () => {
    setSelectedEditSkill(null)
    setIsFormModalOpen(true)
  }

  // Edit Skill Handlers
  const handleOpenEditModal = (skill) => {
    setSelectedEditSkill(skill)
    setIsFormModalOpen(true)
  }

  // Delete Skill Handlers
  const handleOpenDeleteModal = (skill) => {
    setSelectedDeleteSkill(skill)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
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
  }

  return (
    <div id="page-skills" className="dash-page animate-fade-in">
      {/* ── Page Header / Greetings ── */}
      <div className="dash-greeting">
        <div>
          <h2 className="dash-greeting__title">Skills & Competencies</h2>
          <p className="dash-greeting__sub font-medium">
            Define, monitor, and master your technical capabilities.
          </p>
        </div>
        <button
          id="skills-add-btn"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Skill
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && <ErrorBanner message={error} onRetry={fetchSkills} />}

      {/* ── Skills Grid / Content Area ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <SkillCardSkeleton key={i} />
          ))}
        </div>
      ) : skills.length === 0 && !error ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 shadow-xl backdrop-blur-md max-w-xl mx-auto mt-8 transition-all hover:border-slate-700/60">
          <div className="w-16 h-16 rounded-full bg-slate-800/40 border border-slate-750 flex items-center justify-center text-slate-400 mb-4">
            <Brain size={32} strokeWidth={1.5} className="text-slate-400 animate-pulse" />
          </div>
          <h3 className="text-slate-200 text-base font-semibold mb-2">No skills found</h3>
          <p className="text-slate-450 text-xs max-w-sm mb-6 leading-relaxed">
            It looks like you haven't defined any skills yet. Establish a skill, choose a target tasks quota, and track your development.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-500/5 hover:-translate-y-0.5"
          >
            Create Your First Skill
          </button>
        </div>
      ) : (
        /* Render Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
            />
          ))}
        </div>
      )}

      {/* ── Modal Dialogs ── */}

      {/* Create / Edit Form Modal */}
      <SkillModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSaveSuccess={fetchSkills}
        editSkill={selectedEditSkill}
      />

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        skillName={selectedDeleteSkill?.name || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
