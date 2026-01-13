"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type Crumb = {
  label: string
  href: string
  current?: boolean
}

const routeTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/profile": "My Profile",
  "/admin/settings": "Settings",
  "/admin/tenants": "Tenants",
  "/admin/tenants/new": "New Tenant",
  "/admin/users": "All Users",
  "/admin/users/new": "New Super Admin",
  "/dashboard": "Dashboard",
  "/dashboard/pos": "POS",
  "/dashboard/sales": "Sales",
  "/dashboard/sales/new": "New Sale",
  "/dashboard/purchases": "Purchases",
  "/dashboard/purchases/new": "New Purchase",
  "/dashboard/expenses": "Expenses",
  "/dashboard/expenses/new": "New Expense",
  "/dashboard/expenses/categories": "Expense Categories",
  "/dashboard/expenses/categories/new": "New Expense Category",
  "/dashboard/reports": "Reports",
  "/dashboard/reservations": "Reservations",
  "/dashboard/reservations/new": "New Reservation",
  "/dashboard/menu": "Menu",
  "/dashboard/menu/new": "New Menu Item",
  "/dashboard/ingredients": "Ingredients",
  "/dashboard/ingredients/new": "New Ingredient",
  "/dashboard/ingredient-categories": "Ingredient Categories",
  "/dashboard/ingredient-categories/new": "New Ingredient Category",
  "/dashboard/stock": "Stock",
  "/dashboard/stock/stocktake": "Stocktake",
  "/dashboard/suppliers": "Suppliers",
  "/dashboard/suppliers/new": "New Supplier",
  "/dashboard/locations": "Locations",
  "/dashboard/locations/new": "New Location",
  "/dashboard/tables": "Tables",
  "/dashboard/tables/new": "New Table",
  "/dashboard/users": "Users",
  "/dashboard/users/invite": "Invite User",
  "/dashboard/settings": "Settings",
}

function titleFromSegment(segment: string) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return "Details"
  }
  const withSpaces = segment.replace(/[-_]/g, " ")
  return withSpaces.replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildCrumbs(pathname: string): { crumbs: Crumb[]; title: string } {
  if (pathname.startsWith("/admin")) {
    const segments = pathname.split("/").filter(Boolean)
    const adminIndex = segments.indexOf("admin")
    const subSegments = adminIndex === -1 ? [] : segments.slice(adminIndex + 1)

    const crumbs: Crumb[] = [{ label: "Admin", href: "/admin" }]
    let currentPath = "/admin"

    subSegments.forEach((seg) => {
      currentPath = `${currentPath}/${seg}`
      const label = routeTitles[currentPath] ?? titleFromSegment(seg)
      crumbs.push({ label, href: currentPath })
    })

    const last = crumbs.at(-1)
    if (last) last.current = true

    const title = last?.label ?? "Admin"
    return { crumbs, title }
  }

  if (!pathname.startsWith("/dashboard")) {
    return {
      crumbs: [{ label: "Dashboard", href: "/dashboard", current: true }],
      title: "Dashboard",
    }
  }

  const segments = pathname.split("/").filter(Boolean)
  const dashboardIndex = segments.indexOf("dashboard")
  const subSegments = dashboardIndex === -1 ? [] : segments.slice(dashboardIndex + 1)

  const crumbs: Crumb[] = [{ label: "Dashboard", href: "/dashboard" }]
  let currentPath = "/dashboard"

  subSegments.forEach((seg) => {
    currentPath = `${currentPath}/${seg}`
    const label = routeTitles[currentPath] ?? titleFromSegment(seg)
    crumbs.push({ label, href: currentPath })
  })

  const last = crumbs.at(-1)
  if (last) last.current = true

  const title = last?.label ?? "Dashboard"
  return { crumbs, title }
}

export function SiteHeader() {
  const pathname = usePathname()
  const { crumbs, title } = useMemo(() => buildCrumbs(pathname), [pathname])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1
              return (
                <span key={crumb.href} className="contents">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </span>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto truncate text-sm font-medium text-foreground">{title}</div>
      </div>
    </header>
  )
}
