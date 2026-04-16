import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id
        token.role     = (user as any).role
        token.cargo    = (user as any).cargo
        token.matricula = (user as any).matricula
        token.firstName = (user as any).firstName
        token.lastName  = (user as any).lastName
        token.correoInstitucional = (user as any).correoInstitucional
        token.carrera  = (user as any).carrera
        token.carreraCodigo = (user as any).carreraCodigo
        token.cedula   = (user as any).cedula
        token.periodoActivo = (user as any).periodoActivo
        token.celular  = (user as any).celular
        token.telefono = (user as any).telefono
        token.correoPersonal = (user as any).correoPersonal
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id       = token.id
        ;(session.user as any).role    = token.role
        ;(session.user as any).cargo   = token.cargo
        ;(session.user as any).matricula = token.matricula
        ;(session.user as any).firstName = token.firstName
        ;(session.user as any).lastName  = token.lastName
        ;(session.user as any).correoInstitucional = token.correoInstitucional
        ;(session.user as any).carrera  = token.carrera
        ;(session.user as any).carreraCodigo = token.carreraCodigo
        ;(session.user as any).cedula   = token.cedula
        ;(session.user as any).periodoActivo = token.periodoActivo
        ;(session.user as any).celular  = token.celular
        ;(session.user as any).telefono = token.telefono
        ;(session.user as any).correoPersonal = token.correoPersonal
        session.user.name = `${token.firstName} ${token.lastName}`
      }
      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Usuario' },
        password: { label: 'Contraseña', type: 'password' },
        loginType: { label: 'Login Type' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        const loginType = credentials.loginType as string
        if (loginType === 'admin' && user.role !== 'admin') return null
        if (loginType === 'student' && user.role !== 'student') return null
        return {
          id: String(user.id),
          name: `${user.firstName} ${user.lastName}`,
          email: user.correoInstitucional || undefined,
          role: user.role,
          cargo: user.cargo,
          matricula: user.matricula,
          firstName: user.firstName,
          lastName: user.lastName,
          correoInstitucional: user.correoInstitucional,
          carrera: user.carrera,
          carreraCodigo: user.carreraCodigo,
          cedula: user.cedula,
          periodoActivo: user.periodoActivo,
          celular: user.celular,
          telefono: user.telefono,
          correoPersonal: user.correoPersonal,
        } as any
      },
    }),
  ],
})
