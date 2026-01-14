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

import type { User as AppUser, UserRole } from "@/types/database"
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

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
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
        roles: ["owner", "manager", "staff"],
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
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Sales",
        url: "/dashboard/sales",
        icon: DollarSign,
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Reservations",
        url: "/dashboard/reservations",
        icon: Calendar,
        roles: ["owner", "manager"],
      },
      {
        title: "Customers",
        url: "/dashboard/customers",
        icon: Users,
        roles: ["owner", "manager", "staff"],
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
        roles: ["owner", "manager"],
      },
      {
        title: "Items",
        url: "/dashboard/items",
        icon: Package,
        roles: ["owner", "manager"],
      },
      {
        title: "Tables",
        url: "/dashboard/tables",
        icon: Building2,
        roles: ["owner", "manager"],
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
        roles: ["owner", "manager"],
      },
      {
        title: "Stock Levels",
        url: "/dashboard/stock",
        icon: Package,
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Purchases",
        url: "/dashboard/purchases",
        icon: ShoppingCart,
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Suppliers",
        url: "/dashboard/suppliers",
        icon: Truck,
        roles: ["owner", "manager"],
      },
      {
        title: "Locations",
        url: "/dashboard/locations",
        icon: MapPin,
        roles: ["owner", "manager"],
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
        roles: ["owner", "manager"],
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: FileText,
        roles: ["owner", "manager"],
      },
      {
        title: "Register Sessions",
        url: "/dashboard/reports/registers",
        icon: FileText,
        roles: ["owner", "manager"],
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
        roles: ["owner"],
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: SlidersHorizontal,
        roles: ["owner"],
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
            items: group.items.filter((item) => item.roles.includes(user.role)),
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
