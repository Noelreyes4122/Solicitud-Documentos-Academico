'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Props {
  collapsed: boolean
  isAdmin: boolean
}

const STUDENT_LINKS = [
  { icon: 'bi-person-circle', label: 'Perfil', href: '/perfil' },
  { icon: 'bi-calendar3-range', label: 'Selección', href: null },
  { icon: 'bi-journal-bookmark', label: 'Mi pensum', href: null },
  { icon: 'bi-bar-chart-line', label: 'Historial de calificaciones', href: null },
  { icon: 'bi-arrow-counterclockwise', label: 'Retiros', href: null },
  { icon: 'bi-receipt', label: 'Recibos', href: null },
  { icon: 'bi-credit-card', label: 'Pago', href: null },
  { icon: 'bi-graph-up', label: 'Reportes', href: null, chevron: true },
  { icon: 'bi-mortarboard', label: 'Solicitud de graduación', href: null },
]

export function Sidebar({ collapsed, isAdmin }: Props) {
  const path = usePathname()
  const { showToast } = useToast()

  if (isAdmin) {
    return (
      <aside
        className={`fixed top-14 left-0 bottom-0 bg-white border-r border-gray-200 z-[200] transition-all duration-300 flex flex-col ${collapsed ? 'w-16' : 'w-56'} overflow-hidden`}
      >
        <div className="p-3 flex-1">
          <Link
            href="/admin-panel"
            className={`sidebar-link ${path === '/admin-panel' ? 'active' : ''}`}
          >
            <i className="bi bi-shield-check text-base flex-shrink-0" />
            {!collapsed && <span>Panel Administrativo</span>}
          </Link>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 bg-white border-r border-gray-200 z-[200] transition-all duration-300 flex flex-col ${collapsed ? 'w-16' : 'w-56'} overflow-y-auto overflow-x-hidden`}
    >
      <div className="p-3 flex-1 space-y-0.5">
        {STUDENT_LINKS.map(link =>
          link.href ? (
            <Link
              key={link.label}
              href={link.href}
              className={`sidebar-link ${path === link.href ? 'active' : ''}`}
            >
              <i className={`bi ${link.icon} text-base flex-shrink-0`} />
              {!collapsed && (
                <>
                  <span className="flex-1">{link.label}</span>
                  {link.chevron && <i className="bi bi-chevron-right text-xs text-gray-300" />}
                </>
              )}
            </Link>
          ) : (
            <button
              key={link.label}
              onClick={() => showToast('Esta función no está disponible en el demo', 'info')}
              className="sidebar-link w-full text-left"
            >
              <i className={`bi ${link.icon} text-base flex-shrink-0`} />
              {!collapsed && (
                <>
                  <span className="flex-1 opacity-60">{link.label}</span>
                  {link.chevron && <i className="bi bi-chevron-right text-xs text-gray-300" />}
                </>
              )}
            </button>
          )
        )}

        {!collapsed && (
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Documentos
          </div>
        )}
        <Link
          href="/solicitud-documentos"
          className={`sidebar-link highlighted ${path === '/solicitud-documentos' ? 'active' : ''}`}
        >
          <i className="bi bi-file-earmark-text text-base flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">Solicitud de Documentos</span>
              <span className="text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                NEW
              </span>
            </>
          )}
        </Link>

        {!collapsed && (
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Otros
          </div>
        )}
        <button
          onClick={() => showToast('Esta función no está disponible en el demo', 'info')}
          className="sidebar-link w-full text-left"
        >
          <i className="bi bi-check2-square text-base flex-shrink-0 opacity-60" />
          {!collapsed && (
            <span className="flex-1 opacity-60">
              Asistencia <i className="bi bi-box-arrow-up-right text-xs ml-1" />
            </span>
          )}
        </button>
        <button
          onClick={() => showToast('Esta función no está disponible en el demo', 'info')}
          className="sidebar-link w-full text-left"
        >
          <i className="bi bi-calendar-week text-base flex-shrink-0 opacity-60" />
          {!collapsed && (
            <span className="flex-1 opacity-60">
              Calendario Académico <i className="bi bi-box-arrow-up-right text-xs ml-1" />
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
