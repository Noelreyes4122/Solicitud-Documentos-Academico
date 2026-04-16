import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UNPHU SIST — Portal Estudiantil',
  description: 'Sistema de Gestión Académica — Universidad Nacional Pedro Henríquez Ureña',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      </head>
      <body className="h-full">{children}</body>
    </html>
  )
}
