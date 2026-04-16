'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { getPeriodoLabel } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export default function PerfilPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="bi bi-arrow-repeat animate-spin text-2xl text-gray-400" />
      </div>
    )
  }

  const user = session?.user as any
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-[#0F2D4F]">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Información académica y personal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT CARD */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header strip */}
            <div className="h-20 bg-gradient-to-r from-[#2E7D32] to-[#153c76]" />
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="-mt-10 mb-4 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-[#0F2D4F] border-4 border-white flex items-center justify-center shadow-lg">
                  <span className="font-heading font-bold text-2xl text-white">{initials}</span>
                </div>
              </div>

              {/* Matricula chip */}
              <div className="flex justify-center mb-2">
                <span className="bg-[#f0f4ff] text-[#153c76] text-xs font-bold px-3 py-1 rounded-full border border-[#153c76]/20">
                  {user?.matricula || 'Sin matrícula'}
                </span>
              </div>

              {/* Name */}
              <h2 className="font-heading font-bold text-xl text-[#0F2D4F] text-center mb-1">
                {user?.firstName} {user?.lastName}
              </h2>

              {/* QR Button */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => showToast('Función QR no disponible en el demo', 'info')}
                  className="flex items-center gap-2 text-xs font-semibold text-[#2E7D32] border border-[#2E7D32]/30 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition"
                >
                  <i className="bi bi-qr-code" />
                  VER CODIGO QR
                </button>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-start gap-3">
                  <i className="bi bi-book text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Carrera</p>
                    <p className="text-sm font-medium text-gray-800">{user?.carrera || '—'}</p>
                    {user?.carreraCodigo && (
                      <p className="text-xs text-gray-400">{user.carreraCodigo}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="bi bi-envelope text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Correo Institucional</p>
                    <p className="text-sm font-medium text-gray-800 break-all">
                      {user?.correoInstitucional || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="bi bi-calendar3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Período Activo</p>
                    <p className="text-sm font-medium text-gray-800">
                      {user?.periodoActivo ? getPeriodoLabel(user.periodoActivo) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-5">
          {/* Otras Informaciones */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-heading font-bold text-[#0F2D4F] mb-4 flex items-center gap-2">
              <i className="bi bi-info-circle text-[#2E7D32]" />
              Otras Informaciones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Correo Personal</p>
                <p className="text-sm font-medium text-gray-800 break-all">
                  {user?.correoPersonal || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Teléfono</p>
                <p className="text-sm font-medium text-gray-800">{user?.telefono || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Celular</p>
                <p className="text-sm font-medium text-gray-800">{user?.celular || '—'}</p>
              </div>
            </div>
          </div>

          {/* Control de Comprobante Fiscal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-heading font-bold text-[#0F2D4F] mb-4 flex items-center gap-2">
              <i className="bi bi-receipt text-[#2E7D32]" />
              Control de comprobante fiscal
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">RNC</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">Tipo</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2">
                      Por Defecto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-400 text-sm">
                      <i className="bi bi-inbox text-2xl block mb-2" />
                      No se encontraron registros...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Solicitud de Documentos promo */}
          <div className="bg-gradient-to-r from-[#2E7D32]/10 to-[#153c76]/10 rounded-2xl border border-[#2E7D32]/20 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2E7D32] flex items-center justify-center flex-shrink-0">
                <i className="bi bi-file-earmark-text text-white text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-[#0F2D4F]">Solicitud de Documentos</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Solicita cartas universitarias, constancias y más. Descarga en digital el mismo
                  día.
                </p>
              </div>
              <Link
                href="/solicitud-documentos"
                className="flex-shrink-0 bg-[#2E7D32] hover:bg-[#1b5e20] text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <i className="bi bi-arrow-right" />
                Solicitar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => showToast('Función no disponible en el demo', 'info')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#2E7D32] hover:bg-[#1b5e20] text-white rounded-full shadow-xl flex items-center justify-center text-2xl transition z-50"
        title="Acciones rápidas"
      >
        <i className="bi bi-plus-lg" />
      </button>
    </div>
  )
}
