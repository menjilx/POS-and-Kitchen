'use client'

import type { CSSProperties, ReactNode } from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import type { User } from '@/types/database'

interface DashboardLayoutProps {
  children: ReactNode
  user: User
  appName: string
}

export default function DashboardLayout({ children, user, appName }: DashboardLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing, 0.25rem) * 72)",
          "--header-height": "calc(var(--spacing, 0.25rem) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar user={user} appName={appName} variant="inset" />
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
