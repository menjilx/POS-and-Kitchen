"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { LayoutGrid, List, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { DataTable } from "@/components/data-table"
import { getColumns, MenuItem } from "./columns"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface MenuGridProps {
  items: MenuItem[]
  currency: string
}

export function MenuGrid({ items, currency }: MenuGridProps) {
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [columns, setColumns] = useState("4")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactivated">("all")
  const [menuItems, setMenuItems] = useState<MenuItem[]>(items)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  useEffect(() => {
    setMenuItems(items)
  }, [items])

  const handleDelete = useCallback(async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return
    setDeletingId(item.id)
    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", item.id)

      if (error) throw error

      setMenuItems((prev) => prev.filter((current) => current.id !== item.id))
      toast({
        title: "Deleted",
        description: `"${item.name}" was deleted.`,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete item",
      })
    } finally {
      setDeletingId(null)
    }
  }, [toast])

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return menuItems
    return menuItems.filter((item) => item.status === statusFilter)
  }, [menuItems, statusFilter])

  const tableColumns = useMemo(
    () => getColumns(currency, { onDelete: handleDelete, deletingId }),
    [currency, deletingId, handleDelete]
  )

  const getGridCols = () => {
    switch (columns) {
      case "2": return "grid-cols-1 sm:grid-cols-2"
      case "3": return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      case "4": return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      case "5": return "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5"
      case "6": return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
      default: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">View:</span>
          <div className="flex items-center border rounded-md bg-background">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-none first:rounded-l-md"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-none last:rounded-r-md border-l"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "deactivated")}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
          {viewMode === "grid" && (
            <>
              <span className="text-sm font-medium">Columns:</span>
              <Select value={columns} onValueChange={setColumns}>
                <SelectTrigger className="w-17.5 h-8">
                  <SelectValue placeholder="Cols" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className={`grid gap-4 ${getGridCols()}`}>
          {filteredItems.map((item, index) => {
            const margin = Number(item.contribution_margin)
            const marginPercent = Number(item.selling_price) > 0
              ? (margin / Number(item.selling_price)) * 100
              : 0
            const totalCostPercent = Number(item.selling_price) > 0
              ? (Number(item.total_cost) / Number(item.selling_price)) * 100
              : 0

            return (
              <div key={item.id} className="bg-card rounded-lg border overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                {item.image_url && (
                  <div className="h-48 w-full relative bg-muted">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      priority={index < 4}
                    />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold truncate" title={item.name}>{item.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wide shrink-0 ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground mt-auto">
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium text-foreground">{formatCurrency(Number(item.selling_price), currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span className="font-medium">{formatCurrency(Number(item.total_cost), currency)} ({totalCostPercent.toFixed(0)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margin:</span>
                      <span className={`font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(margin, currency)} ({marginPercent.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex gap-2">
                    <Link
                      href={`/dashboard/menu/${item.id}`}
                      className="flex-1 text-center px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-xs font-medium"
                    >
                      Edit
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 px-3 text-xs"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? "Deleting..." : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No items found.
            </div>
          )}
        </div>
      ) : (
        <DataTable columns={tableColumns} data={filteredItems} />
      )}
    </div>
  )
}
