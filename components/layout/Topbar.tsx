'use client'
import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface Props {
  user: any
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function Topbar({ user, sidebarCollapsed, onToggleSidebar }: Props) {
  const [dd, setDd] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const isAdmin = user?.role === 'admin'
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  // Only attach the listener while the dropdown is open
  useEffect(() => {
    if (!dd) return
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDd(false)
      }
    }
    // Defer by one tick so the click that opened the menu doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', handler)
    }
  }, [dd])

  function handleSignOut() {
    setDd(false)
    signOut({ callbackUrl: isAdmin ? '/admin-login' : '/login' })
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 h-14 z-[300] flex items-center px-4 gap-4"
      style={{ background: 'linear-gradient(90deg, #2E7D32 0%, #1a5c1e 30%, #153c76 70%, #0F2D4F 100%)' }}
    >
      <button
        onClick={onToggleSidebar}
        className="text-white/70 hover:text-white text-xl w-8 flex-shrink-0"
      >
        <i className={`bi bi-${sidebarCollapsed ? 'list' : 'layout-sidebar-reverse'}`} />
      </button>

      <span className="font-heading font-black text-white text-lg tracking-tight select-none">
        UNPHU{' '}
        <span className="text-green-300 text-sm border border-green-300 rounded px-1 ml-1">SIST</span>
      </span>

      <div className="flex-1" />

      {/* User dropdown */}
      <div className="relative" ref={dropRef}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setDd(prev => !prev)}
          className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium px-3 py-1.5 rounded-full hover:bg-white/10 transition"
        >
          <div className="w-7 h-7 rounded-full bg-white/25 border border-white/30 flex items-center justify-center text-xs font-bold text-white select-none">
            {initials || <i className="bi bi-person" />}
          </div>
          <span className="hidden sm:block max-w-[160px] truncate">
            {user?.firstName} {user?.lastName}
          </span>
          <i className={`bi bi-chevron-${dd ? 'up' : 'down'} text-xs text-white/50`} />
        </button>

        {/* Dropdown panel */}
        {dd && (
          <div
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-100 shadow-2xl"
            style={{ zIndex: 9999 }}
          >
            {/* User info */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 rounded-t-xl">
              <p className="text-xs font-bold text-gray-800 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.correoInstitucional || user?.matricula || user?.cargo}
              </p>
            </div>

            {!isAdmin && (
              <Link
                href="/perfil"
                onClick={() => setDd(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <i className="bi bi-person-circle text-gray-400 text-base" />
                Mi Perfil
              </Link>
            )}

            {!isAdmin && (
              <Link
                href="/solicitud-documentos"
                onClick={() => setDd(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <i className="bi bi-file-earmark-text text-gray-400 text-base" />
                Solicitud de Documentos
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin-panel"
                onClick={() => setDd(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <i className="bi bi-shield-check text-gray-400 text-base" />
                Panel Administrativo
              </Link>
            )}

            <div className="border-t border-gray-100" />

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-medium rounded-b-xl"
            >
              <i className="bi bi-box-arrow-right text-base" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
