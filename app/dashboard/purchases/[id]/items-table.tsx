"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/data-table"
import { getColumns, PurchaseItemWithDetails } from "./columns"

interface PurchaseItemsTableProps {
  data: PurchaseItemWithDetails[]
  currency: string
}

export function PurchaseItemsTable({ data, currency }: PurchaseItemsTableProps) {
  const columns = useMemo(() => getColumns(currency), [currency])

  return <DataTable columns={columns} data={data} />
}
