"use client"


import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  }[]
}

export function OrderQueue({ orders }: OrderQueueProps) {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "ready":
        return "bg-green-500 hover:bg-green-600"
      case "in_kitchen":
        return "bg-orange-500 hover:bg-orange-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "ready":
        return "Ready"
      case "in_kitchen":
        return "In Kitchen"
      default:
        return "Pending"
    }
  }

  return (
    <div className="w-full mb-6">
      <h2 className="text-xl font-semibold mb-4">Order Queue</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {orders.map((order) => (
          <Card key={order.id} className="min-w-[250px] flex-shrink-0">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(order.status)} text-white border-0`}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
            <div className="text-muted-foreground text-sm p-4">No active orders</div>
        )}
      </div>
    </div>
  )
}
