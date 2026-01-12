"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle } from "lucide-react"

export interface StockItem {
  id: string
  ingredient_id: string
  ingredient_name: string
  unit: string
  expected_quantity: number
  actual_quantity: number
  variance: number
  variance_percentage: number
}

export const getColumns = (
  onUpdateQuantity: (id: string, value: number) => void
): ColumnDef<StockItem>[] => [
  {
    accessorKey: "ingredient_name",
    header: "Ingredient",
    cell: ({ row }) => <span className="font-medium">{row.original.ingredient_name}</span>,
  },
  {
    accessorKey: "expected_quantity",
    header: () => <div className="text-right">Expected</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.expected_quantity.toFixed(2)} {row.original.unit}
      </div>
    ),
  },
  {
    accessorKey: "actual_quantity",
    header: () => <div className="text-right">Actual</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <input
          type="number"
          step="0.01"
          value={row.original.actual_quantity}
          onChange={(e) => onUpdateQuantity(row.original.id, parseFloat(e.target.value))}
          className="w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-right"
        />
      </div>
    ),
  },
  {
    accessorKey: "variance",
    header: () => <div className="text-right">Variance</div>,
    cell: ({ row }) => {
      const { variance, unit } = row.original
      return (
        <div
          className={`text-right font-bold ${
            variance > 0 ? "text-green-600" : variance < 0 ? "text-red-600" : ""
          }`}
        >
          {variance > 0 ? "+" : ""}
          {variance.toFixed(2)} {unit}
        </div>
      )
    },
  },
  {
    accessorKey: "variance_percentage",
    header: () => <div className="text-right">Variance %</div>,
    cell: ({ row }) => {
      const { variance_percentage } = row.original
      const isHighVariance = Math.abs(variance_percentage) > 5
      return (
        <div
          className={`text-right font-bold ${
            isHighVariance ? "text-red-600" : ""
          }`}
        >
          {variance_percentage.toFixed(1)}%
          {isHighVariance && <AlertTriangle size={16} className="inline ml-1" />}
        </div>
      )
    },
  },
]
