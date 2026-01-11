"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"
import type { PurchaseItem, Ingredient, Location } from '@/types/database'

export type PurchaseItemWithDetails = PurchaseItem & {
  ingredients: Pick<Ingredient, 'name' | 'unit'> | null
  locations: Pick<Location, 'name'> | null
}

export const getColumns = (currency: string): ColumnDef<PurchaseItemWithDetails>[] => [
  {
    accessorKey: "ingredients.name",
    header: "Ingredient",
    cell: ({ row }) => {
      const name = row.original.ingredients?.name
      const unit = row.original.ingredients?.unit
      return (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">{unit}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "locations.name",
    header: "Location",
    cell: ({ row }) => {
      return <div className="text-sm">{row.original.locations?.name}</div>
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return <div className="text-right">Quantity</div>
    },
    cell: ({ row }) => {
      return <div className="text-right">{Number(row.getValue("quantity"))}</div>
    },
  },
  {
    accessorKey: "unit_price",
    header: ({ column }) => {
      return <div className="text-right">Unit Price</div>
    },
    cell: ({ row }) => {
      const price = Number(row.getValue("unit_price"))
      return <div className="text-right">{formatCurrency(price, currency)}</div>
    },
  },
  {
    id: "total",
    header: ({ column }) => {
      return <div className="text-right">Total</div>
    },
    cell: ({ row }) => {
      const quantity = Number(row.getValue("quantity"))
      const unitPrice = Number(row.getValue("unit_price"))
      return <div className="text-right font-medium">{formatCurrency(quantity * unitPrice, currency)}</div>
    },
  },
]
