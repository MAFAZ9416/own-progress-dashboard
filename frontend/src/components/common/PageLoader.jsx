/** Minimal full-page loader for lazy route chunks. */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
      <span className="text-[var(--text-secondary)] text-sm animate-pulse">Loading…</span>
    </div>
  )
}
