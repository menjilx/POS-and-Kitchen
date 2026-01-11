"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export type Ingredient = {
  id: string
  name: string
  unit: string
  usage_unit: string | null
  conversion_factor: number | null
  cost_per_unit: number
  reorder_level: number | null
  status: string
  ingredient_categories: { name: string } | null
}

export const getColumns = (currency: string): ColumnDef<Ingredient>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "ingredient_categories.name",
    header: "Category",
    cell: ({ row }) => <span>{row.original.ingredient_categories?.name || '-'}</span>,
  },
  {
    accessorKey: "unit",
    header: "Stock Unit",
  },
  {
    accessorKey: "usage_unit",
    header: "Usage Unit",
    cell: ({ row }) => <span>{row.getValue("usage_unit") || '-'}</span>,
  },
  {
    id: "conversion",
    header: "Conversion",
    cell: ({ row }) => {
      const { unit, usage_unit, conversion_factor } = row.original
      if (conversion_factor && conversion_factor !== 1) {
        return <span>1 {unit} = {conversion_factor} {usage_unit || ''}</span>
      }
      return <span>-</span>
    },
  },
  {
    accessorKey: "cost_per_unit",
    header: "Cost/Unit",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("cost_per_unit"))
      return <span>{formatCurrency(amount, currency)}</span>
    },
  },
  {
    accessorKey: "reorder_level",
    header: "Reorder Level",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant="outline" 
          className={`capitalize ${
            status === 'active'
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-gray-100 text-gray-800 border-gray-200'
          }`}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/ingredients/${row.original.id}`}
        className="text-primary hover:underline text-sm"
      >
        Edit
      </Link>
    ),
  },
]
