"use client"

import * as React from "react"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { FileDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getColumns, Sale } from "./columns"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface SalesTableProps {
  data: Sale[]
  currency: string
  canDelete?: boolean
}

export function SalesTable({ data, currency, canDelete }: SalesTableProps) {
  const { toast } = useToast()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [rows, setRows] = React.useState<Sale[]>(data)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deleteCandidate, setDeleteCandidate] = React.useState<Sale | null>(null)

  React.useEffect(() => {
    setRows(data)
  }, [data])

  const openDeleteDialog = React.useCallback((sale: Sale) => {
    if (!canDelete) return
    setDeleteCandidate(sale)
    setDeleteDialogOpen(true)
  }, [canDelete])

  const handleDelete = React.useCallback(async () => {
    if (!canDelete) return
    if (!deleteCandidate) return
    setDeletingId(deleteCandidate.id)
    try {
      const { data: deletedRows, error } = await supabase
        .from("sales")
        .delete()
        .eq("id", deleteCandidate.id)
        .eq("tenant_id", deleteCandidate.tenant_id)
        .select("id")

      if (error) throw error
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error("No rows deleted. Check permissions or record availability.")
      }

      setRows((prev) => prev.filter((row) => row.id !== deleteCandidate.id))
      toast({ title: "Sale deleted", description: `Order ${deleteCandidate.order_number} was deleted.` })
      setDeleteDialogOpen(false)
      setDeleteCandidate(null)
    } catch (err) {
      const errorDetails =
        err && typeof err === "object"
          ? Object.fromEntries(Object.getOwnPropertyNames(err).map((key) => [key, (err as Record<string, unknown>)[key]]))
          : err
      console.error("Delete sale failed", errorDetails)
      const errorLike = err as { message?: string; details?: string; hint?: string; code?: string } | null
      const message =
        (errorLike?.message || errorLike?.details || errorLike?.hint || errorLike?.code) ?? "Failed to delete sale"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }, [canDelete, deleteCandidate, toast])

  const columns = React.useMemo(
    () => getColumns(currency, { onDelete: openDeleteDialog, deletingId, canDelete }),
    [currency, deletingId, canDelete, openDeleteDialog]
  )

  const table = useReactTable({
    data: rows,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  // Export function
  const exportToCsv = () => {
    const headers = ["Order #", "Type", "Items", "Amount", "Payment Method", "Payment Status", "Display Status", "Date"]
    const rows = table.getFilteredRowModel().rows.map(row => {
      const itemsCount = (row.original.sale_items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0)
      return [
        row.original.order_number,
        row.original.sale_type,
        itemsCount,
        row.original.total_amount,
        row.original.payment_method,
        row.original.payment_status,
        row.getValue("kds_status"),
        `"${new Date(row.original.sale_time).toLocaleString()}"`
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `sales_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && deletingId) return
          setDeleteDialogOpen(open)
          if (!open) setDeleteCandidate(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              {deleteCandidate ? `Delete order ${deleteCandidate.order_number}? This action cannot be undone.` : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={!!deletingId}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!deletingId}>
              {deletingId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <Input
            placeholder="Search orders..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="h-8 w-37.5 lg:w-62.5"
          />
          {/* Filters */}
           <Select
            value={(table.getColumn("payment_status")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
              table.getColumn("payment_status")?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="h-8 w-32.5">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

           <Select
            value={(table.getColumn("kds_status")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
              table.getColumn("kds_status")?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="h-8 w-32.5">
              <SelectValue placeholder="Kitchen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="served">Served</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
           <Select
            value={(table.getColumn("sale_type")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
              table.getColumn("sale_type")?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="h-8 w-32.5">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dine_in">Dine In</SelectItem>
              <SelectItem value="take_out">Take Out</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
            variant="outline"
            size="sm"
            className="h-8 ml-auto"
            onClick={exportToCsv}
        >
            <FileDown className="mr-2 h-4 w-4" />
            Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} row(s) found.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
