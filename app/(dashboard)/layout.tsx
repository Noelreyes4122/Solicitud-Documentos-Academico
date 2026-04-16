import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Providers } from '@/components/ui/Providers'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <Providers session={session}>
      <AppLayout user={session.user}>{children}</AppLayout>
    </Providers>
  )
}
