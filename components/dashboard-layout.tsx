'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingBag, 
  ShoppingCart, 
  DollarSign, 
  FileText,
  ChefHat,
  Calendar,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import type { User } from '@/types/database'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: User
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'manager', 'staff'] },
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['owner'] },
  { name: 'Ingredients', href: '/dashboard/ingredients', icon: Package, roles: ['owner', 'manager'] },
  { name: 'Stock', href: '/dashboard/stock', icon: Package, roles: ['owner', 'manager', 'staff'] },
  { name: 'Menu', href: '/dashboard/menu', icon: ShoppingBag, roles: ['owner', 'manager'] },
  { name: 'Purchases', href: '/dashboard/purchases', icon: ShoppingCart, roles: ['owner', 'manager', 'staff'] },
  { name: 'Sales', href: '/dashboard/sales', icon: DollarSign, roles: ['owner', 'manager', 'staff'] },
  { name: 'Expenses', href: '/dashboard/expenses', icon: FileText, roles: ['owner', 'manager'] },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText, roles: ['owner', 'manager'] },
  { name: 'Reservations', href: '/dashboard/reservations', icon: Calendar, roles: ['owner', 'manager'] },
]

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user.role as any)
  )

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold">Kitchen System</h1>
            <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t space-y-2">
            <button
              onClick={() => router.push('/kds')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ChefHat size={20} />
              <span>Kitchen Display</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-accent"
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user.full_name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
