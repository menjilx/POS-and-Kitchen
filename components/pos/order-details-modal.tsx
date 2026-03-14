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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, User, MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

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

type OrderStatus = "ready" | "preparing" | "pending" | "served" | "cancelled"

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  currency = "$"
}: OrderDetailsModalProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  const [notes, setNotes] = useState<string | null>(null)
  const [paymentNotes, setPaymentNotes] = useState<string | null>(null)
  const [orderDate, setOrderDate] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("pending")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!order?.saleId) return

      setIsLoading(true)
      try {
        // Fetch Sale Details (for notes/total)
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .select('total_amount, notes, sale_date, sale_time, payment_notes, payment_data')
          .eq('id', order.saleId)
          .single()

        if (saleError) throw saleError
        setTotalAmount(saleData.total_amount)
        setNotes(saleData.notes)
        const rawPaymentData = saleData.payment_data
        let parsedPaymentNotes: string | null = null
        if (typeof rawPaymentData === 'string') {
          try {
            const parsed = JSON.parse(rawPaymentData) as { notes?: string }
            parsedPaymentNotes = parsed.notes ?? null
          } catch {
            parsedPaymentNotes = null
          }
        } else if (rawPaymentData && typeof rawPaymentData === 'object') {
          parsedPaymentNotes = (rawPaymentData as { notes?: string }).notes ?? null
        }
        setPaymentNotes(saleData.payment_notes ?? parsedPaymentNotes)
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
      setPaymentNotes(null)
    }
  }, [isOpen, order])

  useEffect(() => {
    if (order?.status) {
      setCurrentStatus(order.status as OrderStatus)
    }
  }, [order?.id, order?.status])

  if (!order) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-600 hover:bg-green-700"
      case "preparing": return "bg-orange-500 hover:bg-orange-600"
      case "served": return "bg-blue-600 hover:bg-blue-700"
      case "cancelled": return "bg-red-600 hover:bg-red-700"
      default: return "bg-yellow-500 hover:bg-yellow-600"
    }
  }

  const getStatusLabel = (status: string) =>
    status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())

  const updateOrderStatus = async (nextStatus: OrderStatus) => {
    if (!order) return
    if (currentStatus === nextStatus) return

    const previousStatus = currentStatus
    const now = new Date().toISOString()
    const updateData: { status: OrderStatus; started_at?: string; completed_at?: string } = { status: nextStatus }
    if (nextStatus === "preparing") {
      updateData.started_at = now
    }
    if (nextStatus === "ready" || nextStatus === "served" || nextStatus === "cancelled") {
      updateData.completed_at = now
    }

    setCurrentStatus(nextStatus)
    setIsUpdatingStatus(true)

    const { error } = await supabase.from("kds_orders").update(updateData).eq("id", order.id)

    setIsUpdatingStatus(false)

    if (error) {
      setCurrentStatus(previousStatus)
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" })
      return
    }

    toast({ title: "Updated", description: "Order status updated" })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <div className="flex items-center justify-between mr-4">
            <DialogTitle className="text-xl">{order.orderNumber}</DialogTitle>
            <Badge className={`${getStatusColor(currentStatus)} border-0`}>
              {getStatusLabel(currentStatus)}
            </Badge>
          </div>
          <DialogDescription>
             {orderDate || "Order Details"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Display Status</span>
              <Badge className={`${getStatusColor(currentStatus)} border-0`}>
                {getStatusLabel(currentStatus)}
              </Badge>
            </div>
            <Select value={currentStatus} onValueChange={(value) => updateOrderStatus(value as OrderStatus)} disabled={isUpdatingStatus}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="preparing">preparing</SelectItem>
                <SelectItem value="ready">ready</SelectItem>
                <SelectItem value="served">served</SelectItem>
                <SelectItem value="cancelled">cancelled</SelectItem>
              </SelectContent>
            </Select>
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
            {paymentNotes && (
                <div className="mt-3 p-2 bg-sky-50 text-sky-800 text-xs rounded border border-sky-100">
                    <span className="font-semibold">Note:</span> {paymentNotes}
                </div>
            )}
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
