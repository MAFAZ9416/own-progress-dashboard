/** Minimal full-page loader for lazy route chunks. */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0f172a]">
      <span className="text-slate-400 text-sm animate-pulse">Loading…</span>
    </div>
  )
}
