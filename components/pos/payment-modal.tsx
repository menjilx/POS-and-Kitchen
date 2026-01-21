"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { User, X, Receipt, Printer, Download, Paperclip } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useTenantSettings } from "@/hooks/use-tenant-settings"
import { normalizeReceiptSettings, PrintableReceipt, type ReceiptData } from "@/components/receipt/printable-receipt"
import { supabase } from "@/lib/supabase/client"
import { PaymentAdditionalData } from "@/types/database"
import { format } from "date-fns"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentComplete: (
    method: string,
    amount: number,
    isHouseAccount: boolean,
    additionalData?: PaymentAdditionalData,
    destination?: string
  ) => Promise<{ saleId: string; orderNumber: string }>
  totalAmount: number
  customerName: string
  orderNumber: string
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  tax: number
  discount: number
  discountName?: string
  currency?: string
  isLoading?: boolean
  kitchenDisplays?: { id: string, name: string }[]
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
  discountName,
  currency = "$",
  isLoading = false,
  kitchenDisplays = []
}: PaymentModalProps) {
  const { settings: tenantSettings } = useTenantSettings()
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [receivedAmount, setReceivedAmount] = useState<string>("")
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<string>("")
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [cashierName, setCashierName] = useState<string>("")
  const [isFirstInput, setIsFirstInput] = useState(true)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [printingReceipt, setPrintingReceipt] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const previousTitleRef = useRef<string | null>(null)

  // Card Support Info
  const [cardRef, setCardRef] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [currentDate] = useState(() => format(new Date(), "M-d-yyyy h:mm a"))

  const effectiveDestinationId =
    kitchenDisplays.some((display) => display.id === selectedDestination)
      ? selectedDestination
      : ""

  const availablePaymentMethods = useMemo(() => {
    const methods = tenantSettings.paymentMethods ?? []
    if (!paymentMethod) return methods
    const exists = methods.some((method) => method.id === paymentMethod)
    if (exists) return methods
    return [...methods, { id: paymentMethod, label: paymentMethod.replace(/_/g, ' ') }]
  }, [paymentMethod, tenantSettings.paymentMethods])

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

  useEffect(() => {
    if (!printingReceipt) return

    document.documentElement.classList.add('pos-printing-receipt')

    if (previousTitleRef.current === null) {
      previousTitleRef.current = document.title
    }

    const safeOrder = (receiptData?.orderNumber || 'receipt').replace(/[^a-z0-9_-]+/gi, '_')
    document.title = safeOrder

    const handleAfterPrint = () => setPrintingReceipt(false)
    window.addEventListener('afterprint', handleAfterPrint)

    const waitForImages = async () => {
      const root = receiptRef.current
      if (!root) return
      const images = Array.from(root.querySelectorAll('img'))
      if (images.length === 0) return

      await Promise.race([
        Promise.all(
          images.map(
            (img) =>
              new Promise<void>((resolve) => {
                if ((img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0) return resolve()
                const cleanup = () => {
                  img.removeEventListener('load', onLoad)
                  img.removeEventListener('error', onError)
                }
                const onLoad = () => {
                  cleanup()
                  resolve()
                }
                const onError = () => {
                  cleanup()
                  resolve()
                }
                img.addEventListener('load', onLoad)
                img.addEventListener('error', onError)
              })
          )
        ),
        new Promise<void>((resolve) => window.setTimeout(resolve, 1200)),
      ])
    }

    const doPrint = async () => {
      await waitForImages()
      window.print()
    }

    window.setTimeout(() => {
      void doPrint()
    }, 50)

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
      document.documentElement.classList.remove('pos-printing-receipt')
      if (previousTitleRef.current !== null) {
        document.title = previousTitleRef.current
        previousTitleRef.current = null
      }
    }
  }, [printingReceipt, receiptData?.orderNumber])

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setReceivedAmount(totalAmount.toString())
      setPaymentMethod("cash")
      setShowReceipt(false)
      setReceiptData(null)
      setIsFirstInput(true)
      setCardRef("")
      setPaymentNotes("")
      setAttachmentName(null)
      setSelectedDestination("")
    }
  }

  // Calculate change dynamically based on received amount and total
  const change = Math.max(0, (parseFloat(receivedAmount) || 0) - totalAmount)
  const showTransactionDetails = ['card', 'ewallet', 'bank_transfer'].includes(paymentMethod)
  const transactionRefLabel = paymentMethod === 'card' ? 'Transaction Reference / Auth Code' : 'Transaction Reference'

  const handleNumPadClick = (value: string) => {
    if (isFirstInput) {
        if (value === "backspace") {
            setReceivedAmount("")
        } else if (value === ".") {
            setReceivedAmount("0.")
        } else {
            setReceivedAmount(value)
        }
        setIsFirstInput(false)
        return
    }

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

    // Append card details to a structured note if card
    // Note: This assumes onPaymentComplete can handle or we modify how we pass it.
    // Since we can't easily change the prop signature without breaking callers, 
    // we might need to handle it internally or assume the parent will handle it if we pass extra args (JS allows it)
    // But better to perhaps append to notes? 
    // Actually, onPaymentComplete signature in props is: (method, amount, isHouseAccount) => Promise<void>
    // We can't pass extra data easily without changing parent. 
    // However, the user wants to "show some field". 
    // I will implement the UI fields now. 
    
    const snapshot: ReceiptData = {
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      tax,
      discount,
      discountName,
      total: totalAmount,
      cashierName: cashierName || 'Cashier',
      customerName,
      orderNumber,
      date: new Date().toLocaleString(),
      paymentMethod,
      paymentStatus: paymentMethod === 'house_account' ? 'pending' : 'paid',
      paymentRef: cardRef,
      receivedAmount: paymentMethod === 'cash' ? amount : undefined,
      changeAmount: paymentMethod === 'cash' ? change : undefined,
      currency: tenantSettings.currency || 'USD',
    }

    const { orderNumber: resolvedOrderNumber } = await onPaymentComplete(paymentMethod, amount, paymentMethod === 'house_account', {
      ref: cardRef,
      notes: paymentNotes,
      attachment: attachmentName,
      receivedAmount: paymentMethod === 'cash' ? amount : undefined,
      changeAmount: paymentMethod === 'cash' ? change : undefined,
    }, effectiveDestinationId)

    setReceiptData({
      ...snapshot,
      orderNumber: resolvedOrderNumber || snapshot.orderNumber,
    })

    const showReceiptAfterPayment = tenantSettings.receipt?.showReceiptAfterPayment ?? true

    if (showReceiptAfterPayment) {
      setShowReceipt(true)
    } else {
      onClose()
    }
  }

  const receiptSettings = normalizeReceiptSettings(tenantSettings.receipt)

  const handlePrintReceipt = () => {
    if (!receiptData) return
    setPrintingReceipt(true)
  }

  const handleDownloadReceipt = () => {
    if (!receiptData) return
    setPrintingReceipt(true)
  }

  const canUseDom = typeof document !== "undefined"

  const receiptPortal =
    canUseDom && receiptData
      ? createPortal(
          <>
            <div
              className={
                printingReceipt
                  ? "pos-receipt-print-root fixed inset-0 z-99999 bg-white overflow-auto"
                  : "pos-receipt-print-root hidden print:block print:fixed print:inset-0 print:z-99999 print:bg-white print:overflow-visible"
              }
            >
              <PrintableReceipt ref={receiptRef} settings={receiptSettings} data={receiptData} />
            </div>
            <style>{`
              @media print {
                html.pos-printing-receipt body * {
                  visibility: hidden !important;
                }

                html.pos-printing-receipt .pos-receipt-print-root,
                html.pos-printing-receipt .pos-receipt-print-root * {
                  visibility: visible !important;
                }

                html.pos-printing-receipt .pos-receipt-print-root {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  display: block !important;
                }

                @page {
                  margin: 0;
                  size: auto;
                }
              }
            `}</style>
          </>,
          document.body
        )
      : null

  if (showReceipt) {
    return (
      <>
        {receiptPortal}
          <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-100 pos-payment-dialog print:hidden">
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
            <h3 className="text-xl font-bold">Change: {formatCurrency(receiptData?.changeAmount ?? 0, currency)}</h3>
            <p className="text-muted-foreground text-center">
                Payment for Order {receiptData?.orderNumber || orderNumber} has been recorded.
            </p>

            <div className="flex gap-3 w-full mt-4">
                <Button className="flex-1" variant="outline" onClick={handlePrintReceipt} disabled={!receiptData}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button className="flex-1" variant="outline" onClick={handleDownloadReceipt} disabled={!receiptData}>
                    <Download className="mr-2 h-4 w-4" /> Download
                </Button>
            </div>
            
             <Button className="w-full" onClick={onClose}>
                Start New Order
            </Button>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-225 p-0 gap-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto">
        
        {/* Left Side: Receipt Details */}
        <div className="flex-1 bg-muted/30 p-6 flex flex-col border-r">
          <div className="mb-6">
            <DialogHeader className="text-left p-0 space-y-0">
                <DialogTitle className="text-2xl font-bold mb-1">Payment</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{orderNumber}</span>
                <span>•</span>
                <span>{currentDate}</span>
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
                 <h3 className="font-semibold">Payment Details</h3>
                 <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                    <X className="h-4 w-4" />
                 </Button>
            </div>

            <div className="space-y-6 flex-1">
                {kitchenDisplays.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Send Order To</Label>
                    <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                        <SelectTrigger className="w-full h-12 text-lg">
                            <SelectValue placeholder="Select Display" />
                        </SelectTrigger>
                        <SelectContent>
                            {kitchenDisplays.map(d => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                    <Label className="text-base font-semibold">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
                        <SelectTrigger className="w-full h-12 text-lg">
                            <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                            {availablePaymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="payment-notes" className="text-base font-semibold">Notes</Label>
                    <textarea
                        id="payment-notes"
                        placeholder="Optional notes..."
                        value={paymentNotes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPaymentNotes(e.target.value)}
                        className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    />
                </div>

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

                {showTransactionDetails && (
                    <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                         <div className="space-y-2">
                            <Label htmlFor="card-ref" className="text-xs font-medium text-muted-foreground">{transactionRefLabel}</Label>
                            <Input 
                                id="card-ref" 
                                placeholder="e.g. TXN-123456" 
                                value={cardRef} 
                                onChange={(e) => setCardRef(e.target.value)}
                                className="h-9 bg-background"
                            />
                         </div>
                         
                         <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Attachment</Label>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="w-full h-9 border-dashed text-muted-foreground justify-start" onClick={() => document.getElementById('file-upload')?.click()}>
                                    <Paperclip className="mr-2 h-4 w-4" />
                                    {attachmentName || "Attach receipt image..."}
                                </Button>
                                <input 
                                    type="file" 
                                    id="file-upload" 
                                    className="hidden" 
                                    onChange={(e) => setAttachmentName(e.target.files?.[0]?.name || null)}
                                />
                            </div>
                         </div>
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
