"use client"

import { useMemo } from "react"
import { DataTable } from "@/components/data-table"
import { getColumns, Ingredient } from "./columns"

interface IngredientsTableProps {
  data: Ingredient[]
  currency: string
}

export function IngredientsTable({ data, currency }: IngredientsTableProps) {
  const columns = useMemo(() => getColumns(currency), [currency])

  return <DataTable columns={columns} data={data} />
}
