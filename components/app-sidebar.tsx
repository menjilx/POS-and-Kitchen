"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Calendar,
  ChefHat,
  CircleHelp,
  DollarSign,
  FileText,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Users,
} from "lucide-react"

import type { User as AppUser } from "@/types/database"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { NavUser } from "@/components/nav-user"
import { useTenantSettings } from "@/hooks/use-tenant-settings"
import { supabase } from "@/lib/supabase/client"
import { buildPermissionsByRole, PERMISSIONS, Permission } from "@/lib/permissions"

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  permission: Permission
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        permission: PERMISSIONS.VIEW_DASHBOARD,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "POS",
        url: "/dashboard/pos",
        icon: ShoppingCart,
        permission: PERMISSIONS.OPERATIONS_POS,
      },
      {
        title: "Sales",
        url: "/dashboard/sales",
        icon: DollarSign,
        permission: PERMISSIONS.OPERATIONS_SALES,
      },
      {
        title: "Reservations",
        url: "/dashboard/reservations",
        icon: Calendar,
        permission: PERMISSIONS.OPERATIONS_RESERVATIONS,
      },
      {
        title: "Customers",
        url: "/dashboard/customers",
        icon: Users,
        permission: PERMISSIONS.OPERATIONS_CUSTOMERS,
      },
    ],
  },
  {
    label: "Menu",
    items: [
      {
        title: "Menu",
        url: "/dashboard/menu",
        icon: ShoppingBag,
        permission: PERMISSIONS.MENU_ITEMS,
      },
      {
        title: "Items",
        url: "/dashboard/items",
        icon: Package,
        permission: PERMISSIONS.MENU_ITEMS,
      },
      {
        title: "Tables",
        url: "/dashboard/tables",
        icon: Building2,
        permission: PERMISSIONS.MENU_TABLES,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        title: "Stock Items",
        url: "/dashboard/ingredients",
        icon: Package,
        permission: PERMISSIONS.INVENTORY_INGREDIENTS,
      },
      {
        title: "Stock Levels",
        url: "/dashboard/stock",
        icon: Package,
        permission: PERMISSIONS.INVENTORY_STOCK,
      },
      {
        title: "Purchases",
        url: "/dashboard/purchases",
        icon: ShoppingCart,
        permission: PERMISSIONS.INVENTORY_PURCHASES,
      },
      {
        title: "Suppliers",
        url: "/dashboard/suppliers",
        icon: Truck,
        permission: PERMISSIONS.INVENTORY_SUPPLIERS,
      },
      {
        title: "Locations",
        url: "/dashboard/locations",
        icon: MapPin,
        permission: PERMISSIONS.INVENTORY_LOCATIONS,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Expenses",
        url: "/dashboard/expenses",
        icon: FileText,
        permission: PERMISSIONS.FINANCE_EXPENSES,
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: FileText,
        permission: PERMISSIONS.FINANCE_REPORTS,
      },
      {
        title: "Register Sessions",
        url: "/dashboard/reports/registers",
        icon: FileText,
        permission: PERMISSIONS.FINANCE_REGISTER_SESSIONS,
      },
    ],
  },
  {
    label: "Configuration",
    items: [
      {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
        permission: PERMISSIONS.CONFIG_USERS,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: SlidersHorizontal,
        permission: PERMISSIONS.CONFIG_SETTINGS,
      },
    ],
  },
]

export function AppSidebar({
  user,
  tenantName,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: AppUser
  tenantName: string
}) {
  const pathname = usePathname()
  const { settings, loading } = useTenantSettings()
  const menuEnabled = loading ? true : (settings.features?.menu ?? true)
  const [permissionsByRole, setPermissionsByRole] = React.useState(() => buildPermissionsByRole())

  React.useEffect(() => {
    let active = true
    const loadPermissions = async () => {
      const { data } = await supabase
        .from('role_permissions')
        .select('role, permissions')
        .eq('tenant_id', user.tenant_id)

      if (!active) return
      setPermissionsByRole(buildPermissionsByRole(data ?? []))
    }

    if (user?.tenant_id) {
      loadPermissions()
    }

    return () => {
      active = false
    }
  }, [user?.tenant_id])

  const userPermissions = user.role === 'superadmin'
    ? Object.values(PERMISSIONS)
    : (permissionsByRole[user.role] ?? [])

  const canAccess = (permission: Permission) => {
    if (user.role === 'superadmin') return true
    return userPermissions.includes(permission)
  }

  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ChefHat className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{tenantName}</span>
                  <span className="truncate text-xs">Kitchen System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups
          .filter((group) => (menuEnabled ? true : group.label !== "Menu"))
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => canAccess(item.permission)),
          }))
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive =
                      item.url === "/dashboard"
                        ? pathname === item.url
                        : pathname === item.url || pathname.startsWith(item.url + "/")

                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Get Help">
              <Link href="/dashboard/help">
                <CircleHelp />
                <span>Get Help</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Kitchen Display">
              <Link href="/dashboard/settings?tab=kds">
                <ChefHat />
                <span>Kitchen Display</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <NavUser
          user={{
            name: user.full_name || user.email.split("@")[0] || "User",
            email: user.email,
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
