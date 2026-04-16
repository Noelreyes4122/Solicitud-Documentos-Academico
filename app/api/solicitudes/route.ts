import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCode } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  const requests = await prisma.documentRequest.findMany({
    where: { studentId: userId },
    include: { docType: true, auditLogs: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  try {
    const body = await req.json()
    const { docTypeId, copies, purpose, language, institution, observations } = body
    if (!docTypeId || !purpose) return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })

    const docType = await prisma.documentType.findUnique({ where: { id: parseInt(docTypeId) } })
    if (!docType) return NextResponse.json({ error: 'Tipo de documento no encontrado' }, { status: 404 })

    // Same-day cutoff logic (10 AM DR time, UTC-4)
    const now = new Date()
    const hourDR = now.getUTCHours() - 4
    const isBeforeCutoff = hourDR < 10
    let estimatedDate = new Date()
    if (docType.deliveryDays === 0) {
      if (!isBeforeCutoff) estimatedDate.setDate(estimatedDate.getDate() + 1)
    } else {
      estimatedDate.setDate(estimatedDate.getDate() + docType.deliveryDays)
    }

    const request = await prisma.documentRequest.create({
      data: {
        code: generateCode(),
        studentId: userId,
        docTypeId: parseInt(docTypeId),
        copies: parseInt(copies) || 1,
        purpose,
        language: language || 'es',
        institution: institution || null,
        observations: observations || null,
        status: 'pending',
      },
      include: { docType: true, auditLogs: true },
    })

    await prisma.auditLog.create({
      data: {
        requestId: request.id,
        action: 'created',
        icon: '📋',
        actor: (session.user as any).matricula || session.user.name || 'Estudiante',
        note: 'Solicitud creada por el estudiante',
        userId,
      },
    })

    const full = await prisma.documentRequest.findUnique({
      where: { id: request.id },
      include: { docType: true, auditLogs: { orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json(full, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error al crear solicitud' }, { status: 500 })
  }
}
