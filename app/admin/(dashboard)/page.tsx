'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, Building2, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface Tenant {
  id: string
  name: string
  email: string
  user_count: number
  total_sales: number
  is_suspended: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color?: string
}

function StatCard({ title, value, subtitle, icon: Icon, color = 'bg-slate-100' }: StatCardProps) {
  return (
    <Link href="#" className="block">
      <div className={`${color} rounded-lg p-6 hover:shadow-md transition-shadow`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <Icon size={40} className="text-slate-600" />
        </div>
      </div>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalSales: 0,
    suspendedTenants: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [tenantsData, usersData] = await Promise.all([
        supabase.rpc('get_all_tenants'),
        supabase.from('users').select('id', { count: 'exact' }),
      ])

      if (tenantsData.error) throw tenantsData.error
      if (usersData.error) throw usersData.error

      const tenants = tenantsData.data || []
      const suspendedCount = tenants.filter((t: Tenant) => t.is_suspended).length
      const totalSales = tenants.reduce((sum: number, t: Tenant) => sum + (Number(t.total_sales) || 0), 0)

      setStats({
        totalTenants: tenants.length,
        totalUsers: usersData.count || 0,
        totalSales,
        suspendedTenants: suspendedCount,
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide overview and management</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Tenants"
              value={stats.totalTenants}
              subtitle={`${stats.suspendedTenants} suspended`}
              icon={Building2}
              color="bg-blue-50"
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              color="bg-green-50"
            />
            <StatCard
              title="Total Sales"
              value={`$${stats.totalSales.toLocaleString()}`}
              subtitle="All time"
              icon={DollarSign}
              color="bg-purple-50"
            />
            <StatCard
              title="Suspended"
              value={stats.suspendedTenants}
              subtitle="Tenants"
              icon={AlertTriangle}
              color="bg-red-50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/tenants/new"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Add New Tenant</p>
                    <p className="text-sm text-muted-foreground">Create a new restaurant account</p>
                  </div>
                </Link>
                <Link
                  href="/admin/users/new"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Users size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Add Super Admin</p>
                    <p className="text-sm text-muted-foreground">Promote a user to superadmin</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Database</span>
                  <span className="text-green-700 font-medium">Connected</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Authentication</span>
                  <span className="text-green-700 font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">SuperAdmin Role</span>
                  <span className="text-blue-700 font-medium">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
