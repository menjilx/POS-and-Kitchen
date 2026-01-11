"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MenuItem, Table, SaleType, Customer } from "@/types/database"
import { Trash2, MoreHorizontal, Copy, TicketPercent, ChefHat } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { CustomerDialog } from "./customer-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
  item: MenuItem
  quantity: number
}

interface Discount {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  is_active: boolean
}

interface OrderSidebarProps {
  orderId: string
  orderType: "dine_in" | "takeout" | "delivery"
  setOrderType: (type: "dine_in" | "takeout" | "delivery") => void
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
  orderNote?: string
  setOrderNote?: (note: string) => void
  tableId: string
  setTableId: (id: string) => void
  tables: Table[]
  cartItems: CartItem[]
  onRemoveItem: (itemId: string) => void
  onUpdateQuantity: (itemId: string, delta: number) => void
  onHoldOrder: () => void
  onPay: () => void
  onClearCart: () => void
  subtotal: number
  discount: number
  tax: number
  taxRate: number
  total: number
  currency?: string
  isProcessing?: boolean
  discounts: Discount[]
  selectedDiscountId: string | null
  onSelectDiscount: (id: string | null) => void
  customDiscount?: { type: 'percentage' | 'fixed', value: number }
  setCustomDiscount?: (discount: { type: 'percentage' | 'fixed', value: number }) => void
  onTaxChange?: (rate: number) => void
  tenantId?: string | null
  onSendToKitchen: (destination?: string) => void
  kitchenDisplays?: { id: string, name: string }[]
}

export function OrderSidebar({
  orderId,
  orderType,
  setOrderType,
  selectedCustomer,
  onSelectCustomer,
  tableId,
  setTableId,
  tables,
  cartItems,
  onRemoveItem,
  onHoldOrder,
  onPay,
  onClearCart,
  subtotal,
  discount = 0,
  tax,
  taxRate = 0,
  total,
  currency = "$",
  isProcessing = false,
  discounts = [],
  selectedDiscountId,
  onSelectDiscount,
  customDiscount = { type: 'percentage', value: 0 },
  setCustomDiscount,
  onTaxChange,
  tenantId,
  onSendToKitchen,
  kitchenDisplays = []
}: OrderSidebarProps) {
  const { toast } = useToast()

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderId)
    toast({
      title: "Copied",
      description: "Order number copied to clipboard",
    })
  }

  return (
    <div className="h-full flex flex-col bg-card border-l">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold">Order Details</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">{orderId}</p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                onClick={copyOrderNumber}
                title="Copy Order ID"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyOrderNumber}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Order ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"  
                  onClick={onClearCart}
                  disabled={cartItems.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as SaleType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dine_in">Dine in</TabsTrigger>
            <TabsTrigger value="takeout">Take away</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Customer Info */}
      <div className="p-4 border-b space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <CustomerDialog 
                selectedCustomer={selectedCustomer} 
                onSelect={onSelectCustomer} 
                tenantId={tenantId}
            />
          </div>
          {orderType === "dine_in" && (
            <div className="space-y-2">
              <Label htmlFor="table-number">Table Number</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger id="table-number">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.table_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Cart is empty</p>
          </div>
        ) : (
          cartItems.map(({ item, quantity }) => (
            <div key={item.id} className="flex gap-3">
              <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center shrink-0">
                {/* Placeholder Image */}
                 <div className="h-8 w-8 bg-primary/10 rounded-full" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium line-clamp-2">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-bold">{formatCurrency(item.selling_price, currency)}</p>
                  <span className="text-xs text-muted-foreground">x {quantity}</span>
                </div>
              </div>
              <div className="flex flex-col justify-between items-end">
                <p className="text-sm font-bold">{formatCurrency(item.selling_price * quantity, currency)}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/20">
        <div className="space-y-3 mb-4">
           {/* Discount Selector */}
           <div className="flex items-center gap-2">
             <TicketPercent className="h-4 w-4 text-muted-foreground" />
             <Select value={selectedDiscountId || "none"} onValueChange={(v) => onSelectDiscount(v === "none" ? null : v)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Add Discount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Discount</SelectItem>
                  {discounts.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value, currency)})
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Discount</SelectItem>
                </SelectContent>
             </Select>
           </div>
           
           {selectedDiscountId === 'custom' && setCustomDiscount && (
             <div className="flex items-center gap-2 mt-2 bg-muted/50 p-2 rounded-md">
                <Select 
                  value={customDiscount.type} 
                  onValueChange={(v) => setCustomDiscount({ ...customDiscount, type: v as 'percentage' | 'fixed' })}
                >
                  <SelectTrigger className="w-27.5 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ({currency})</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="Value"
                  value={customDiscount.value || ''}
                  onChange={(e) => setCustomDiscount({ ...customDiscount, value: parseFloat(e.target.value) || 0 })}
                />
             </div>
           )}

           <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>

          {discount > 0 && (
             <div className="flex justify-between text-sm text-green-600">
               <span>Discount</span>
               <span>-{formatCurrency(discount, currency)}</span>
             </div>
          )}

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
               {onTaxChange && (
                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onTaxChange(0)}>
                        <span className="text-[10px]">0%</span>
                    </Button>
                     <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onTaxChange(5)}>
                        <span className="text-[10px]">5%</span>
                    </Button>
                     <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onTaxChange(10)}>
                        <span className="text-[10px]">10%</span>
                    </Button>
                 </div>
               )}
            </div>
            <span>{formatCurrency(tax, currency)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button 
                    variant="secondary" 
                    disabled={cartItems.length === 0 || isProcessing}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                 >
                    <ChefHat className="mr-2 h-4 w-4" />
                    Send to
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start" className="w-48">
                 {(kitchenDisplays.length > 0 ? kitchenDisplays : [{id: 'k', name: 'Kitchen'}, {id: 'b', name: 'Bar'}]).map(d => (
                   <DropdownMenuItem key={d.name} onClick={() => onSendToKitchen(d.name)}>
                     <ChefHat className="mr-2 h-4 w-4" />
                     {d.name}
                   </DropdownMenuItem>
                 ))}
               </DropdownMenuContent>
             </DropdownMenu>

             <Button variant="outline" onClick={onHoldOrder} disabled={cartItems.length === 0 || isProcessing}>
                Hold Order
             </Button>
            <Button className="w-full bg-primary hover:bg-primary/90 col-span-2" onClick={onPay} disabled={cartItems.length === 0 || isProcessing}>
                Pay {formatCurrency(total, currency)}
            </Button>
        </div>
      </div>
    </div>
  )
}
