"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MenuItem } from "@/types/database"
import { Plus, Minus, Image as ImageIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import NextImage from "next/image"

interface ProductCardProps {
  item: MenuItem
  quantity: number
  onAdd: () => void
  onRemove: () => void
  currency?: string
  priority?: boolean
}

export function ProductCard({ item, quantity, onAdd, onRemove, currency = "$", priority = false }: ProductCardProps) {
  const imageSrc = item.image_url?.trim() || null
  const [imgError, setImgError] = useState(false)

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md cursor-pointer active:scale-[0.98] ${quantity > 0 ? "ring-2 ring-primary" : ""}`}
      onClick={onAdd}
    >
      <div className="aspect-[4/3] bg-muted relative flex items-center justify-center">
        {imageSrc && !imgError ? (
          <NextImage
            src={imageSrc}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            priority={priority}
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-xs leading-tight line-clamp-1">{item.name}</h3>
          <p className="text-sm font-bold mt-0.5">{formatCurrency(item.selling_price, currency)}</p>
        </div>

        {quantity > 0 ? (
          <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={(e) => { e.stopPropagation(); onRemove() }}>
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="font-medium text-xs">{quantity}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={(e) => { e.stopPropagation(); onAdd() }}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button className="w-full h-8 text-xs" variant="outline" onClick={(e) => { e.stopPropagation(); onAdd() }}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
