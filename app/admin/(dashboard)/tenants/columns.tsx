"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

export type Tenant = {
  id: string
  name: string
  email: string
  user_count: number
  total_sales: number
  is_suspended: boolean
  suspension_reason: string | null
  suspended_at: string | null
  created_at: string
  currency?: string
}

export const getColumns = (
  onSuspend: (tenant: Tenant) => void,
  onReactivate: (tenantId: string) => void,
  onDelete: (tenant: Tenant) => void
): ColumnDef<Tenant>[] => [
  {
    accessorKey: "name",
    header: "Restaurant",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "user_count",
    header: "Users",
  },
  {
    accessorKey: "total_sales",
    header: "Sales",
    cell: ({ row }) => {
      const { total_sales, currency } = row.original
      return formatCurrency(total_sales || 0, currency ?? "USD")
    },
  },
  {
    accessorKey: "is_suspended",
    header: "Status",
    cell: ({ row }) => {
      const isSuspended = row.getValue("is_suspended")
      return (
        <Badge variant={isSuspended ? "destructive" : "default"} className={!isSuspended ? "bg-green-100 text-green-800 hover:bg-green-100/80" : ""}>
          {isSuspended ? "Suspended" : "Active"}
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
    cell: ({ row }) => {
      const tenant = row.original
      return (
        <div className="flex gap-2">
          {!tenant.is_suspended ? (
            <Button
              variant="ghost"
              className="text-destructive hover:underline text-sm h-auto p-0"
              onClick={() => onSuspend(tenant)}
            >
              Suspend
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="text-primary hover:underline text-sm h-auto p-0"
              onClick={() => onReactivate(tenant.id)}
            >
              Reactivate
            </Button>
          )}
          <Button
            variant="ghost"
            className="text-destructive hover:underline text-sm h-auto p-0"
            onClick={() => onDelete(tenant)}
          >
            Delete
          </Button>
        </div>
      )
    },
  },
]
