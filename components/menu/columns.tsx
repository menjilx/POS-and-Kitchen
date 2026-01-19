"use client"

import Link from "next/link"
import Image from "next/image"
import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface MenuItem {
  id: string
  name: string
  description?: string
  status: string
  selling_price: number | string
  total_cost: number | string
  contribution_margin: number | string
  image_url?: string | null
  item_type?: string | null
}

export const getColumns = (
  currency: string,
  options?: {
    onDelete?: (item: MenuItem) => void
    deletingId?: string | null
  }
): ColumnDef<MenuItem>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center gap-3">
          {item.image_url && (
            <div className="h-8 w-8 rounded overflow-hidden bg-muted shrink-0 relative">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          )}
          <span className="font-medium">{item.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wide ${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: "selling_price",
    header: () => {
      return <div className="text-right">Price</div>
    },
    meta: { align: "right" },
    cell: ({ row }) => {
      return <div className="text-right">{formatCurrency(Number(row.getValue("selling_price")), currency)}</div>
    },
  },
  {
    accessorKey: "total_cost",
    header: () => {
      return <div className="text-right">Cost</div>
    },
    meta: { align: "right" },
    cell: ({ row }) => {
      return <div className="text-right">{formatCurrency(Number(row.getValue("total_cost")), currency)}</div>
    },
  },
  {
    accessorKey: "contribution_margin",
    header: () => {
      return <div className="text-right">Margin</div>
    },
    meta: { align: "right" },
    cell: ({ row }) => {
      const margin = Number(row.getValue("contribution_margin"))
      const sellingPrice = Number(row.original.selling_price)
      const marginPercent = sellingPrice > 0
        ? (margin / sellingPrice) * 100
        : 0
      
      return (
        <div className={`text-right ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(margin, currency)} ({marginPercent.toFixed(0)}%)
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => {
      return <div className="text-center">Action</div>
    },
    meta: { align: "center" },
    cell: ({ row }) => {
      const canDelete = Boolean(options?.onDelete)
      const isDeleting = options?.deletingId === row.original.id
      return (
        <div className="text-center flex items-center justify-center gap-2">
          <Link
            href={`/dashboard/menu/${row.original.id}`}
            className="inline-block px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-xs font-medium"
          >
            Edit
          </Link>
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => options?.onDelete?.(row.original)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      )
    },
  },
]
