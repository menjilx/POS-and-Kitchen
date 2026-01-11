"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import type { User } from "@/types/database"

export type TenantSummary = {
  id: string
  name: string
  email: string
  is_suspended: boolean | null
}

export type UserWithTenant = User & {
  tenants: TenantSummary | null
}

export const getColumns = (
  onImpersonate: (userId: string) => void
): ColumnDef<UserWithTenant>[] => [
  {
    accessorKey: "full_name",
    header: "User",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.full_name || "N/A"}</div>
        <div className="text-sm text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: "tenants.name",
    header: "Tenant",
    cell: ({ row }) => {
      const tenant = row.original.tenants
      const role = row.original.role
      return (
        <div>
          <div className="font-medium">
            {tenant?.name || (role === "superadmin" ? "Global" : "N/A")}
          </div>
          {tenant?.is_suspended && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
              Suspended
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      let className = ""

      switch (role) {
        case "owner":
          className = "bg-purple-100 text-purple-800 hover:bg-purple-100/80"
          break
        case "manager":
          className = "bg-blue-100 text-blue-800 hover:bg-blue-100/80"
          break
        case "superadmin":
          className = "bg-red-100 text-red-800 hover:bg-red-100/80"
          break
        default:
          className = "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
      }

      return (
        <Badge variant="outline" className={`border-0 ${className}`}>
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={status === "active" ? "default" : "secondary"}
          className={
            status === "active"
              ? "bg-green-100 text-green-800 hover:bg-green-100/80"
              : "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
          }
        >
          {status === "active" ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string
      return (
        <span className="text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        className="flex items-center gap-2 h-auto p-2"
        onClick={() => onImpersonate(row.original.id)}
      >
        <Eye size={16} />
        Impersonate
      </Button>
    ),
  },
]
