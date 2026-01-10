import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Shield, Building2, Users, Settings, LogOut, Menu, ChevronLeft, ChevronRight } from 'lucide-react'

async function getSuperAdminStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { isSuperAdmin: false, user: null }
  }
  
  const { data: isSuperAdmin } = await supabase.rpc('is_superadmin')
  return { isSuperAdmin: isSuperAdmin === true, user }
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSuperAdmin, user } = await getSuperAdminStatus()

  if (!isSuperAdmin || !user) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <aside
        className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-xl font-bold">Super Admin</h1>
                <p className="text-xs text-slate-400">System Administration</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavLink href="/admin" icon={Menu} label="Dashboard" />
            <NavLink href="/admin/tenants" icon={Building2} label="Tenants" />
            <NavLink href="/admin/users" icon={Users} label="All Users" />
            <NavLink href="/admin/settings" icon={Settings} label="Settings" />
          </nav>

          <div className="p-4 border-t border-slate-700 space-y-2">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-left"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </form>
            <a
              href="/dashboard"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-left text-sm text-slate-400"
            >
              <ChevronLeft size={16} />
              <span>Back to App</span>
            </a>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Admin Access</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
    >
      <Icon size={20} />
      <span>{label}</span>
    </a>
  )
}
