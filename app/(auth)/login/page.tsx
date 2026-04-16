'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
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
        loginType: 'student',
        redirect: false,
      })
      if (res?.error || res?.ok === false) {
        setError('Usuario o contraseña incorrectos. Verifique sus datos.')
        setLoading(false)
      } else {
        // Hard redirect so the session cookie is fully available
        window.location.href = '/perfil'
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
          backgroundColor: '#2E7D32',
          backgroundImage:
            'url(https://estudiantes.unphusist.unphu.edu.do/assets/img/Background-green.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <img
          src="https://estudiantes.unphusist.unphu.edu.do/assets/img/unphusist-logo.svg"
          alt="UNPHU SIST"
          className="w-44 brightness-0 invert"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
        <div className="border-l-4 border-white pl-5">
          <h1 className="font-heading font-bold text-5xl leading-tight mb-3">
            Acceso
            <br />
            Estudiantes
          </h1>
          <p className="text-white/80 text-lg mb-6">Portal Académico Estudiantil</p>
          <ul className="space-y-3 text-white/90">
            {[
              'Consulta tu perfil académico',
              'Solicita documentos oficiales',
              'Descarga en formato digital',
            ].map(t => (
              <li key={t} className="flex items-center gap-2">
                <i className="bi bi-check-circle-fill text-green-300" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-white/40 text-sm">Universidad Nacional Pedro Henríquez Ureña</p>
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
              <span className="font-heading font-black text-4xl text-[#439441]">UNPHU</span>
              <div className="flex justify-end mt-1">
                <span className="border-2 border-[#153c76] text-[#153c76] text-xs font-bold px-2 py-0.5 rounded font-heading">
                  SIST
                </span>
              </div>
            </div>
          </div>

          <h2 className="font-heading font-bold text-xl text-[#0F2D4F] mb-1">Iniciar Sesión</h2>
          <p className="text-gray-500 text-sm mb-5">Sistema de Gestión Académica</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5 mb-4">
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Usuario</label>
              <div className="relative">
                <i className="bi bi-person absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="ej. nr21-2021"
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]/30 transition"
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
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]/30 transition"
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
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Recordarme
              </label>
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                ¿Olvidaste tu contraseña?
              </span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1b5e20] text-white font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="bi bi-arrow-repeat animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
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
                <div className="font-mono">nr21-2021 / Demo2026!</div>
                <div className="font-mono">estudiante2 / Demo2026!</div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t text-center text-sm text-gray-500">
            ¿Eres personal de Registro?{' '}
            <Link href="/admin-login" className="text-[#153c76] font-semibold hover:underline">
              Acceso Administrativo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
