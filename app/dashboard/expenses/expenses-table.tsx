"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/data-table"
import { getColumns, Expense } from "./columns"

interface ExpensesTableProps {
  data: Expense[]
  currency: string
}

export function ExpensesTable({ data, currency }: ExpensesTableProps) {
  const columns = useMemo(() => getColumns(currency), [currency])

  return <DataTable columns={columns} data={data} />
}
