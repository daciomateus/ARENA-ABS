const statusConfigMap = {
  ativa: { className: 'status-chip status-chip-active', label: 'Ativa' },
  cancelada: { className: 'status-chip status-chip-cancelled', label: 'Cancelada' },
  pendente: { className: 'status-chip status-chip-pending', label: 'Pendente' },
  pago: { className: 'status-chip status-chip-active', label: 'Paga' },
  vencido: { className: 'status-chip status-chip-cancelled', label: 'Vencida' },
  vence_hoje: { className: 'status-chip status-chip-pending', label: 'Vence hoje' },
  vence_em_breve: { className: 'status-chip status-chip-pending', label: 'Vence em breve' },
}

export function StatusBadge({ status, label }) {
  const config = statusConfigMap[status] || statusConfigMap.pendente
  return <span className={config.className}>{label || config.label || status}</span>
}
