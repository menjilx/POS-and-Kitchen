import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { fixProfile, signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="max-w-md w-full p-8 bg-card border rounded-lg shadow-sm">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-red-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            </div>
            <h1 className="text-xl font-bold text-card-foreground">Account Setup Incomplete</h1>
            <p className="text-muted-foreground text-sm">
              We authenticated your account ({user.email}), but your user profile is missing from our database. This usually happens if the signup process was interrupted.
            </p>
            <form action={fixProfile.bind(null, user.id, user.email || '')} className="w-full pt-2">
               <Button type="submit" className="w-full" variant="default">
                 Complete Account Setup
               </Button>
            </form>
            <form action={signOut} className="w-full">
               <Button type="submit" variant="ghost" className="w-full">
                 Sign Out
               </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Fetch app name and subtitle from app_settings
  const { data: appSettings } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['app_name', 'app_subtitle'])

  const settingsMap = new Map(appSettings?.map(r => [r.key, r.value]) ?? [])
  const appName = settingsMap.get('app_name') ?? 'Kitchen System'
  const appSubtitle = settingsMap.get('app_subtitle') ?? 'Kitchen System'

  return (
    <DashboardLayout user={userData} appName={appName} appSubtitle={appSubtitle}>
      {children}
    </DashboardLayout>
  )
}
