"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/utils"
import { Clock, User, Search } from "lucide-react"

export interface HeldOrder {
  id: string
  orderNumber: string
  customerName: string
  totalAmount: number
  date: string
  time: string
  itemsCount: number
  status?: string
}

interface HeldOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  heldOrders: HeldOrder[]
  onResumeOrder: (orderId: string) => void
  isLoading?: boolean
  currency?: string
}

export function HeldOrdersModal({
  isOpen,
  onClose,
  heldOrders,
  onResumeOrder,
  isLoading = false,
  currency = "$"
}: HeldOrdersModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      setTimeout(() => setSearchQuery(""), 300)
    }
  }

  const filteredOrders = heldOrders.filter((order) => {
    const query = searchQuery.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query)
    )
  })

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Held Orders</DialogTitle>
          <DialogDescription>
            Select an order to resume processing.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-100 pr-4">
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No matching orders found." : "No held orders found."}
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onResumeOrder(order.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{order.orderNumber}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {order.time}
                      </span>
                      {order.status && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 capitalize">
                            {order.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{order.customerName || "Guest"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.itemsCount} items • {order.date}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-lg">
                      {formatCurrency(order.totalAmount, currency)}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={isLoading}
                    >
                      Resume
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
