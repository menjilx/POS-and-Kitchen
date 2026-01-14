"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, User, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: {
    id: string
    saleId?: string
    orderNumber: string
    customerName: string
    status: string
    tableNumber?: string
    assignedStation?: string | null
  } | null
  currency?: string
}

type OrderItem = {
  id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  total_price: number
  menu_items: {
    name: string
    image_url: string | null
  }
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  currency = "$"
}: OrderDetailsModalProps) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  const [notes, setNotes] = useState<string | null>(null)
  const [orderDate, setOrderDate] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!order?.saleId) return

      setIsLoading(true)
      try {
        // Fetch Sale Details (for notes/total)
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .select('total_amount, notes, sale_date, sale_time')
          .eq('id', order.saleId)
          .single()

        if (saleError) throw saleError
        setTotalAmount(saleData.total_amount)
        setNotes(saleData.notes)
        setOrderDate(`${new Date(saleData.sale_date).toLocaleDateString()} ${new Date(saleData.sale_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)

        // Fetch Items
        const { data: itemsData, error: itemsError } = await supabase
          .from('sale_items')
          .select(`
            id,
            menu_item_id,
            quantity,
            unit_price,
            total_price,
            menu_items (
              name,
              image_url
            )
          `)
          .eq('sale_id', order.saleId)

        if (itemsError) throw itemsError
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setItems(itemsData as any)

      } catch (error) {
        console.error("Error fetching order details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen && order) {
      fetchOrderDetails()
    } else {
      setItems([])
      setTotalAmount(0)
      setNotes(null)
    }
  }, [isOpen, order])

  if (!order) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-600 hover:bg-green-700"
      case "in_kitchen": return "bg-orange-500 hover:bg-orange-600"
      default: return "bg-yellow-500 hover:bg-yellow-600"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <div className="flex items-center justify-between mr-4">
            <DialogTitle className="text-xl">{order.orderNumber}</DialogTitle>
            <Badge className={`${getStatusColor(order.status)} border-0`}>
              {order.status === 'in_kitchen' ? 'Preparing' : (order.status === 'ready' ? 'Ready' : 'Pending')}
            </Badge>
          </div>
          <DialogDescription>
             {orderDate || "Order Details"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Customer & Location Info */}
          <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
             <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium truncate max-w-30" title={order.customerName}>
                  {order.customerName}
                </span>
             </div>
             {order.tableNumber && (
                <div className="flex items-center gap-1.5">
                   <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                   <span className="font-medium">Table {order.tableNumber}</span>
                </div>
             )}
          </div>

          <div className="space-y-3">
             <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Items</h4>
             <ScrollArea className="h-50 pr-4">
               {isLoading ? (
                 <div className="flex justify-center py-8">
                   <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 </div>
               ) : items.length === 0 ? (
                 <div className="text-center py-4 text-muted-foreground text-sm">No items found</div>
               ) : (
                 <div className="space-y-3">
                   {items.map((item) => (
                     <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex gap-3">
                           <div className="font-medium bg-muted w-6 h-6 flex items-center justify-center rounded text-xs shrink-0">
                             {item.quantity}
                           </div>
                           <span className="line-clamp-2">{item.menu_items.name}</span>
                        </div>
                        <span className="font-medium whitespace-nowrap">
                          {formatCurrency(item.total_price, currency)}
                        </span>
                     </div>
                   ))}
                 </div>
               )}
             </ScrollArea>
          </div>

          <div className="border-t pt-4 mt-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(totalAmount, currency)}</span>
            </div>
            {notes && (
                <div className="mt-3 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100">
                    <span className="font-semibold">Note:</span> {notes}
                </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
