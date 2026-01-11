"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"

export type SaleItemWithDetails = {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  menu_items: {
    name: string
  } | null
}

export const getColumns = (currency: string): ColumnDef<SaleItemWithDetails>[] => [
  {
    accessorKey: "menu_items.name",
    header: "Item",
    cell: ({ row }) => {
      const name = row.original.menu_items?.name || 'Unknown Item'
      return <span className="font-medium">{name}</span>
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return <div className="text-right">Qty</div>
    },
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue("quantity")}</div>
    },
  },
  {
    accessorKey: "unit_price",
    header: ({ column }) => {
      return <div className="text-right">Price</div>
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("unit_price"))
      return <div className="text-right">{formatCurrency(price, currency)}</div>
    },
  },
  {
    accessorKey: "total_price",
    header: ({ column }) => {
      return <div className="text-right">Total</div>
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("total_price"))
      return <div className="text-right">{formatCurrency(price, currency)}</div>
    },
  },
]
