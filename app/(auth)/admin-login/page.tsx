'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        username,
        password,
        loginType: 'admin',
        redirect: false,
      })
      if (res?.error || res?.ok === false) {
        setError('Credenciales inválidas o sin permisos de administrador.')
        setLoading(false)
      } else {
        window.location.href = '/admin-panel'
      }
    } catch {
      setError('Error de conexión. Intente de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* LEFT */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 text-white flex-1 relative"
        style={{
          backgroundColor: '#0F2D4F',
          backgroundImage:
            'url(https://estudiantes.unphusist.unphu.edu.do/assets/img/Background-green.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark navy overlay */}
        <div className="absolute inset-0 bg-[#0F2D4F]/80" />
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3">
            <img
              src="https://estudiantes.unphusist.unphu.edu.do/assets/img/unphusist-logo.svg"
              alt="UNPHU SIST"
              className="w-44 brightness-0 invert"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
              Área Restringida
            </span>
          </div>

          <div className="border-l-4 border-blue-400 pl-5">
            <h1 className="font-heading font-bold text-5xl leading-tight mb-3">
              Acceso
              <br />
              Administrativo
            </h1>
            <p className="text-white/80 text-lg mb-6">
              Panel de Gestión — Oficina de Registro
            </p>
            <ul className="space-y-3 text-white/90">
              {[
                { icon: 'bi-person-badge', label: 'Personal de Registro' },
                { icon: 'bi-shield-check', label: 'Coordinadores Académicos' },
                { icon: 'bi-building', label: 'Personal Administrativo' },
              ].map(item => (
                <li key={item.label} className="flex items-center gap-2">
                  <i className={`bi ${item.icon} text-blue-300`} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-white/40 text-sm">Universidad Nacional Pedro Henríquez Ureña</p>
        </div>
      </div>

      {/* RIGHT */}
      <div
        className="w-full lg:w-[520px] flex items-center justify-center p-6 flex-shrink-0"
        style={{
          backgroundColor: '#f7faff',
          backgroundImage:
            'url(https://estudiantes.unphusist.unphu.edu.do/assets/img/Trazado.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="https://estudiantes.unphusist.unphu.edu.do/assets/img/unphusist-logo.svg"
              alt="UNPHU SIST"
              className="h-14"
              onError={e => {
                e.currentTarget.style.display = 'none'
                const next = e.currentTarget.nextElementSibling as HTMLElement
                if (next) next.style.display = 'block'
              }}
            />
            <div className="hidden text-center">
              <span className="font-heading font-black text-4xl text-[#153c76]">UNPHU</span>
              <div className="flex justify-end mt-1">
                <span className="border-2 border-[#153c76] text-[#153c76] text-xs font-bold px-2 py-0.5 rounded font-heading">
                  SIST
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-heading font-bold text-xl text-[#0F2D4F]">
              Acceso Administrativo
            </h2>
            <span className="bg-[#0F2D4F]/10 text-[#0F2D4F] text-xs font-bold px-2 py-0.5 rounded">
              Admin
            </span>
          </div>
          <p className="text-gray-500 text-sm mb-5">Oficina de Registro — UNPHU</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5 mb-4">
              <i className="bi bi-shield-exclamation" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Usuario Administrativo
              </label>
              <div className="relative">
                <i className="bi bi-person-badge absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="ej. admin01"
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#153c76] focus:ring-1 focus:ring-[#153c76]/30 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <i className="bi bi-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#153c76] focus:ring-1 focus:ring-[#153c76]/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i className={`bi bi-eye${showPw ? '-slash' : ''}`} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0F2D4F] hover:bg-[#153c76] text-white font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="bi bi-arrow-repeat animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-lock" />
                  Ingresar al Panel
                </>
              )}
            </button>
          </form>

          <div className="mt-4">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <i className={`bi bi-chevron-${showDemo ? 'up' : 'down'}`} />
              Credenciales demo
            </button>
            {showDemo && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                <div className="font-mono">admin01 / Admin2026!</div>
                <div className="font-mono">registradora1 / Admin2026!</div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t text-center text-sm text-gray-500">
            ¿Eres estudiante?{' '}
            <Link href="/login" className="text-[#2E7D32] font-semibold hover:underline">
              ← Acceso Estudiantil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
