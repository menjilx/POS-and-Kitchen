"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Location, Stock } from '@/types/database'

export type StockWithIngredient = Stock & {
  ingredients: {
    id: string
    name: string
    unit: string
    reorder_level: number | null
    ingredient_categories: { name: string } | null
  } | null
}

export const getColumns = (
  locations: Location[],
  onAdjust: (item: StockWithIngredient) => void
): ColumnDef<StockWithIngredient>[] => [
  {
    accessorKey: "ingredients.name",
    header: "Ingredient",
    cell: ({ row }) => <span className="font-medium">{row.original.ingredients?.name}</span>,
  },
  {
    accessorKey: "ingredients.ingredient_categories.name",
    header: "Category",
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.ingredients?.ingredient_categories?.name || '-'}</span>,
  },
  {
    accessorKey: "location_id",
    header: "Location",
    cell: ({ row }) => {
      const locationName = locations.find(l => l.id === row.original.location_id)?.name || row.original.location_id
      return <span>{locationName}</span>
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span className="font-medium">
        {Number(row.original.quantity).toFixed(2)} {row.original.ingredients?.unit}
      </span>
    ),
  },
  {
    accessorKey: "ingredients.reorder_level",
    header: "Reorder Level",
    cell: ({ row }) => <span>{row.original.ingredients?.reorder_level}</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const isLow = Number(row.original.quantity) < Number(row.original.ingredients?.reorder_level)
      return isLow ? (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          Low Stock
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          OK
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        className="text-primary hover:underline text-sm h-auto p-0"
        onClick={() => onAdjust(row.original)}
      >
        Adjust
      </Button>
    ),
  },
]
