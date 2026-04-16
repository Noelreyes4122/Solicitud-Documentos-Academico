import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { getPeriodoLabel } from '@/lib/utils'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = parseInt((session.user as any).id)

  const req = await prisma.documentRequest.findUnique({
    where: { id: parseInt(id) },
    include: { docType: true, student: true },
  })

  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.studentId !== userId && (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Generate PDF
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const green = rgb(0.18, 0.49, 0.20)
  const navy = rgb(0.08, 0.24, 0.46)
  const black = rgb(0, 0, 0)

  // Header bar
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: green })
  page.drawText('UNIVERSIDAD NACIONAL PEDRO HENRÍQUEZ UREÑA', { x: 40, y: height - 35, size: 13, font: fontBold, color: rgb(1,1,1) })
  page.drawText('UNPHU SIST — Sistema de Gestión Académica', { x: 40, y: height - 55, size: 9, font, color: rgb(0.9,0.9,0.9) })

  // Title
  page.drawText(req.docType.name.toUpperCase(), { x: 40, y: height - 120, size: 18, font: fontBold, color: navy })
  page.drawLine({ start: { x: 40, y: height - 130 }, end: { x: width - 40, y: height - 130 }, thickness: 1.5, color: green })

  // Date
  const now = new Date()
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const dateStr = `Santo Domingo, D.N., ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`
  page.drawText(dateStr, { x: 40, y: height - 160, size: 10, font, color: black })

  // Body
  const student = req.student
  const fullName = `${student.firstName} ${student.lastName}`
  const periodoLabel = getPeriodoLabel(student.periodoActivo)

  const bodyLines = [
    'La Dra. Milagros Féliz Féliz, Rectora de la Universidad Nacional Pedro Henríquez',
    'Ureña, CERTIFICA que el/la estudiante:',
    '',
    fullName.toUpperCase(),
    '',
    `Titular de la Cédula de Identidad y Electoral No. ${student.cedula || 'N/D'},`,
    `se encuentra debidamente matriculado/a en esta institución en la carrera de:`,
    '',
    `${student.carrera || 'N/D'} (${student.carreraCodigo || 'N/D'})`,
    '',
    `Correspondiente al período académico ${periodoLabel}.`,
    '',
    'Esta certificación se expide a solicitud de la parte interesada para los fines',
    'que estime convenientes.',
  ]

  let y = height - 200
  for (const line of bodyLines) {
    const isBold = line === fullName.toUpperCase() || line.includes('CERTIFICA')
    page.drawText(line, { x: 40, y, size: 11, font: isBold ? fontBold : font, color: black })
    y -= 20
  }

  // Signature
  y -= 40
  page.drawLine({ start: { x: 200, y }, end: { x: 400, y }, thickness: 1, color: black })
  page.drawText('Dra. Milagros Féliz Féliz', { x: 210, y: y - 15, size: 10, font: fontBold, color: black })
  page.drawText('Rectora', { x: 260, y: y - 28, size: 10, font, color: black })

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 50, color: navy })
  page.drawText(`Código de verificación: ${req.code}`, { x: 40, y: 28, size: 8, font, color: rgb(0.9,0.9,0.9) })
  page.drawText('UNPHU © Todos los derechos reservados', { x: 40, y: 14, size: 8, font, color: rgb(0.7,0.7,0.7) })

  const pdfBytes = await pdfDoc.save()
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${req.code}.pdf"`,
    },
  })
}
