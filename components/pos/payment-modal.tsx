"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { User, X, Receipt, Printer, Download } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useTenantSettings } from "@/hooks/use-tenant-settings"
import { PrintableReceipt } from "@/components/receipt/printable-receipt"
import { supabase } from "@/lib/supabase/client"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentComplete: (method: string, amount: number, isHouseAccount: boolean) => Promise<void>
  totalAmount: number
  customerName: string
  orderNumber: string
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  tax: number
  discount: number
  currency?: string
  isLoading?: boolean
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentComplete,
  totalAmount,
  customerName,
  orderNumber,
  items,
  subtotal,
  tax,
  discount,
  currency = "$",
  isLoading = false
}: PaymentModalProps) {
  const { settings: tenantSettings } = useTenantSettings()
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "house_account">("cash")
  const [receivedAmount, setReceivedAmount] = useState<string>("")
  const [showReceipt, setShowReceipt] = useState(false)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [cashierName, setCashierName] = useState<string>("")

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
             // Try to get name from metadata or profile
             const name = user.user_metadata?.full_name || user.email || 'Cashier'
             setCashierName(name)
        }
    }
    fetchUser()
  }, [])

  // Calculate change dynamically based on received amount and total
  const change = Math.max(0, (parseFloat(receivedAmount) || 0) - totalAmount)

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setReceivedAmount(totalAmount.toString())
      setPaymentMethod("cash")
      setShowReceipt(false)
    }
  }

  const handleNumPadClick = (value: string) => {
    if (value === "backspace") {
      setReceivedAmount(prev => prev.slice(0, -1))
    } else if (value === ".") {
      if (!receivedAmount.includes(".")) {
        setReceivedAmount(prev => prev + value)
      }
    } else {
      setReceivedAmount(prev => prev + value)
    }
  }

  const handleProcessPayment = async () => {
    const amount = parseFloat(receivedAmount) || 0
    if (amount < totalAmount && paymentMethod !== 'house_account') {
        // Maybe show error or confirmation?
        // For now, allow partial? No, standard POS usually requires full payment or split.
        // Assuming full payment for this iteration.
        return
    }

    await onPaymentComplete(paymentMethod, amount, paymentMethod === 'house_account')
    setShowReceipt(true)
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  if (showReceipt) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-100">
          {/* Printable Receipt - Hidden on screen, visible on print */}
          <div className="hidden print:block fixed inset-0 z-9999 bg-white p-0 m-0 w-full h-full overflow-hidden">
             {tenantSettings.receipt && (
                <PrintableReceipt 
                    settings={tenantSettings.receipt}
                    data={{
                        items,
                        subtotal,
                        tax,
                        discount,
                        total: totalAmount,
                        cashierName: cashierName || 'Cashier', 
                        customerName,
                        orderNumber,
                        date: new Date().toLocaleString(),
                        paymentMethod,
                        currency
                    }}
                />
             )}
          </div>
          <div className="print:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <Receipt className="h-5 w-5" /> Payment Successful
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                <Receipt className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Change: {formatCurrency(change, currency)}</h3>
            <p className="text-muted-foreground text-center">
                Payment for Order {orderNumber} has been recorded.
            </p>

            <div className="flex gap-3 w-full mt-4">
                <Button className="flex-1" variant="outline" onClick={handlePrintReceipt}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button className="flex-1" variant="outline" onClick={handlePrintReceipt}>
                    <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
            </div>
            
             <Button className="w-full" onClick={onClose}>
                Start New Order
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-225 p-0 gap-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto">
        
        {/* Left Side: Receipt Details */}
        <div className="flex-1 bg-muted/30 p-6 flex flex-col border-r">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Payment</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{orderNumber}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 shadow-sm border mb-4 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    {customerName ? customerName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                </div>
                <div>
                    <p className="font-medium">{customerName || "Walk-in Customer"}</p>
                    <p className="text-xs text-muted-foreground">Customer</p>
                </div>
            </div>

            <ScrollArea className="flex-1 -mr-4 pr-4">
                <div className="space-y-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <div className="flex gap-2">
                                <span className="text-muted-foreground">{item.quantity}x</span>
                                <span>{item.name}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(item.price * item.quantity, currency)}</span>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <Separator className="my-4" />
            
            <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(discount, currency)}</span>
                    </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>{formatCurrency(tax, currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount, currency)}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Input */}
        <div className="w-full md:w-100 p-6 flex flex-col bg-background">
            <div className="flex justify-between items-center mb-6">
                 <h3 className="font-semibold">Select Payment Method</h3>
                 <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                    <X className="h-4 w-4" />
                 </Button>
            </div>

            <div className="space-y-6 flex-1">
                <Select value={paymentMethod} onValueChange={(v: "cash" | "card" | "house_account") => setPaymentMethod(v)}>
                    <SelectTrigger className="w-full h-12 text-lg">
                        <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="house_account">House Account (In-house)</SelectItem>
                    </SelectContent>
                </Select>

                <div className="text-center py-4">
                     <span className="text-4xl font-bold tracking-tight">
                        {paymentMethod === 'house_account' ? formatCurrency(totalAmount, currency) : (receivedAmount ? `${currency}${receivedAmount}` : formatCurrency(0, currency))}
                     </span>
                     {paymentMethod === 'cash' && change > 0 && (
                         <p className="text-sm text-green-600 font-medium mt-1">
                            Change: {formatCurrency(change, currency)}
                         </p>
                     )}
                </div>

                {paymentMethod === 'cash' && (
                    <>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {[5, 10, 20, 50].map((amt) => (
                                <Button 
                                    key={amt} 
                                    variant="outline" 
                                    className="h-10 text-xs font-medium"
                                    onClick={() => setReceivedAmount(amt.toString())}
                                >
                                    {currency}{amt}
                                </Button>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    className="h-14 text-xl font-medium"
                                    onClick={() => handleNumPadClick(num.toString())}
                                >
                                    {num}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                className="h-14"
                                onClick={() => handleNumPadClick("backspace")}
                            >
                                ⌫
                            </Button>
                        </div>
                    </>
                )}
                
                {paymentMethod === 'house_account' && (
                    <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                        This order will be charged to the house account. No immediate payment required.
                    </div>
                )}
            </div>

            <div className="mt-6">
                <Button 
                    className="w-full h-12 text-lg font-bold" 
                    onClick={handleProcessPayment}
                    disabled={isLoading || (paymentMethod === 'cash' && (parseFloat(receivedAmount) || 0) < totalAmount)}
                >
                    {isLoading ? "Processing..." : `Pay ${formatCurrency(totalAmount, currency)}`}
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
