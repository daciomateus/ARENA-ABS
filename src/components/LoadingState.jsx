export function LoadingState({ label = 'Carregando...' }) {
  return (
    <div className="section-card flex items-center justify-center py-16 text-sm font-medium text-slate-500">
      {label}
    </div>
  )
}
