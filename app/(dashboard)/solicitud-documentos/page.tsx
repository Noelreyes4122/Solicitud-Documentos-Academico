'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { AuditTimeline } from '@/components/ui/AuditTimeline'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatCurrency, getDeliveryLabel, PURPOSES, STATUS_MAP } from '@/lib/utils'

type DocType = {
  id: number
  name: string
  slug: string
  icon: string
  price: number
  deliveryDays: number
  autoPdf: boolean
}

type Request = {
  id: number
  code: string
  status: string
  copies: number
  purpose: string
  language: string
  institution?: string
  observations?: string
  createdAt: string
  docType: DocType
  auditLogs: any[]
}

const STEPS = ['Tipo de Documento', 'Datos y Propósito', 'Pago y Confirmación', 'Solicitud Enviada']

const STATUS_STEPS = [
  { key: 'sent',      label: 'Solicitud Enviada',   icon: 'bi-send-check'         },
  { key: 'review',    label: 'En Revisión',          icon: 'bi-search'             },
  { key: 'approved',  label: 'Pago Verificado',      icon: 'bi-shield-check'       },
  { key: 'ready',     label: 'Documento Listo',      icon: 'bi-file-earmark-check' },
  { key: 'delivered', label: 'Entregado',            icon: 'bi-bag-check'          },
]

function getStatusStep(status: string) {
  if (status === 'rejected') return -1
  if (status === 'pending')   return 0
  if (status === 'process')   return 1
  if (status === 'approved')  return 2
  if (status === 'ready')     return 3
  if (status === 'delivered') return 4
  return 0
}

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
]

