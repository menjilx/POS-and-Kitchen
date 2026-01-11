"use client"


import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

type OrderStatus = "ready" | "in_kitchen" | "pending"

interface OrderQueueProps {
  orders: {
    id: string
    orderNumber: string
    customerName: string
    status: OrderStatus
    tableNumber?: string
    assignedStation?: string | null // Added
  }[]
}

export function OrderQueue({ orders }: OrderQueueProps) {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "ready":
        return "bg-green-600 hover:bg-green-700 text-white"
      case "in_kitchen":
        // Differentiate by station if needed, or just standard warning color
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600 text-black"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  const getStatusLabel = (status: OrderStatus, station?: string | null) => {
    switch (status) {
      case "ready":
        return "Ready"
      case "in_kitchen":
        return station ? station : "In Kitchen"
      case "pending":
        return "Pending"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="w-full mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>Order Queue</span>
        <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">{orders.length}</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-0">
                <div className={`p-2 text-center font-bold text-sm uppercase tracking-wide ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status, order.assignedStation)}
                </div>
                <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                         <span className="font-mono text-lg font-bold">{order.orderNumber}</span>
                         {order.tableNumber && (
                             <Badge variant="outline">T-{order.tableNumber}</Badge>
                         )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="truncate font-medium text-foreground">{order.customerName}</span>
                    </div>
                    
                    {/* Status Duration could go here if we had timestamps in this view */}
                    <div className="pt-2 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                           {order.status === 'in_kitchen' ? 'Preparing' : (order.status === 'ready' ? 'Ready to Serve' : 'Pending')}
                        </Badge>
                    </div>
                </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/30">
                No active orders in queue
            </div>
        )}
      </div>
    </div>
  )
}
