import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth(function middleware(req: NextRequest & { auth: any }) {
  const session = req.auth
  const path = req.nextUrl.pathname

  // NextAuth API routes — ALWAYS pass through, never redirect
  // (signOut needs /api/auth/csrf even while logged in)
  if (path.startsWith('/api/auth') || path.startsWith('/api/') || path.startsWith('/_next/') || path === '/favicon.ico') {
    return NextResponse.next()
  }

  // Login pages — redirect to dashboard if already logged in
  if (path === '/login' || path === '/admin-login') {
    if (session?.user) {
      const role = session.user?.role
      if (role === 'admin') return NextResponse.redirect(new URL('/admin-panel', req.url))
      return NextResponse.redirect(new URL('/perfil', req.url))
    }
    return NextResponse.next()
  }

  // Protected: must be logged in
  if (!session?.user) {
    const loginUrl = path.startsWith('/admin') ? '/admin-login' : '/login'
    return NextResponse.redirect(new URL(loginUrl, req.url))
  }

  const role = session.user?.role

  // Admin-only
  if (path.startsWith('/admin-panel') && role !== 'admin') {
    return NextResponse.redirect(new URL('/perfil', req.url))
  }

  // Student-only
  if ((path.startsWith('/perfil') || path.startsWith('/solicitud-documentos')) && role === 'admin') {
    return NextResponse.redirect(new URL('/admin-panel', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
