"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export type Reservation = {
  id: string
  customer_name: string
  customer_phone: string
  party_size: number
  tables?: { table_number: number; capacity: number } | null
  reservation_time: string
  duration_minutes: number
  status: string
}

export const columns: ColumnDef<Reservation>[] = [
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.customer_name}</p>
        <p className="text-sm text-muted-foreground">{row.original.customer_phone}</p>
      </div>
    ),
  },
  {
    accessorKey: "party_size",
    header: "Party Size",
  },
  {
    accessorKey: "tables",
    header: "Table",
    cell: ({ row }) => {
      const table = row.original.tables
      return table ? `Table ${table.table_number}` : "-"
    },
  },
  {
    accessorKey: "reservation_time",
    header: "Time",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">
          {new Date(row.original.reservation_time).toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">{row.original.duration_minutes} min</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variant: "default" | "destructive" | "outline" | "secondary" = "outline"
      
      switch (status) {
        case "confirmed":
          variant = "default" // green-ish in some themes, or we can use custom classes
          break
        case "pending":
          variant = "secondary" // yellow-ish?
          break
        case "seated":
          variant = "default" // blue-ish?
          break
        default:
          variant = "outline"
      }

      // To match original colors exactly, we might need custom classNames on Badge or use the same logic as before.
      // Original: 
      // confirmed -> bg-green-100 text-green-800
      // pending -> bg-yellow-100 text-yellow-800
      // seated -> bg-blue-100 text-blue-800
      // default -> bg-gray-100 text-gray-800
      
      // I'll use standard Badges but maybe add className if I want specific colors, 
      // or just trust the Badge variants. 
      // For now, I'll stick to Badge variants for consistency with shadcn/ui.
      
      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" className="h-8 w-8 p-0" asChild>
        <Link href={`/dashboard/reservations/${row.original.id}`}>
          <span className="sr-only">Open menu</span>
          View
        </Link>
      </Button>
    ),
  },
]
