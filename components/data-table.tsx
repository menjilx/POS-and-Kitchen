"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  getRowClassName?: (row: TData) => string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortDir = header.column.getIsSorted()
                  const headerContent = header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())
                  const headerElement = React.isValidElement<{ className?: string }>(headerContent)
                    ? headerContent
                    : null
                  const headerAlign =
                    (header.column.columnDef.meta as { align?: "left" | "right" | "center" } | undefined)?.align ??
                    (typeof headerElement?.props?.className === "string" &&
                    headerElement.props.className.includes("text-right")
                      ? "right"
                      : typeof headerElement?.props?.className === "string" &&
                        headerElement.props.className.includes("text-center")
                        ? "center"
                        : "left")
                  const isRightAligned = headerAlign === "right"
                  const isCenterAligned = headerAlign === "center"

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        canSort && "cursor-pointer select-none",
                        isCenterAligned && "text-center"
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div
                        className={cn(
                          "flex w-full items-center gap-1",
                          isRightAligned && "justify-end",
                          isCenterAligned && "justify-center"
                        )}
                      >
                        {headerContent}
                        {canSort ? (
                          <ArrowUpDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground",
                              sortDir ? "text-foreground" : ""
                            )}
                          />
                        ) : null}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(getRowClassName?.(row.original))}
                >
                  {row.getVisibleCells().map((cell) => {
                    const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext())
                    const cellElement = React.isValidElement<{ className?: string }>(cellContent)
                      ? cellContent
                      : null
                    const cellAlign =
                      (cell.column.columnDef.meta as { align?: "left" | "right" | "center" } | undefined)?.align ??
                      (typeof cellElement?.props?.className === "string" &&
                      cellElement.props.className.includes("text-right")
                        ? "right"
                        : typeof cellElement?.props?.className === "string" &&
                          cellElement.props.className.includes("text-center")
                          ? "center"
                          : "left")
                    const isRightAligned = cellAlign === "right"
                    const isCenterAligned = cellAlign === "center"

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(isRightAligned && "text-right", isCenterAligned && "text-center")}
                      >
                        {isRightAligned ? (
                          <div className="flex w-full justify-end">{cellContent}</div>
                        ) : isCenterAligned ? (
                          <div className="flex w-full justify-center">{cellContent}</div>
                        ) : (
                          cellContent
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
