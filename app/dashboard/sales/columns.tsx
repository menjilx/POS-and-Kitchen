"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Eye, Loader2, Trash2 } from "lucide-react"
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
  payment_method: string | null
  payment_status: string
  sale_time: string
  kds_orders: SaleKdsOrder | SaleKdsOrder[] | null
  sale_items?: { quantity: number | null }[] | null
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
  const totalSecs = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60

  if (hours > 0) return `${hours}h ${mins}m ${secs}s`
  return `${mins}m ${secs}s`
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

type SalesColumnOptions = {
  onDelete?: (sale: Sale) => void
  deletingId?: string | null
  canDelete?: boolean
}

export const getColumns = (currency: string, options?: SalesColumnOptions): ColumnDef<Sale>[] => [
  {
    accessorKey: "order_number",
    header: "Order #",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/sales/${row.original.id}`}
        className="font-medium text-primary hover:underline underline-offset-4"
      >
        {row.getValue("order_number")}
      </Link>
    ),
  },
  {
    accessorKey: "sale_type",
    header: "Type",
    cell: ({ row }) => <span className="capitalize">{(row.getValue("sale_type") as string)?.replace('_', ' ')}</span>,
  },
  {
    id: "items_count",
    header: "Items",
    accessorFn: (row) => {
      const items = row.sale_items ?? []
      return items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
    },
    cell: ({ row }) => <span className="text-sm">{row.getValue("items_count") as number}</span>,
  },
  {
    accessorKey: "total_amount",
    header: "Amount",
    cell: ({ row }) => <span className="font-medium">{formatCurrency(Number(row.getValue("total_amount")), currency)}</span>,
  },
  {
    accessorKey: "payment_method",
    header: "Payment Method",
    cell: ({ row }) => (
      <span className="capitalize">{(row.getValue("payment_method") as string | null)?.replace('_', ' ') || '-'}</span>
    ),
    filterFn: (row, id, value) => {
      if (!value) return true
      return row.getValue(id) === value
    },
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
              : status === 'voided'
              ? 'bg-red-100 text-red-800 border-red-200'
              : status === 'refunded'
              ? 'bg-orange-100 text-orange-800 border-orange-200'
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
    header: "Display Status",
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
    cell: ({ row }) => {
      const isDeleting = options?.deletingId === row.original.id
      return (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/sales/${row.original.id}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Eye className="w-4 h-4 text-gray-500" />
            </Button>
          </Link>
          {options?.canDelete ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => options?.onDelete?.(row.original)}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
              aria-label="Delete sale"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>
      )
    },
  },
]
