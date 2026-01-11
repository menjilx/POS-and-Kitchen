"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export type Expense = {
  id: string
  expense_date: string
  description: string | null
  amount: number
  expense_categories: { name: string } | null
}

export const getColumns = (currency: string): ColumnDef<Expense>[] => [
  {
    accessorKey: "expense_date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("expense_date"))
      return <span>{date.toLocaleDateString()}</span>
    },
  },
  {
    accessorKey: "expense_categories.name",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.expense_categories?.name
      return <span>{category || '-'}</span>
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <span>{row.getValue("description")}</span>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      return <span className="font-medium">{formatCurrency(amount, currency)}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Button variant="ghost" asChild className="h-8 w-8 p-0">
          <Link href={`/dashboard/expenses/${row.original.id}`}>
            View
          </Link>
        </Button>
      )
    },
  },
]
