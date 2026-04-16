import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const adminId = parseInt((session.user as any).id)
  const adminName = `${(session.user as any).firstName} ${(session.user as any).lastName}`

  const updated = await prisma.documentRequest.update({
    where: { id: parseInt(id) },
    data: { status: 'ready', processedById: adminId },
  })

  await prisma.auditLog.create({
    data: {
      requestId: updated.id,
      action: 'approved',
      icon: '✅',
      actor: adminName,
      note: 'Solicitud aprobada — documento listo para retiro',
      userId: adminId,
    },
  })

  return NextResponse.json(updated)
}
