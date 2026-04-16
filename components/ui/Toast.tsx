'use client'
import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'default'
interface ToastItem { id: number; msg: string; type: ToastType }
interface ToastCtx { showToast: (msg: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ showToast: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((msg: string, type: ToastType = 'default') => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200)
  }, [])

  const colors: Record<ToastType, string> = {
    success: 'bg-green-700',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    default: 'bg-gray-700',
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-anim ${colors[t.type]} text-white text-sm font-medium px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 max-w-xs`}
          >
            {t.type === 'success' && <i className="bi bi-check-circle-fill" />}
            {t.type === 'error' && <i className="bi bi-x-circle-fill" />}
            {t.type === 'info' && <i className="bi bi-info-circle-fill" />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