export default function SolicitudDocumentosPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()

  const tab = searchParams.get('tab') || 'inicio'
  const setTab = (t: string) => router.push(`?tab=${t}`)

  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // New request wizard
  const [step, setStep] = useState(1)
  const [selectedDoc, setSelectedDoc] = useState<DocType | null>(null)
  const [purpose, setPurpose] = useState('')
  const [language, setLanguage] = useState('es')
  const [copies, setCopies] = useState(1)
  const [institution, setInstitution] = useState('')
  const [observations, setObservations] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successRequest, setSuccessRequest] = useState<Request | null>(null)

  // Search & filter
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Detail modal
  const [detailReq, setDetailReq] = useState<Request | null>(null)

  const fetchData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [dtRes, reqRes] = await Promise.all([
        fetch('/api/document-types'),
        fetch('/api/solicitudes'),
      ])
      if (dtRes.ok) setDocTypes(await dtRes.json())
      if (reqRes.ok) setRequests(await reqRes.json())
    } catch {
      showToast('Error cargando datos', 'error')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const user = session?.user as any

  // Stat counts
  const total = requests.length
  const proceso = requests.filter(r => r.status === 'process').length
  const completadas = requests.filter(r => ['ready', 'delivered'].includes(r.status)).length
  const pendientes = requests.filter(r => r.status === 'pending').length

  async function handleSubmitRequest() {
    if (!selectedDoc || !purpose) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docTypeId: selectedDoc.id,
          purpose,
          language,
          copies,
          institution,
          observations,
        }),
      })
      if (!res.ok) throw new Error('Error')
      const created: Request = await res.json()
      setSuccessRequest(created)
      await fetchData()
      setStep(4)
    } catch {
      showToast('Error al enviar solicitud', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredRequests = requests.filter(r => {
    const matchSearch =
      !search ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.docType.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || r.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[#0F2D4F]">
            Solicitud de Documentos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus solicitudes de documentos oficiales</p>
        </div>
        <button
          onClick={() => { setTab('nueva'); setStep(1) }}
          className="bg-[#2E7D32] hover:bg-[#1b5e20] text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <i className="bi bi-plus-lg" />
          Nueva Solicitud
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 w-fit">
        {[
          { key: 'inicio', icon: 'bi-house', label: 'Inicio' },
          { key: 'nueva', icon: 'bi-plus-circle', label: 'Nueva' },
          { key: 'solicitudes', icon: 'bi-list-ul', label: 'Mis Solicitudes' },
          { key: 'documentos', icon: 'bi-download', label: 'Documentos' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className={`bi ${t.icon}`} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ==================== INICIO TAB ==================== */}
      {tab === 'inicio' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: total, icon: 'bi-files', color: 'text-[#153c76]', bg: 'bg-blue-50' },
              { label: 'En Proceso', value: proceso, icon: 'bi-clock-history', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Completadas', value: completadas, icon: 'bi-check-circle', color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Pendientes', value: pendientes, icon: 'bi-hourglass-split', color: 'text-yellow-700', bg: 'bg-yellow-50' },
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Requests + Estado Actual */}
            <div className="space-y-4">
              {/* Estado Actual - most recent request */}
              {!loadingData && requests.length > 0 && (() => {
                const latest = requests[0]
                const stepIdx = getStatusStep(latest.status)
                const isRejected = latest.status === 'rejected'
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-bold text-[#0F2D4F]">Estado Actual</h3>
                      <StatusBadge status={latest.status} />
                    </div>
                    <div className="flex items-center gap-2 mb-5 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <i className={`bi ${latest.docType.icon} text-[#2E7D32] text-sm`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{latest.docType.name}</p>
                        <p className="text-xs font-mono text-gray-400">{latest.code}</p>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(latest.createdAt)}</span>
                    </div>

                    {isRejected ? (
                      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <i className="bi bi-x-circle-fill text-red-500 text-lg" />
                        <div>
                          <p className="text-sm font-semibold text-red-700">Solicitud Rechazada</p>
                          <p className="text-xs text-red-500">Contacta Registro para más información.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative pl-4">
                        {STATUS_STEPS.map((s, i) => {
                          const done = i <= stepIdx
                          const active = i === stepIdx
                          return (
                            <div key={s.key} className="flex items-start gap-3 mb-4 last:mb-0">
                              {/* Vertical line */}
                              <div className="flex flex-col items-center flex-shrink-0">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                    done
                                      ? 'bg-[#2E7D32] border-[#2E7D32]'
                                      : active
                                      ? 'bg-[#153c76] border-[#153c76]'
                                      : 'bg-white border-gray-200'
                                  }`}
                                >
                                  {done ? (
                                    <i className="bi bi-check text-white text-sm font-bold" />
                                  ) : (
                                    <i className={`bi ${s.icon} text-xs ${active ? 'text-white' : 'text-gray-300'}`} />
                                  )}
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                  <div className={`w-0.5 h-6 mt-1 ${i < stepIdx ? 'bg-[#2E7D32]' : 'bg-gray-200'}`} />
                                )}
                              </div>
                              <div className="pt-1.5">
                                <p className={`text-sm font-semibold ${done ? 'text-[#2E7D32]' : active ? 'text-[#153c76]' : 'text-gray-400'}`}>
                                  {s.label}
                                </p>
                                {active && !done && (
                                  <p className="text-xs text-blue-500 mt-0.5">En progreso...</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => setDetailReq(latest)}
                      className="mt-4 w-full text-sm text-[#153c76] font-semibold border border-[#153c76]/20 hover:bg-blue-50 rounded-lg py-2 transition"
                    >
                      Ver detalles completos
                    </button>
                  </div>
                )
              })()}

              {/* Solicitudes Recientes */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-heading font-bold text-[#0F2D4F] mb-4">Solicitudes Recientes</h3>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <i className="bi bi-arrow-repeat animate-spin text-gray-300 text-2xl" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="bi bi-inbox text-3xl block mb-2" />
                    <p className="text-sm">No tienes solicitudes aún</p>
                    <button
                      onClick={() => { setTab('nueva'); setStep(1) }}
                      className="mt-3 text-sm text-[#2E7D32] font-semibold hover:underline"
                    >
                      Crear primera solicitud →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.slice(0, 5).map(req => (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-50 hover:border-gray-200 transition"
                        onClick={() => setDetailReq(req)}
                      >
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <i className={`bi ${req.docType.icon} text-[#2E7D32]`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{req.docType.name}</p>
                          <p className="text-xs text-gray-400">{formatDate(req.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                            {req.code}
                          </span>
                          <StatusBadge status={req.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Times */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-heading font-bold text-[#0F2D4F] mb-4">Tiempos de entrega</h3>
                <div className="space-y-2">
                  {docTypes.map(dt => {
                    const delivery = getDeliveryLabel(dt.deliveryDays)
                    return (
                      <div key={dt.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <i className={`bi ${dt.icon} text-gray-400 text-sm`} />
                          <span className="text-sm text-gray-700">{dt.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${delivery.cls}`}>
                            {delivery.label}
                          </span>
                          <span className="text-xs text-gray-400">{formatCurrency(dt.price)}</span>
                        </div>
                      </div>
                    )
                  })}
                  {docTypes.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Cargando tipos...</p>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <i className="bi bi-lightning-charge-fill text-green-600 text-lg mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Entrega inmediata disponible</p>
                    <p className="text-xs text-green-700 mt-1">
                      Carta Universitaria y Constancia de Estudios se generan automáticamente en PDF el mismo día.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== NUEVA TAB ==================== */}
      {tab === 'nueva' && (
        <div className="max-w-3xl">
          {/* Step Bar — hidden on success screen */}
          <div className={`flex items-center mb-8 ${step === 4 ? 'hidden' : ''}`}>
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                      step > i + 1
                        ? 'bg-[#2E7D32] text-white'
                        : step === i + 1
                        ? 'bg-[#153c76] text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step > i + 1 ? <i className="bi bi-check" /> : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block ${
                      step === i + 1 ? 'text-[#153c76]' : 'text-gray-400'
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${step > i + 1 ? 'bg-[#2E7D32]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Select Doc Type */}
          {step === 1 && (
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0F2D4F] mb-4">
                Selecciona el tipo de documento
              </h2>
              {loadingData ? (
                <div className="flex justify-center py-12">
                  <i className="bi bi-arrow-repeat animate-spin text-2xl text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docTypes.map(dt => {
                    const delivery = getDeliveryLabel(dt.deliveryDays)
                    return (
                      <button
                        key={dt.id}
                        onClick={() => setSelectedDoc(dt)}
                        className={`text-left p-4 rounded-xl border-2 transition ${
                          selectedDoc?.id === dt.id
                            ? 'border-[#2E7D32] bg-green-50'
                            : 'border-gray-100 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              selectedDoc?.id === dt.id ? 'bg-[#2E7D32]' : 'bg-gray-100'
                            }`}
                          >
                            <i
                              className={`bi ${dt.icon} text-lg ${selectedDoc?.id === dt.id ? 'text-white' : 'text-gray-500'}`}
                            />
                          </div>
                          {selectedDoc?.id === dt.id && (
                            <i className="bi bi-check-circle-fill text-[#2E7D32]" />
                          )}
                        </div>
                        <p className="font-semibold text-gray-800 text-sm">{dt.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-bold text-[#2E7D32]">
                            {formatCurrency(dt.price)}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${delivery.cls}`}
                          >
                            {delivery.label}
                          </span>
                          {dt.autoPdf && (
                            <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-semibold">
                              PDF Auto
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => selectedDoc && setStep(2)}
                  disabled={!selectedDoc}
                  className="bg-[#153c76] hover:bg-[#0F2D4F] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-40 flex items-center gap-2"
                >
                  Siguiente <i className="bi bi-arrow-right" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Form */}
          {step === 2 && selectedDoc && (
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0F2D4F] mb-4">
                Datos de la solicitud
              </h2>

              {/* Read-only student info */}
              <div className="bg-gradient-to-r from-[#f0f7f0] to-[#f0f4ff] rounded-xl p-4 mb-5 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <i className="bi bi-person-badge text-[#2E7D32]" />
                  Información del Estudiante
                </p>
                {!user?.firstName ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="bi bi-arrow-repeat animate-spin" />
                    Cargando datos del estudiante...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-400">Nombre Completo</span>
                      <span className="font-semibold text-gray-800">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-400">Matrícula</span>
                      <span className="font-semibold font-mono text-[#153c76]">{user?.matricula}</span>
                    </div>
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <span className="text-xs text-gray-400">Carrera</span>
                      <span className="font-semibold text-gray-800">{user?.carrera || '—'}</span>
                    </div>
                    {user?.correoInstitucional && (
                      <div className="col-span-2 flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Correo Institucional</span>
                        <span className="font-medium text-gray-700">{user.correoInstitucional}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Propósito *
                    </label>
                    <select
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#2E7D32]"
                    >
                      <option value="">Seleccionar...</option>
                      {PURPOSES.map(p => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Idioma
                    </label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#2E7D32]"
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Copias
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={copies}
                      onChange={e => setCopies(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#2E7D32]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Institución (opcional)
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={e => setInstitution(e.target.value)}
                    placeholder="ej. Embajada Americana"
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Observaciones
                  </label>
                  <textarea
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                    placeholder="Información adicional..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#2E7D32] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium px-4 py-2.5"
                >
                  <i className="bi bi-arrow-left" /> Atrás
                </button>
                <div className="flex flex-col items-end gap-1">
                  {!purpose && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <i className="bi bi-exclamation-circle" />
                      Debes seleccionar un propósito
                    </p>
                  )}
                  <button
                    onClick={() => purpose && setStep(3)}
                    disabled={!purpose}
                    className="bg-[#153c76] hover:bg-[#0F2D4F] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Siguiente <i className="bi bi-arrow-right" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && selectedDoc && (
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0F2D4F] mb-4">
                Pago y Confirmación
              </h2>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-5">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Resumen del Pedido</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Documento:</span>
                    <span className="font-medium">{selectedDoc.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Copias:</span>
                    <span className="font-medium">{copies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Propósito:</span>
                    <span className="font-medium">{PURPOSES.find(p => p.value === purpose)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Idioma:</span>
                    <span className="font-medium">{LANGUAGES.find(l => l.value === language)?.label}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
                    <span className="text-gray-700">Total a pagar:</span>
                    <span className="text-[#2E7D32] text-lg">{formatCurrency(selectedDoc.price * copies)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Toggle */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Método de Pago</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition ${
                      paymentMethod === 'card'
                        ? 'border-[#153c76] bg-[#153c76] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <i className="bi bi-credit-card" /> Tarjeta
                  </button>
                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition ${
                      paymentMethod === 'transfer'
                        ? 'border-[#153c76] bg-[#153c76] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <i className="bi bi-bank" /> Transferencia
                  </button>
                </div>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-700">Datos de la Tarjeta</p>
                    <div className="flex gap-1.5">
                      <i className="bi bi-credit-card-2-front text-blue-600 text-xl" />
                      <i className="bi bi-credit-card text-red-500 text-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Número de Tarjeta</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={cardNumber}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                        setCardNumber(v.replace(/(.{4})/g, '$1 ').trim())
                      }}
                      className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-[#153c76] focus:ring-1 focus:ring-[#153c76]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre en la Tarjeta</label>
                    <input
                      type="text"
                      placeholder="JUAN PEREZ"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-[#153c76] focus:ring-1 focus:ring-[#153c76]/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Vencimiento</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v)
                        }}
                        className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-[#153c76] focus:ring-1 focus:ring-[#153c76]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-[#153c76] focus:ring-1 focus:ring-[#153c76]/20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <i className="bi bi-shield-lock-fill text-green-500" />
                    Pago seguro con cifrado SSL de 256 bits
                  </div>
                </div>
              )}

              {/* Bank Transfer Info */}
              {paymentMethod === 'transfer' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wider">
                    Datos de Transferencia Bancaria
                  </p>
                  {[
                    { label: 'Banco',   value: 'BanReservas' },
                    { label: 'Cuenta',  value: '201-1234567-8', mono: true },
                    { label: 'Titular', value: 'UNPHU — Oficina de Registro' },
                    { label: 'Concepto', value: `Solicitud de Documento — ${user?.matricula || ''}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-1 border-b border-blue-100 last:border-0">
                      <span className="text-sm text-gray-500">{row.label}:</span>
                      <span className={`text-sm font-semibold text-gray-800 ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Adjuntar comprobante (opcional)
                    </label>
                    <label className="block w-full border-2 border-dashed border-blue-200 rounded-xl p-4 text-center cursor-pointer hover:bg-blue-50 transition">
                      {receipt ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                          <i className="bi bi-check-circle-fill" /> {receipt.name}
                        </div>
                      ) : (
                        <>
                          <i className="bi bi-cloud-upload text-2xl text-blue-300 block mb-1" />
                          <p className="text-xs text-gray-500">PNG, JPG, PDF — máx. 5MB</p>
                        </>
                      )}
                      <input type="file" accept="image/*,.pdf" className="hidden"
                        onChange={e => setReceipt(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium px-4 py-2.5"
                >
                  <i className="bi bi-arrow-left" /> Atrás
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                  className="bg-[#2E7D32] hover:bg-[#1b5e20] text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin" /> Procesando pago...
                    </>
                  ) : (
                    <>
                      <i className={`bi bi-${paymentMethod === 'card' ? 'credit-card' : 'send'}`} />
                      {paymentMethod === 'card' ? 'Pagar y Enviar Solicitud' : 'Enviar Solicitud'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ---- Step 4: Success ---- */}
          {step === 4 && successRequest && (
            <div className="text-center py-4">
              {/* Animated check */}
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <i className="bi bi-check-circle-fill text-5xl text-[#2E7D32]" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-[#0F2D4F] mb-2">
                ¡Solicitud Enviada!
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Tu solicitud fue registrada exitosamente. La Oficina de Registro la procesará en breve.
              </p>

              {/* Request summary card */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 mb-6 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <i className={`bi ${successRequest.docType.icon} text-[#2E7D32]`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{successRequest.docType.name}</p>
                    <p className="text-xs font-mono text-gray-400">{successRequest.code}</p>
                  </div>
                  <div className="ml-auto">
                    <StatusBadge status={successRequest.status} />
                  </div>
                </div>

                {/* Mini stepper */}
                <div className="space-y-2">
                  {[
                    { label: 'Solicitud enviada',     done: true  },
                    { label: 'Pago registrado',        done: true  },
                    { label: 'En revisión por Registro', done: false },
                    { label: 'Documento listo',        done: false },
                    { label: 'Entregado',              done: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        s.done ? 'bg-[#2E7D32]' : 'bg-gray-100 border border-gray-200'
                      }`}>
                        {s.done
                          ? <i className="bi bi-check text-white text-xs" />
                          : <span className="text-gray-400 text-xs">{i + 1}</span>
                        }
                      </div>
                      <span className={`text-sm ${s.done ? 'text-[#2E7D32] font-medium' : 'text-gray-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-6">
                Puedes rastrear el estado en la pestaña <strong>Mis Solicitudes</strong>
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setStep(1)
                    setSelectedDoc(null)
                    setPurpose('')
                    setLanguage('es')
                    setCopies(1)
                    setInstitution('')
                    setObservations('')
                    setReceipt(null)
                    setCardNumber('')
                    setCardName('')
                    setCardExpiry('')
                    setCardCvv('')
                    setSuccessRequest(null)
                    setTab('solicitudes')
                  }}
                  className="bg-[#2E7D32] hover:bg-[#1b5e20] text-white font-semibold px-5 py-2.5 rounded-lg transition flex items-center gap-2"
                >
                  <i className="bi bi-list-ul" /> Ver mis solicitudes
                </button>
                <button
                  onClick={() => {
                    setStep(1)
                    setSelectedDoc(null)
                    setPurpose('')
                    setLanguage('es')
                    setCopies(1)
                    setInstitution('')
                    setObservations('')
                    setReceipt(null)
                    setCardNumber('')
                    setCardName('')
                    setCardExpiry('')
                    setCardCvv('')
                    setSuccessRequest(null)
                  }}
                  className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-5 py-2.5 rounded-lg transition flex items-center gap-2"
                >
                  <i className="bi bi-plus-lg" /> Nueva solicitud
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SOLICITUDES TAB ==================== */}
      {tab === 'solicitudes' && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Buscar por código o documento..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2E7D32]"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#2E7D32]"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="process">En Revisión</option>
              <option value="ready">Listo</option>
              <option value="delivered">Entregado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-16">
              <i className="bi bi-arrow-repeat animate-spin text-3xl text-gray-300" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <i className="bi bi-inbox text-4xl block mb-3" />
              <p>No se encontraron solicitudes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <i className={`bi ${req.docType.icon} text-[#2E7D32]`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-800 text-sm">{req.docType.name}</p>
                      <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        {req.code}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDate(req.createdAt)} · {req.copies} copia(s) ·{' '}
                      {PURPOSES.find(p => p.value === req.purpose)?.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={req.status} />
                    <button
                      onClick={() => setDetailReq(req)}
                      className="text-sm text-[#153c76] font-semibold hover:underline px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                    >
                      Ver
                    </button>
                    {['ready', 'delivered'].includes(req.status) && req.docType.autoPdf && (
                      <a
                        href={`/api/solicitudes/${req.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm text-[#2E7D32] font-semibold hover:underline px-3 py-1.5 rounded-lg hover:bg-green-50 transition"
                      >
                        <i className="bi bi-download" /> PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== DOCUMENTOS TAB ==================== */}
      {tab === 'documentos' && (
        <div>
          <p className="text-sm text-gray-500 mb-5">
            Documentos disponibles para descarga inmediata
          </p>
          {loadingData ? (
            <div className="flex justify-center py-16">
              <i className="bi bi-arrow-repeat animate-spin text-3xl text-gray-300" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requests
                .filter(r => ['ready', 'delivered'].includes(r.status) && r.docType.autoPdf)
                .map(req => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                        <i className={`bi ${req.docType.icon} text-teal-600`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{req.docType.name}</p>
                        <p className="text-xs font-mono text-gray-400">{req.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={req.status} />
                      <a
                        href={`/api/solicitudes/${req.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-[#2E7D32] hover:bg-[#1b5e20] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        <i className="bi bi-file-earmark-pdf" />
                        Descargar PDF
                      </a>
                    </div>
                  </div>
                ))}
              {requests.filter(
                r => ['ready', 'delivered'].includes(r.status) && r.docType.autoPdf
              ).length === 0 && (
                <div className="col-span-2 text-center py-16 text-gray-400">
                  <i className="bi bi-file-earmark-x text-4xl block mb-3" />
                  <p>No tienes documentos disponibles para descarga aún</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
      <Modal
        open={!!detailReq}
        onClose={() => setDetailReq(null)}
        title={`Solicitud ${detailReq?.code || ''}`}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setDetailReq(null)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cerrar
            </button>
            {detailReq &&
              ['ready', 'delivered'].includes(detailReq.status) &&
              detailReq.docType.autoPdf && (
                <a
                  href={`/api/solicitudes/${detailReq.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-[#2E7D32] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1b5e20] transition"
                >
                  <i className="bi bi-download" /> Descargar PDF
                </a>
              )}
          </>
        }
      >
        {detailReq && (
          <div className="space-y-5">
            {/* Status */}
            <div className="flex items-center gap-3">
              <StatusBadge status={detailReq.status} />
              <span className="text-xs text-gray-400">{formatDate(detailReq.createdAt)}</span>
            </div>

            {/* Doc Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-400">Documento</p>
                <p className="text-sm font-semibold text-gray-800">{detailReq.docType.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Propósito</p>
                <p className="text-sm font-semibold text-gray-800">
                  {PURPOSES.find(p => p.value === detailReq.purpose)?.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Copias</p>
                <p className="text-sm font-semibold text-gray-800">{detailReq.copies}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Idioma</p>
                <p className="text-sm font-semibold text-gray-800">
                  {LANGUAGES.find(l => l.value === detailReq.language)?.label}
                </p>
              </div>
              {detailReq.institution && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Institución</p>
                  <p className="text-sm font-semibold text-gray-800">{detailReq.institution}</p>
                </div>
              )}
              {detailReq.observations && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Observaciones</p>
                  <p className="text-sm text-gray-800">{detailReq.observations}</p>
                </div>
              )}
            </div>

            {/* Audit Timeline */}
            {detailReq.auditLogs?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Historial
                </p>
                <AuditTimeline logs={detailReq.auditLogs} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
