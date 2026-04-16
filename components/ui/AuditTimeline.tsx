import { formatDateTime } from '@/lib/utils'

interface Log {
  id: number
  icon: string
  actor: string
  note: string
  createdAt: Date | string
}

export function AuditTimeline({ logs }: { logs: Log[] }) {
  return (
    <div className="space-y-1">
      {logs.map((log, i) => (
        <div key={log.id} className="relative flex gap-3 pb-4">
          {i < logs.length - 1 && <div className="tl-line" />}
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs z-10 flex-shrink-0">
            {log.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{log.note}</p>
            <p className="text-xs text-gray-400">
              {log.actor} · {formatDateTime(log.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
