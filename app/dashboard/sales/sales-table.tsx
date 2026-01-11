"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/data-table"
import { getColumns, Sale } from "./columns"

interface SalesTableProps {
  data: Sale[]
  currency: string
}

export function SalesTable({ data, currency }: SalesTableProps) {
  const columns = useMemo(() => getColumns(currency), [currency])

  return <DataTable columns={columns} data={data} />
}
