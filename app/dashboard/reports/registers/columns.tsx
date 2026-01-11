"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export type RegisterSessionWithUser = {
  id: string
  status: 'open' | 'closed'
  opening_time: string
  opening_amount: number
  closing_time: string | null
  closing_amount: number | null
  notes: string | null
  users: {
    full_name: string | null
  } | null
}

export const getColumns = (currency: string): ColumnDef<RegisterSessionWithUser>[] => [
  {
    accessorKey: "users.full_name",
    header: "Cashier",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.users?.full_name || 'Unknown'}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === 'open' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "opening_time",
    header: "Opening Time",
    cell: ({ row }) => {
      return <div className="text-sm">{new Date(row.getValue("opening_time")).toLocaleString()}</div>
    },
  },
  {
    accessorKey: "opening_amount",
    header: "Opening Amount",
    cell: ({ row }) => {
      const amount = Number(row.getValue("opening_amount"))
      return <div className="font-medium">{formatCurrency(amount, currency)}</div>
    },
  },
  {
    accessorKey: "closing_time",
    header: "Closing Time",
    cell: ({ row }) => {
      const time = row.getValue("closing_time") as string | null
      return <div className="text-sm">{time ? new Date(time).toLocaleString() : '-'}</div>
    },
  },
  {
    accessorKey: "closing_amount",
    header: "Closing Amount",
    cell: ({ row }) => {
      const amount = row.getValue("closing_amount")
      return <div className="font-medium">{amount ? formatCurrency(Number(amount), currency) : '-'}</div>
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      return <div className="text-sm text-muted-foreground truncate max-w-[200px]">{row.getValue("notes") || '-'}</div>
    },
  },
]
