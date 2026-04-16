import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const where: any = {}
  if (status && status !== 'all') where.status = status
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { student: { firstName: { contains: search } } },
      { student: { lastName: { contains: search } } },
      { student: { matricula: { contains: search } } },
    ]
  }

  const requests = await prisma.documentRequest.findMany({
    where,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, matricula: true, cedula: true, carrera: true, correoInstitucional: true } },
      docType: true,
      auditLogs: { orderBy: { createdAt: 'asc' } },
      processedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requests)
}
