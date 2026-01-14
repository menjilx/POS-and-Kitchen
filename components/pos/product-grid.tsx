"use client"

import { MenuItem } from "@/types/database"
import { ProductCard } from "./product-card"

interface ProductGridProps {
  items: MenuItem[]
  cart: { [itemId: string]: number }
  onAdd: (item: MenuItem) => void
  onRemove: (item: MenuItem) => void
  currency?: string
}

export function ProductGrid({ items, cart, onAdd, onRemove, currency }: ProductGridProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Menu Items</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <ProductCard
            key={item.id}
            item={item}
            quantity={cart[item.id] || 0}
            onAdd={() => onAdd(item)}
            onRemove={() => onRemove(item)}
            currency={currency}
            priority={index < 6}
          />
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No items found.
          </div>
        )}
      </div>
    </div>
  )
}
