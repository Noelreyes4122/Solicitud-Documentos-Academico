'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { AuditTimeline } from '@/components/ui/AuditTimeline'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatCurrency, PURPOSES } from '@/lib/utils'

type Request = {
  id: number
  code: string
  status: string
  copies: number
  purpose: string
  language: string
  institution?: string
  observations?: string
  adminNotes?: string
  createdAt: string
  docType: { id: number; name: string; slug: string; icon: string; price: number; autoPdf: boolean }
  student: { firstName: string; lastName: string; matricula: string; carrera: string; correoInstitucional: string }
  auditLogs: any[]
}

const REJECT_REASONS = [
  'Comprobante de pago inválido o ilegible',
  'Información incompleta o incorrecta',
  'Documento no disponible para este período',
  'Estudiante con deudas pendientes',
  'Solicitud duplicada',
  'Otro motivo',
]

export default function AdminPanelPage() {
  const { data: session } = useSession()
  const { showToast } = useToast()

  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  // Detail modal
  const [detailReq, setDetailReq] = useState<Request | null>(null)

  // Reject modal
  const [rejectReq, setRejectReq] = useState<Request | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectObs, setRejectObs] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const user = session?.user as any

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/requests')
      if (res.ok) setRequests(await res.json())
    } catch {
      showToast('Error cargando solicitudes', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const filtered = requests.filter(r => {
    const matchSearch =
      !search ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.student.firstName.toLowerCase().includes(search.toLowerCase()) ||
      r.student.lastName.toLowerCase().includes(search.toLowerCase()) ||
      r.docType.name.toLowerCase().includes(search.toLowerCase())
    const statusMap = {
      pending: ['pending', 'process'],
      approved: ['ready', 'delivered'],
      rejected: ['rejected'],
    }
    return matchSearch && statusMap[activeTab].includes(r.status)
  })

  const counts = {
    pending: requests.filter(r => ['pending', 'process'].includes(r.status)).length,
    approved: requests.filter(r => ['ready', 'delivered'].includes(r.status)).length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    total: requests.length,
  }

  async function doAction(id: number, endpoint: string, body?: object) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/requests/${id}/${endpoint}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) throw new Error()
      showToast('Acción realizada exitosamente', 'success')
      await fetchRequests()
      setDetailReq(null)
    } catch {
      showToast('Error al realizar la acción', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject() {
    if (!rejectReq || !rejectReason) return
    await doAction(rejectReq.id, 'rechazar', {
      reason: rejectReason,
      observations: rejectObs,
    })
    setRejectReq(null)
    setRejectReason('')
    setRejectObs('')
  }

  const borderColor = (status: string) => {
    if (['pending', 'process'].includes(status)) return 'border-l-orange-400'
    if (['ready', 'delivered'].includes(status)) return 'border-l-green-500'
    if (status === 'rejected') return 'border-l-red-500'
    return 'border-l-gray-300'
  }

  const initials = (r: Request) =>
    `${r.student.firstName?.[0] || ''}${r.student.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-[#0F2D4F]">
              Panel Administrativo
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sesión:{' '}
              <span className="font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              {user?.cargo && (
                <span className="ml-2 bg-[#153c76]/10 text-[#153c76] text-xs font-semibold px-2 py-0.5 rounded">
                  {user.cargo}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <i className="bi bi-arrow-clockwise" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pendientes', value: counts.pending, icon: 'bi-hourglass-split', color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Aprobadas', value: counts.approved, icon: 'bi-check-circle', color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Rechazadas', value: counts.rejected, icon: 'bi-x-circle', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total', value: counts.total, icon: 'bi-files', color: 'text-[#153c76]', bg: 'bg-blue-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <i className={`bi ${stat.icon} ${stat.color} text-sm`} />
              </div>
            </div>
            <p className={`font-heading font-bold text-3xl ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Buscar por estudiante, código o documento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2E7D32] bg-white"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-5 w-fit">
        {([
          { key: 'pending', label: 'Pendientes', count: counts.pending, color: 'text-orange-600' },
          { key: 'approved', label: 'Aprobadas', count: counts.approved, color: 'text-green-700' },
          { key: 'rejected', label: 'Rechazadas', count: counts.rejected, color: 'text-red-600' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t.key
                ? 'bg-[#0F2D4F] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === t.key ? 'bg-white/20 text-white' : `bg-gray-100 ${t.color}`
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Request Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <i className="bi bi-arrow-repeat animate-spin text-3xl text-gray-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <i className="bi bi-inbox text-4xl block mb-3" />
          <p>No hay solicitudes en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div
              key={req.id}
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-l-4 ${borderColor(req.status)}`}
            >
              <div className="flex items-start gap-4">
                {/* Student Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#0F2D4F]/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-sm text-[#0F2D4F]">{initials(req)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">
                      {req.student.firstName} {req.student.lastName}
                    </p>
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      {req.student.matricula}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    <i className={`bi ${req.docType.icon} mr-1`} />
                    {req.docType.name} · {req.copies} copia(s) ·{' '}
                    {PURPOSES.find(p => p.value === req.purpose)?.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {req.code} · {formatDate(req.createdAt)} · {formatCurrency(req.docType.price * req.copies)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setDetailReq(req)}
                    className="text-xs text-[#153c76] font-semibold hover:underline px-2 py-1.5 rounded hover:bg-blue-50 transition"
                  >
                    Ver
                  </button>
                  {req.status === 'pending' && (
                    <button
                      onClick={() => doAction(req.id, 'proceso')}
                      disabled={actionLoading === req.id}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      En Proceso
                    </button>
                  )}
                  {['pending', 'process'].includes(req.status) && (
                    <>
                      <button
                        onClick={() => doAction(req.id, 'aprobar')}
                        disabled={actionLoading === req.id}
                        className="text-xs bg-[#2E7D32] hover:bg-[#1b5e20] text-white font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => { setRejectReq(req); setRejectReason(''); setRejectObs('') }}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!detailReq}
        onClose={() => setDetailReq(null)}
        title={`Solicitud ${detailReq?.code || ''}`}
        size="lg"
        footer={
          <button
            onClick={() => setDetailReq(null)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cerrar
          </button>
        }
      >
        {detailReq && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <StatusBadge status={detailReq.status} />
              <span className="text-xs text-gray-400">{formatDate(detailReq.createdAt)}</span>
            </div>

            {/* Student */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wider">Estudiante</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="font-semibold">{detailReq.student.firstName} {detailReq.student.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Matrícula</p>
                  <p className="font-mono font-semibold">{detailReq.student.matricula}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Carrera</p>
                  <p className="font-semibold">{detailReq.student.carrera}</p>
                </div>
              </div>
            </div>

            {/* Doc Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-400">Documento</p>
                <p className="text-sm font-semibold">{detailReq.docType.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Propósito</p>
                <p className="text-sm font-semibold">{PURPOSES.find(p => p.value === detailReq.purpose)?.label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Copias · Monto</p>
                <p className="text-sm font-semibold">{detailReq.copies} · {formatCurrency(detailReq.docType.price * detailReq.copies)}</p>
              </div>
              {detailReq.institution && (
                <div>
                  <p className="text-xs text-gray-400">Institución</p>
                  <p className="text-sm font-semibold">{detailReq.institution}</p>
                </div>
              )}
              {detailReq.observations && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Observaciones</p>
                  <p className="text-sm">{detailReq.observations}</p>
                </div>
              )}
              {detailReq.adminNotes && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Nota Admin</p>
                  <p className="text-sm text-red-700 font-medium">{detailReq.adminNotes}</p>
                </div>
              )}
            </div>

            {detailReq.auditLogs?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Historial</p>
                <AuditTimeline logs={detailReq.auditLogs} />
              </div>
            )}

            {['pending', 'process'].includes(detailReq.status) && (
              <div className="flex gap-2 pt-2 border-t">
                {detailReq.status === 'pending' && (
                  <button
                    onClick={() => doAction(detailReq.id, 'proceso')}
                    disabled={actionLoading === detailReq.id}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  >
                    Marcar En Proceso
                  </button>
                )}
                <button
                  onClick={() => doAction(detailReq.id, 'aprobar')}
                  disabled={actionLoading === detailReq.id}
                  className="flex-1 bg-[#2E7D32] hover:bg-[#1b5e20] text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => { setRejectReq(detailReq); setDetailReq(null) }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg transition"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectReq}
        onClose={() => setRejectReq(null)}
        title="Rechazar Solicitud"
        size="md"
        footer={
          <>
            <button
              onClick={() => setRejectReq(null)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectReason || actionLoading !== null}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              <i className="bi bi-x-circle" />
              Confirmar Rechazo
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona el motivo del rechazo para{' '}
            <span className="font-semibold">{rejectReq?.code}</span>
          </p>
          <div className="space-y-2">
            {REJECT_REASONS.map(reason => (
              <label
                key={reason}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="rejectReason"
                  value={reason}
                  checked={rejectReason === reason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="text-red-600"
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Observaciones adicionales
            </label>
            <textarea
              value={rejectObs}
              onChange={e => setRejectObs(e.target.value)}
              placeholder="Detalles adicionales para el estudiante..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-red-400 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
