"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const VOID_REASONS = [
  "Customer changed mind",
  "Duplicate order",
  "Wrong items",
  "Other",
] as const

interface VoidRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
  orderNumber: string
  mode: "request" | "direct"
}

export function VoidRequestDialog({
  isOpen,
  onClose,
  onSubmit,
  orderNumber,
  mode,
}: VoidRequestDialogProps) {
  const [selectedReason, setSelectedReason] = useState("")
  const [freeText, setFreeText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const reason = selectedReason === "Other"
      ? freeText.trim()
      : `${selectedReason}${freeText.trim() ? ` — ${freeText.trim()}` : ""}`

    if (!reason) return

    setIsSubmitting(true)
    try {
      await onSubmit(reason)
      handleClose()
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedReason("")
    setFreeText("")
    onClose()
  }

  const canSubmit = selectedReason && (selectedReason !== "Other" || freeText.trim().length > 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "direct" ? "Void Order" : "Request Void"}
          </DialogTitle>
          <DialogDescription>
            {mode === "direct"
              ? `Void order ${orderNumber}. This action cannot be undone.`
              : `Submit a void request for order ${orderNumber}. A manager will need to approve it.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {VOID_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{selectedReason === "Other" ? "Details (required)" : "Additional details (optional)"}</Label>
            <Textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Provide details..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {mode === "direct" ? "Void Order" : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
