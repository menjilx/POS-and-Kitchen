"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewSalePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/pos")
  }, [router])

  return <div className="p-6 text-sm text-muted-foreground">Redirecting…</div>
}
