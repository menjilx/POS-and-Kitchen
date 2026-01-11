'use client'

import { Button } from "@/components/ui/button"
import { archiveCategory, restoreCategory } from "@/app/dashboard/ingredient-categories/actions"
import { useTransition } from "react"
import { Archive, RefreshCcw } from "lucide-react"

interface ArchiveButtonProps {
  categoryId: string
  currentStatus: 'active' | 'archived'
}

export function ArchiveButton({ categoryId, currentStatus }: ArchiveButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleAction = () => {
    startTransition(async () => {
      try {
        if (currentStatus === 'active') {
          await archiveCategory(categoryId)
        } else {
          await restoreCategory(categoryId)
        }
      } catch (error) {
        console.error('Failed to update category status:', error)
        // Ideally show a toast here
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAction}
      disabled={isPending}
      className={currentStatus === 'active' ? "text-destructive hover:text-destructive" : "text-primary hover:text-primary"}
    >
      {currentStatus === 'active' ? (
        <>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </>
      ) : (
        <>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Restore
        </>
      )}
    </Button>
  )
}
