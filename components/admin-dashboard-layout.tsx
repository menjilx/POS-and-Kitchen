'use client'

import type { CSSProperties, ReactNode } from 'react'

import { SiteHeader } from '@/components/site-header'
import { AdminSidebar } from '@/components/admin-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function AdminDashboardLayout({ children, email }: { children: ReactNode; email?: string | null }) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing, 0.25rem) * 72)',
          '--header-height': 'calc(var(--spacing, 0.25rem) * 12)',
        } as CSSProperties
      }
    >
      <AdminSidebar email={email} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">{children}</div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

