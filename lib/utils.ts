export function formatCurrency(amount: number) {
  return `RD$${amount.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function generateCode() {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `DOC-${date}-${rand}`
}

export function getPeriodoLabel(periodo: string) {
  const map: Record<string, string> = {
    '1-2026': 'Enero–Abril 2026',
    '2-2025': 'Agosto–Diciembre 2025',
    '1-2025': 'Enero–Abril 2025',
  }
  return map[periodo] || periodo
}

export function getDeliveryLabel(days: number) {
  if (days === 0) return { label: 'Mismo día', cls: 'bg-green-100 text-green-700' }
  if (days <= 2)  return { label: `${days}d`, cls: 'bg-blue-100 text-blue-700' }
  return { label: `${days} días`, cls: 'bg-gray-100 text-gray-600' }
}

export const STATUS_MAP: Record<string, { label: string; tw: string; dot: string }> = {
  pending:   { label: 'Pendiente',         tw: 'bg-yellow-100 text-yellow-800 border-yellow-300', dot: 'bg-yellow-500' },
  process:   { label: 'En Revisión',       tw: 'bg-blue-100 text-blue-800 border-blue-300',       dot: 'bg-blue-500' },
  approved:  { label: 'Aprobado',          tw: 'bg-green-100 text-green-800 border-green-300',    dot: 'bg-green-500' },
  ready:     { label: 'Listo ↓',           tw: 'bg-teal-100 text-teal-800 border-teal-300',       dot: 'bg-teal-500' },
  delivered: { label: 'Entregado',         tw: 'bg-gray-100 text-gray-600 border-gray-300',       dot: 'bg-gray-400' },
  rejected:  { label: 'Rechazado',         tw: 'bg-red-100 text-red-800 border-red-300',          dot: 'bg-red-500' },
}

export const PURPOSES = [
  { value: 'visa',     label: 'Trámite de Visa' },
  { value: 'empleo',   label: 'Empleo / Laboral' },
  { value: 'beca',     label: 'Beca' },
  { value: 'banco',    label: 'Banco' },
  { value: 'posgrado', label: 'Postgrado / Maestría' },
  { value: 'mescyt',   label: 'MESCYT' },
  { value: 'personal', label: 'Personal' },
  { value: 'otro',     label: 'Otro' },
]
