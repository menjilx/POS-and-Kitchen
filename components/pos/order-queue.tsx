"use client"

import { useState, useRef, MouseEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { User, Search } from "lucide-react"

type OrderStatus = "ready" | "preparing" | "pending" | "served" | "cancelled"

type OrderQueueOrder = {
  id: string
  orderNumber: string
  customerName: string
  status: OrderStatus
  tableNumber?: string
  assignedStation?: string | null
}

interface OrderQueueProps {
  orders: OrderQueueOrder[]
  kitchenDisplays?: { id: string, name: string }[]
  onOrderClick?: (order: OrderQueueOrder) => void
}

export function OrderQueue({ orders, kitchenDisplays, onOrderClick }: OrderQueueProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      (order.tableNumber && order.tableNumber.toLowerCase().includes(query))
    )
  })

  const validDisplayNames = new Set(kitchenDisplays?.map(d => d.name) || [])

  const getStationName = (idOrName?: string | null) => {
    if (!idOrName) return "Kitchen"
    const display = kitchenDisplays?.find(d => d.id === idOrName)
    return display ? display.name : idOrName
  }

  const stationCounts = filteredOrders.reduce((acc, order) => {
    const station = getStationName(order.assignedStation)
    acc[station] = (acc[station] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "ready":
        return "bg-green-600 hover:bg-green-700 text-white"
      case "preparing":
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600 text-black"
      case "served":
        return "bg-blue-600 hover:bg-blue-700 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  const getStatusLabel = (status: OrderStatus, station?: string | null) => {
    switch (status) {
      case "ready":
        return "Ready"
      case "preparing":
        return getStationName(station)
      case "pending":
        return "Pending"
      case "served":
        return "Served"
      default:
        return "Unknown"
    }
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 2 // Scroll-fast multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }

  return (
    <div className="w-full mb-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>Order Queue</span>
          {filteredOrders.length === 0 ? (
            <Badge variant="secondary" className="px-2 py-0.5 rounded-full">
              0
            </Badge>
          ) : (
            Object.entries(stationCounts)
              .filter(([station]) => {
                // If kitchenDisplays is provided, only show badges for valid stations
                if (validDisplayNames.size > 0) {
                  return validDisplayNames.has(station)
                }
                return true
              })
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([station, count]) => (
                <Badge key={station} variant="secondary" className="px-2 py-0.5 rounded-full">
                  {station} ({count})
                </Badge>
              ))
          )}
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by #, name or table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className={`flex overflow-x-auto gap-4 pb-2 scrollbar-hide -mx-1 px-1 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {filteredOrders.map((order) => (
          <Card 
            key={order.id} 
            className="min-w-50 w-50 shrink-0 overflow-hidden border-2 hover:border-primary/50 transition shadow-sm cursor-pointer active:scale-95"
            onClick={() => onOrderClick && onOrderClick(order)}
          >
            <CardContent className="p-0">
                <div className={`p-2 text-center font-bold text-xs uppercase tracking-wide truncate ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status, order.assignedStation)}
                </div>
                <div className="p-3 space-y-2">
                    <div className="flex justify-between items-center">
                         <span className="font-mono text-base font-bold truncate" title={order.orderNumber}>
                           {order.orderNumber}
                         </span>
                         {order.tableNumber && (
                             <Badge variant="outline" className="text-[10px] px-1 h-5">T-{order.tableNumber}</Badge>
                         )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate font-medium text-foreground text-xs" title={order.customerName}>
                          {order.customerName}
                        </span>
                    </div>
                    
                    <div className="pt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal">
                           {order.status === 'preparing' ? 'Preparing' : (order.status === 'ready' ? 'Ready to Serve' : (order.status === 'served' ? 'Served' : 'Pending'))}
                        </Badge>
                    </div>
                </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredOrders.length === 0 && (
            <div className="w-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/30">
                {searchQuery ? "No matching orders found" : "No active orders in queue"}
            </div>
        )}
      </div>
    </div>
  )
}
