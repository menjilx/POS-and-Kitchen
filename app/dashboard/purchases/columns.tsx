"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export type Purchase = {
  id: string
  invoice_number: string | null
  invoice_date: string
  total_amount: number
  suppliers: { name: string } | null
  purchase_items: { id: string }[] | null
}

export const getColumns = (currency: string): ColumnDef<Purchase>[] => [
  {
    accessorKey: "invoice_number",
    header: "Invoice #",
    cell: ({ row }) => <span className="font-medium">{row.getValue("invoice_number") || '-'}</span>,
  },
  {
    accessorKey: "suppliers.name",
    header: "Supplier",
    cell: ({ row }) => <span>{row.original.suppliers?.name || '-'}</span>,
  },
  {
    accessorKey: "invoice_date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("invoice_date"))
      return <span>{date.toLocaleDateString()}</span>
    },
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => {
      const count = row.original.purchase_items?.length || 0
      return <span className="text-muted-foreground text-sm">{count} items</span>
    },
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amount"))
      return <span className="font-medium">{formatCurrency(amount, currency)}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" className="h-8 w-8 p-0" asChild>
        <Link
          href={`/dashboard/purchases/${row.original.id}`}
          className="text-primary hover:underline"
        >
          View
        </Link>
      </Button>
    ),
  },
]
