"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, X } from "lucide-react"

interface RegisterModalProps {
  isOpen: boolean
  mode: 'open' | 'close'
  onSubmit: (amount: number, notes: string) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function RegisterModal({ isOpen, mode, onSubmit, onCancel, isLoading }: RegisterModalProps) {
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
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                {mode === "open" ? "Exit POS" : "Cancel"}
              </Button>
            )}
            <Button type="submit" disabled={isLoading || !amount}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'open' ? 'Open Register' : 'Close Register'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
