"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  is_active: boolean | null
}

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span>{row.getValue("email") || '-'}</span>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <span>{row.getValue("phone") || '-'}</span>,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => <span className="max-w-[200px] truncate block" title={row.getValue("address") || ''}>{row.getValue("address") || '-'}</span>,
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active")
      return (
        <Badge 
          variant="outline" 
          className={isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/customers/${row.original.id}`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]
