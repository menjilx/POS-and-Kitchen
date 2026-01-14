"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MenuItem } from "@/types/database"
import { Plus, Minus, Image as ImageIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import NextImage from "next/image"
import { useMemo } from "react"

interface ProductCardProps {
  item: MenuItem
  quantity: number
  onAdd: () => void
  onRemove: () => void
  currency?: string
  priority?: boolean
}

export function ProductCard({ item, quantity, onAdd, onRemove, currency = "$", priority = false }: ProductCardProps) {
  const imageSrc = useMemo(() => {
    const raw = item.image_url?.trim()
    if (!raw) return null
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return raw.startsWith("/") ? raw : `/${raw}`

    if (raw.startsWith("/storage/")) return `${supabaseUrl}${raw}`
    if (raw.startsWith("storage/")) return `${supabaseUrl}/${raw}`
    if (raw.startsWith("menu-images/")) return `${supabaseUrl}/storage/v1/object/public/${raw}`

    const cleaned = raw.replace(/^\/+/, "")
    return `${supabaseUrl}/storage/v1/object/public/menu-images/${cleaned}`
  }, [item.image_url])

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${quantity > 0 ? "ring-2 ring-primary" : ""}`}>
      <div className="aspect-4/3 bg-muted relative flex items-center justify-center">
        {imageSrc ? (
          <NextImage 
            src={imageSrc} 
            alt={item.name} 
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-muted-foreground opacity-50" />
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-1 mb-1">{item.name}</h3>
        <p className="text-lg font-bold mb-3">{formatCurrency(item.selling_price, currency)}</p>
        
        {quantity > 0 ? (
          <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={onRemove}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm">{quantity}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={onAdd}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button className="w-full" variant="outline" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
