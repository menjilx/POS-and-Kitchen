import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string, locales?: string | string[]) {
  try {
    return new Intl.NumberFormat(locales, {
      style: "currency",
      currency: currency || "USD",
    }).format(value)
  } catch {
    return String(value)
  }
}

export function getCurrencySymbol(currency: string, locales?: string | string[]) {
  try {
    const parts = new Intl.NumberFormat(locales, {
      style: "currency",
      currency: currency || "USD",
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0)

    return parts.find((p) => p.type === "currency")?.value ?? currency
  } catch {
    return currency
  }
}
