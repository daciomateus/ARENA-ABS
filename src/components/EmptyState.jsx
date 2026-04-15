export function EmptyState({ title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-ink-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  )
}
