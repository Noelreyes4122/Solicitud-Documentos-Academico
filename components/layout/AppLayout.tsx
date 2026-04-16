'use client'
import { useState } from 'react'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'

interface Props {
  children: React.ReactNode
  user: any
}

export function AppLayout({ children, user }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = user?.role === 'admin'
  const sidebarW = collapsed ? 'pl-16' : 'pl-56'

  return (
    <>
      <Topbar
        user={user}
        sidebarCollapsed={collapsed}
        onToggleSidebar={() => setCollapsed(p => !p)}
      />
      <Sidebar collapsed={collapsed} isAdmin={isAdmin} />
      <main className={`pt-14 ${sidebarW} min-h-screen transition-all duration-300`}>
        <div className="p-6">{children}</div>
      </main>
      <footer
        className={`${sidebarW} transition-all duration-300 bg-[#0F2D4F] text-white/70 text-center text-xs py-3`}
      >
        UNPHU © Todos los derechos reservados {new Date().getFullYear()}
      </footer>
    </>
  )
}
