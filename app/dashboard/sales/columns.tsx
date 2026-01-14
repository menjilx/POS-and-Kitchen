"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type SaleKdsOrder = {
  status: string
  started_at?: string | null
  completed_at?: string | null
}

export type Sale = {
  id: string
  order_number: string
  sale_type: string
  total_amount: number
  payment_method: string
  payment_status: string
  sale_time: string
  kds_orders: SaleKdsOrder | SaleKdsOrder[] | null
}

export const getKdsStatus = (sale: Sale) => {
  if (!sale.kds_orders || (Array.isArray(sale.kds_orders) && sale.kds_orders.length === 0)) return 'unknown'
  
  const orders = Array.isArray(sale.kds_orders) ? sale.kds_orders : [sale.kds_orders]
  const statuses = orders.map((o) => o.status)

  // Priority: preparing > pending > ready > served > cancelled
  // If any item is in progress, the whole order is in progress
  if (statuses.some((s: string) => s === 'preparing')) return 'preparing'
  if (statuses.some((s: string) => s === 'pending')) return 'pending'
  if (statuses.some((s: string) => s === 'ready')) return 'ready'
  
  // If all are finished (served or cancelled)
  const allServedOrCancelled = statuses.every((s: string) => s === 'served' || s === 'cancelled')
  const anyServed = statuses.some((s: string) => s === 'served')
  
  if (allServedOrCancelled && anyServed) return 'served'
  if (statuses.every((s: string) => s === 'cancelled')) return 'cancelled'
  
  return statuses[0]
}

const getPrepTime = (sale: Sale) => {
  if (!sale.kds_orders || (Array.isArray(sale.kds_orders) && sale.kds_orders.length === 0)) return '-'
  
  const orders = Array.isArray(sale.kds_orders) ? sale.kds_orders : [sale.kds_orders]
  
  // Find earliest start and latest completion
  let start: number | null = null
  let end: number | null = null
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders.forEach((o: any) => {
      if (o.started_at) {
          const s = new Date(o.started_at).getTime()
          if (start === null || s < start) start = s
      }
      if (o.completed_at) {
          const e = new Date(o.completed_at).getTime()
          if (end === null || e > end) end = e
      }
  })

  if (!start) return '-'
  if (!end) return 'In Progress'

  const diffMs = end - start
  const diffMins = Math.floor(diffMs / 60000)
  const diffSecs = Math.floor((diffMs % 60000) / 1000)

  return `${diffMins}m ${diffSecs}s`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'served': return 'bg-green-100 text-green-800'
    case 'ready': return 'bg-blue-100 text-blue-800'
    case 'preparing': return 'bg-yellow-100 text-yellow-800'
    case 'pending': return 'bg-gray-100 text-gray-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const getColumns = (currency: string): ColumnDef<Sale>[] => [
  {
    accessorKey: "order_number",
    header: "Order #",
    cell: ({ row }) => <span className="font-medium">{row.getValue("order_number")}</span>,
  },
  {
    accessorKey: "sale_type",
    header: "Type",
    cell: ({ row }) => <span className="capitalize">{(row.getValue("sale_type") as string)?.replace('_', ' ')}</span>,
  },
  {
    accessorKey: "total_amount",
    header: "Amount",
    cell: ({ row }) => <span className="font-medium">{formatCurrency(Number(row.getValue("total_amount")), currency)}</span>,
  },
  {
    accessorKey: "payment_method",
    header: "Payment Method",
    cell: ({ row }) => <span className="capitalize">{(row.getValue("payment_method") as string)?.replace('_', ' ') || '-'}</span>,
  },
  {
    accessorKey: "payment_status",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = row.getValue("payment_status") as string
      return (
        <Badge 
          variant="outline" 
          className={`capitalize ${
            status === 'paid'
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
          }`}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    id: "kds_status",
    accessorFn: (row) => getKdsStatus(row),
    header: "Kitchen Status",
    cell: ({ row }) => {
      const kdsStatus = row.getValue("kds_status") as string
      if (kdsStatus === 'unknown') return <span className="text-gray-400 text-xs">-</span>
      return (
        <Badge 
          variant="outline" 
          className={`capitalize ${getStatusColor(kdsStatus)} border-0`}
        >
          {kdsStatus}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "prep_time",
    header: "Prep Time",
    cell: ({ row }) => <span className="text-sm font-mono">{getPrepTime(row.original)}</span>,
  },
  {
    accessorKey: "sale_time",
    header: "Date",
    cell: ({ row }) => <span className="text-sm">{new Date(row.getValue("sale_time")).toLocaleString()}</span>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link href={`/dashboard/sales/${row.original.id}`}>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Eye className="w-4 h-4 text-gray-500" />
        </Button>
      </Link>
    ),
  },
]
