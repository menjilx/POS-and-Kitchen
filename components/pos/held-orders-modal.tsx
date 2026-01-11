"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/utils"
import { Clock, User } from "lucide-react"

export interface HeldOrder {
  id: string
  orderNumber: string
  customerName: string
  totalAmount: number
  date: string
  time: string
  itemsCount: number
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Held Orders</DialogTitle>
          <DialogDescription>
            Select an order to resume processing.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-100 pr-4">
          <div className="space-y-4">
            {heldOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No held orders found.
              </div>
            ) : (
              heldOrders.map((order) => (
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
