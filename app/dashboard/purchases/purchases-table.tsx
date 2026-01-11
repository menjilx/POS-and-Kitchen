"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/data-table"
import { getColumns, Purchase } from "./columns"

interface PurchasesTableProps {
  data: Purchase[]
  currency: string
}

export function PurchasesTable({ data, currency }: PurchasesTableProps) {
  const columns = useMemo(() => getColumns(currency), [currency])

  return <DataTable columns={columns} data={data} />
}
