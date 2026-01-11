"use client"

import { Button } from "@/components/ui/button"
import { Coffee, Utensils, Wine, Pizza, Fish, Carrot, Soup, IceCream } from "lucide-react"

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string | null
  onSelect: (category: string | null) => void
}

const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase()
  if (lower.includes("breakfast")) return <Coffee className="h-4 w-4" />
  if (lower.includes("beverage") || lower.includes("drink")) return <Wine className="h-4 w-4" />
  if (lower.includes("pasta")) return <Utensils className="h-4 w-4" />
  if (lower.includes("pizza")) return <Pizza className="h-4 w-4" />
  if (lower.includes("sushi") || lower.includes("fish") || lower.includes("seafood")) return <Fish className="h-4 w-4" />
  if (lower.includes("salad") || lower.includes("vegie") || lower.includes("vegetable")) return <Carrot className="h-4 w-4" />
  if (lower.includes("soup") || lower.includes("bowl")) return <Soup className="h-4 w-4" />
  if (lower.includes("dessert") || lower.includes("cake")) return <IceCream className="h-4 w-4" />
  return <Utensils className="h-4 w-4" />
}

export function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Categories</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          className="flex flex-col items-center justify-center h-auto py-3 px-4 min-w-25 gap-2"
          onClick={() => onSelect(null)}
        >
          <Utensils className="h-6 w-6" />
          <span>All</span>
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="min-w-25 h-12 flex-col gap-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            onClick={() => onSelect(category)}
          >
            <div className="[&>svg]:h-6 [&>svg]:w-6">
               {getCategoryIcon(category)}
            </div>
            <span className="capitalize">{category}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
