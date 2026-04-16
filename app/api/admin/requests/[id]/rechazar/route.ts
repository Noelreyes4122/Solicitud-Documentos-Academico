import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const adminId = parseInt((session.user as any).id)
  const adminName = `${(session.user as any).firstName} ${(session.user as any).lastName}`

  const body = await req.json()
  const { reason, observations } = body
  const adminNotes = [reason, observations].filter(Boolean).join(' — ')

  const updated = await prisma.documentRequest.update({
    where: { id: parseInt(id) },
    data: { status: 'rejected', adminNotes, processedById: adminId },
  })

  await prisma.auditLog.create({
    data: {
      requestId: updated.id,
      action: 'rejected',
      icon: '❌',
      actor: adminName,
      note: `Solicitud rechazada: ${reason || 'Sin razón especificada'}`,
      userId: adminId,
    },
  })

  return NextResponse.json(updated)
}
