import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = parseInt((session.user as any).id)
  const role = (session.user as any).role

  const request = await prisma.documentRequest.findUnique({
    where: { id: parseInt(id) },
    include: {
      docType: true,
      student: { select: { id: true, firstName: true, lastName: true, matricula: true, cedula: true, carrera: true, carreraCodigo: true, correoInstitucional: true, periodoActivo: true } },
      auditLogs: { orderBy: { createdAt: 'asc' } },
      processedBy: { select: { firstName: true, lastName: true, cargo: true } },
    },
  })

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (role !== 'admin' && request.studentId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(request)
}
