"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, X, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export interface SessionSummary {
  totalSales: number
  cashSales: number
  cardSales: number
  transactionCount: number
  refundedAmount: number
  refundedCount: number
  voidedAmount: number
  voidedCount: number
  discountAmount: number
  taxAmount: number
  netSales: number
}

interface RegisterModalProps {
  isOpen: boolean
  mode: 'open' | 'close'
  onSubmit: (amount: number, notes: string) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  sessionSummary?: SessionSummary | null
  onDownloadReport?: () => void
  currency?: string
  openingTime?: string | null
}

export function RegisterModal({ 
  isOpen, 
  mode, 
  onSubmit, 
  onCancel, 
  isLoading, 
  sessionSummary, 
  onDownloadReport,
  currency = "USD",
  openingTime
}: RegisterModalProps) {
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(parseFloat(amount), notes)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={onCancel}
              disabled={isLoading}
              aria-label={mode === "open" ? "Exit POS" : "Close"}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <CardTitle>{mode === 'open' ? 'Open Register' : 'Close Register'}</CardTitle>
          <CardDescription>
            {mode === 'open' 
              ? 'Enter the opening cash amount to start your shift.' 
              : 'Enter the closing cash amount to end your shift.'}
            {mode === 'close' && openingTime && (
               <div className="mt-1 text-xs text-muted-foreground">
                   Session Started: {new Date(openingTime).toLocaleString()}
               </div>
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {mode === 'close' && sessionSummary && (
                <div className="bg-muted p-4 rounded-lg space-y-2 mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                        <span>Session Summary</span>
                        {onDownloadReport && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={onDownloadReport} 
                                title="Download Session Report"
                                className="h-6 text-xs"
                            >
                                <Download className="h-3 w-3 mr-1" />
                                Download Report
                            </Button>
                        )}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                        <span className="text-muted-foreground">Total Sales:</span>
                        <span className="font-bold text-right">{formatCurrency(sessionSummary.totalSales, currency)}</span>
                        
                        <span className="text-muted-foreground">Net Sales:</span>
                        <span className="font-bold text-right">{formatCurrency(sessionSummary.netSales, currency)}</span>

                        <span className="text-muted-foreground">Cash Sales:</span>
                        <span className="text-right">{formatCurrency(sessionSummary.cashSales, currency)}</span>
                        
                        <span className="text-muted-foreground">Card Sales:</span>
                        <span className="text-right">{formatCurrency(sessionSummary.cardSales, currency)}</span>

                        <div className="col-span-2 border-t my-1"></div>

                        <span className="text-muted-foreground">Refunds ({sessionSummary.refundedCount}):</span>
                        <span className="text-right text-red-500">-{formatCurrency(sessionSummary.refundedAmount, currency)}</span>

                        <span className="text-muted-foreground">Voids ({sessionSummary.voidedCount}):</span>
                        <span className="text-right text-orange-500">{formatCurrency(sessionSummary.voidedAmount, currency)}</span>

                        <div className="col-span-2 border-t my-1"></div>

                        <span className="text-muted-foreground">Discounts:</span>
                        <span className="text-right text-green-600">-{formatCurrency(sessionSummary.discountAmount, currency)}</span>

                        <span className="text-muted-foreground">Tax:</span>
                        <span className="text-right">{formatCurrency(sessionSummary.taxAmount, currency)}</span>
                        
                        <div className="col-span-2 border-t my-1"></div>

                        <span className="text-muted-foreground">Total Transactions:</span>
                        <span className="text-right">{sessionSummary.transactionCount}</span>
                    </div>
                </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <div className="flex gap-2">
                {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    {mode === "open" ? "Exit POS" : "Cancel"}
                </Button>
                )}
                <Button type="submit" disabled={isLoading || !amount}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'open' ? 'Open Register' : 'Close Register'}
                </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
