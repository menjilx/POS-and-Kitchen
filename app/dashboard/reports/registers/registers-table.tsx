"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/data-table"
import { getColumns, RegisterSessionWithUser } from "./columns"

interface RegistersTableProps {
  data: RegisterSessionWithUser[]
  currency: string
}

export function RegistersTable({ data, currency }: RegistersTableProps) {
  const columns = useMemo(() => getColumns(currency), [currency])

  return <DataTable columns={columns} data={data} />
}
