import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Document types
  const docTypes = [
    { name: 'Carta Universitaria',       slug: 'carta-universitaria',       icon: '📜', price: 650,  deliveryDays: 0, autoPdf: true,  order: 1 },
    { name: 'Constancia de Estudios',    slug: 'constancia-estudios',       icon: '📋', price: 650,  deliveryDays: 0, autoPdf: true,  order: 2 },
    { name: 'Récord de Notas Oficial',   slug: 'record-notas',              icon: '📊', price: 850,  deliveryDays: 3, autoPdf: false, order: 3 },
    { name: 'Certificación de Graduación', slug: 'cert-graduacion',         icon: '🎓', price: 1200, deliveryDays: 5, autoPdf: false, order: 4 },
    { name: 'Pensum Aprobado',           slug: 'pensum-aprobado',           icon: '📄', price: 500,  deliveryDays: 3, autoPdf: false, order: 5 },
    { name: 'Certificado de Conducta',   slug: 'cert-conducta',             icon: '🏅', price: 450,  deliveryDays: 3, autoPdf: false, order: 6 },
    { name: 'Copia de Título',           slug: 'copia-titulo',              icon: '🏛',  price: 2500, deliveryDays: 7, autoPdf: false, order: 7 },
  ]

  for (const dt of docTypes) {
    await prisma.documentType.upsert({
      where: { slug: dt.slug },
      update: dt,
      create: dt,
    })
  }

  // Users
  const hash = (pw: string) => bcrypt.hashSync(pw, 10)

  const users = [
    { username: 'nr21-2021',   password: hash('Demo2026!'),  role: 'student', firstName: 'Noel',   lastName: 'Reyes de la Cruz', matricula: '21-2021',  carrera: 'Ingeniería en Sistemas Computacionales', carreraCodigo: '255/2-22-22', periodoActivo: '1-2026', cedula: '402-3456789-0', correoInstitucional: 'nr21-2021@unphu.edu.do', correoPersonal: 'noelreyes426@gmail.com', telefono: '829-929-8388', celular: '809-459-6174' },
    { username: 'estudiante2', password: hash('Demo2026!'),  role: 'student', firstName: 'María',  lastName: 'García López',     matricula: '22-0042',  carrera: 'Administración de Empresas',             carreraCodigo: '100/2-22-22', periodoActivo: '1-2026', cedula: '001-1234567-8', correoInstitucional: 'mg22-0042@unphu.edu.do', correoPersonal: 'maria.garcia@gmail.com' },
    { username: 'js22-0290',   password: hash('Demo2026!'),  role: 'student', firstName: 'Juan Antonio', lastName: 'Sanchez Florian', matricula: '22-0290', carrera: 'Ingeniería en Sistemas Computacionales', carreraCodigo: '255/2-22-22', periodoActivo: '1-2026', correoInstitucional: 'js22-0290@unphu.edu.do' },
    { username: 'jperez',      password: hash('Admin2026!'), role: 'admin',   firstName: 'José',   lastName: 'Pérez Herrera',    cargo: 'Coordinador de Registro' },
    { username: 'mgarcia',     password: hash('Admin2026!'), role: 'admin',   firstName: 'María',  lastName: 'García Ramos',     cargo: 'Analista Documental' },
    { username: 'rsantos',     password: hash('Admin2026!'), role: 'admin',   firstName: 'Ramón',  lastName: 'Santos Díaz',      cargo: 'Director de Registro' },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: u,
      create: u,
    })
  }

  // Sample requests
  const student = await prisma.user.findUnique({ where: { username: 'nr21-2021' } })
  const admin   = await prisma.user.findUnique({ where: { username: 'jperez' } })
  const carta   = await prisma.documentType.findUnique({ where: { slug: 'carta-universitaria' } })
  const record  = await prisma.documentType.findUnique({ where: { slug: 'record-notas' } })

  if (student && carta && record && admin) {
    const existing = await prisma.documentRequest.count({ where: { studentId: student.id } })
    if (existing === 0) {
      const r1 = await prisma.documentRequest.create({
        data: {
          code: 'DOC-20250112-0001',
          studentId: student.id,
          docTypeId: carta.id,
          copies: 1,
          purpose: 'personal',
          language: 'es',
          status: 'process',
          processedById: admin.id,
        },
      })
      await prisma.auditLog.createMany({
        data: [
          { requestId: r1.id, action: 'created',  icon: '📋', actor: student.username, note: 'Solicitud creada por el estudiante', userId: student.id },
          { requestId: r1.id, action: 'process',  icon: '⚙️', actor: admin.username,   note: 'Pago verificado, en revisión académica', userId: admin.id },
        ],
      })

      const r2 = await prisma.documentRequest.create({
        data: {
          code: 'DOC-20250110-0002',
          studentId: student.id,
          docTypeId: record.id,
          copies: 2,
          purpose: 'empleo',
          language: 'es',
          status: 'ready',
          processedById: admin.id,
        },
      })
      await prisma.auditLog.createMany({
        data: [
          { requestId: r2.id, action: 'created',  icon: '📋', actor: student.username, note: 'Solicitud creada',      userId: student.id },
          { requestId: r2.id, action: 'process',  icon: '⚙️', actor: admin.username,   note: 'En revisión',           userId: admin.id },
          { requestId: r2.id, action: 'approved', icon: '✅', actor: admin.username,   note: 'Aprobado y listo para retiro', userId: admin.id },
        ],
      })
    }
  }

  console.log('✅ Seed completado')
}

main().catch(console.error).finally(() => prisma.$disconnect())
