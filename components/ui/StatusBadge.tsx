'use client'
import { STATUS_MAP } from '@/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, tw: 'bg-gray-100 text-gray-600 border-gray-300', dot: 'bg-gray-400' }
  return (
    <span className={`status-badge ${s.tw}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
