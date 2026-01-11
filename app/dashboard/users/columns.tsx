"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export type User = {
  id: string
  full_name: string | null
  email: string
  role: string
  status: string
  last_login: string | null
  created_at: string
  tenant_id: string
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "full_name",
    header: "Name",
    cell: ({ row }) => row.getValue("full_name") || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <span className="capitalize">{row.getValue("role")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "active" ? "default" : "destructive"}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "last_login",
    header: "Last Login",
    cell: ({ row }) => {
      const date = row.getValue("last_login") as string
      return date ? new Date(date).toLocaleDateString() : "Never"
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" className="h-8 w-8 p-0" asChild>
        <Link href={`/dashboard/users/${row.original.id}`}>
          <span className="sr-only">Open menu</span>
          Edit
        </Link>
      </Button>
    ),
  },
]
