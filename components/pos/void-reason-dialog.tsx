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
import { Input } from "@/components/ui/input"
import { Ban } from "lucide-react"

const PRESET_REASONS = [
  "Customer left",
  "Duplicate order",
  "Changed mind",
  "Incorrect order",
] as const

interface VoidReasonDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  orderNumber: string
}

export function VoidReasonDialog({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
}: VoidReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [customReason, setCustomReason] = useState("")
  const isOther = selectedReason === "Other"

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      setTimeout(() => {
        setSelectedReason(null)
        setCustomReason("")
      }, 300)
    }
  }

  const handleConfirm = () => {
    const reason = isOther ? customReason.trim() : selectedReason
    if (!reason) return
    onConfirm(reason)
    setSelectedReason(null)
    setCustomReason("")
  }

  const canConfirm = isOther ? customReason.trim().length > 0 : !!selectedReason

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-orange-500" />
            Void Order {orderNumber}
          </DialogTitle>
          <DialogDescription>
            Select a reason for voiding this order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {PRESET_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                selectedReason === reason
                  ? "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-600"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              {reason}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedReason("Other")}
            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
              isOther
                ? "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-600"
                : "border-border hover:bg-muted/50"
            }`}
          >
            Other
          </button>
          {isOther && (
            <Input
              placeholder="Enter reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              autoFocus
            />
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            <Ban className="h-4 w-4 mr-2" />
            Void Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
