'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export type NetworkPrinterConfig = {
  id: string
  name: string
  ipAddress: string
  port: number
  paperWidth: 58 | 80
  role: 'receipt' | 'kitchen' | 'both'
  isDefault: boolean
  openCashDrawer: boolean
  enabled: boolean
}

export type PrinterSettings = {
  method: 'browser' | 'bluetooth' | 'network'
  autoPrintOnPayment: boolean
  bluetooth: {
    enabled: boolean
    paperWidth: 58 | 80
    autoReconnect: boolean
    chunkSize: number
    chunkDelay: number
  }
  network: {
    printers: NetworkPrinterConfig[]
  }
}

export type AppSettings = {
  currency: string
  timezone: string
  tax_rate: number
  features?: {
    menu?: boolean
  }
  paymentMethods?: Array<{
    id: string
    label: string
  }>
  receipt?: {
    showLogo: boolean
    logoUrl?: string
    headerText: string
    receiptTitle: string
    address: string
    phoneNumber: string
    footerText: string
    showCashier: boolean
    showOrderNumber: boolean
    showDate: boolean
    showCustomerName: boolean
    showTax: boolean
    showDiscount: boolean
    showChange: boolean
    showReceiptAfterPayment: boolean
    showQrCode: boolean
  }
  printer?: PrinterSettings
}

type UseAppSettingsResult = {
  settings: AppSettings
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  currencySymbol: string
  formatCurrency: (value: number) => string
}

const defaultPrinterSettings: PrinterSettings = {
  method: 'browser',
  autoPrintOnPayment: false,
  bluetooth: {
    enabled: false,
    paperWidth: 80,
    autoReconnect: true,
    chunkSize: 512,
    chunkDelay: 50,
  },
  network: {
    printers: [],
  },
}

const defaultSettings: AppSettings = {
  currency: 'USD',
  timezone: 'UTC',
  tax_rate: 0,
  features: {
    menu: true,
  },
  paymentMethods: [
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Credit/Debit Card' },
    { id: 'house_account', label: 'House Account (In-house)' },
    { id: 'ewallet', label: 'E-Wallet' },
    { id: 'bank_transfer', label: 'Bank Transfer' },
  ],
  receipt: {
    showLogo: false,
    headerText: 'SHOP NAME',
    receiptTitle: 'CASH RECEIPT',
    address: 'Address: Lorem Ipsum, 23-10\nTelp. 11223344',
    phoneNumber: '11223344',
    footerText: 'THANK YOU!',
    showCashier: true,
    showOrderNumber: true,
    showDate: true,
    showCustomerName: true,
    showTax: true,
    showDiscount: true,
    showChange: true,
    showReceiptAfterPayment: true,
    showQrCode: true
  },
  printer: defaultPrinterSettings,
}

export function useAppSettings(): UseAppSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Authentication required')
        return
      }

      // Fetch settings from app_settings table
      const { data: settingsRows, error: settingsError } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['currency', 'timezone', 'tax_rate', 'payment_methods', 'receipt_settings', 'features_menu', 'printer_settings'])

      if (settingsError) throw settingsError

      const settingsMap = new Map<string, string>()
      if (settingsRows) {
        for (const row of settingsRows) {
          if (row.value !== null) {
            settingsMap.set(row.key, row.value)
          }
        }
      }

      const next: Partial<AppSettings> = {}

      const currency = settingsMap.get('currency')
      if (currency) next.currency = currency

      const timezone = settingsMap.get('timezone')
      if (timezone) next.timezone = timezone

      const taxRate = settingsMap.get('tax_rate')
      if (taxRate) next.tax_rate = Number(taxRate) || 0

      const featuresMenu = settingsMap.get('features_menu')
      if (featuresMenu !== undefined) {
        next.features = { menu: featuresMenu === 'true' }
      }

      const paymentMethodsStr = settingsMap.get('payment_methods')
      if (paymentMethodsStr) {
        try {
          const parsed = JSON.parse(paymentMethodsStr)
          if (Array.isArray(parsed) && parsed.length > 0) {
            next.paymentMethods = parsed
          }
        } catch {
          // ignore parse error
        }
      }

      const receiptStr = settingsMap.get('receipt_settings')
      if (receiptStr) {
        try {
          const parsed = JSON.parse(receiptStr)
          if (parsed && typeof parsed === 'object') {
            next.receipt = { ...defaultSettings.receipt!, ...parsed }
          }
        } catch {
          // ignore parse error
        }
      }

      const printerStr = settingsMap.get('printer_settings')
      if (printerStr) {
        try {
          const parsed = JSON.parse(printerStr)
          if (parsed && typeof parsed === 'object') {
            next.printer = { ...defaultPrinterSettings, ...parsed }
          }
        } catch {
          // ignore parse error
        }
      }

      setSettings({
        ...defaultSettings,
        ...next,
        features: next.features ?? defaultSettings.features,
        receipt: next.receipt ?? defaultSettings.receipt,
        paymentMethods: next.paymentMethods ?? defaultSettings.paymentMethods,
        printer: next.printer ?? defaultSettings.printer,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load settings'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const currencySymbol = useMemo(() => {
    try {
      const parts = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: settings.currency || 'USD',
        currencyDisplay: 'narrowSymbol',
      }).formatToParts(0)

      return parts.find((p) => p.type === 'currency')?.value ?? settings.currency
    } catch {
      return settings.currency || 'USD'
    }
  }, [settings.currency])

  const formatCurrency = useCallback(
    (value: number) => {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: settings.currency || 'USD',
        }).format(value)
      } catch {
        return String(value)
      }
    },
    [settings.currency]
  )

  return {
    settings,
    loading,
    error,
    refresh,
    currencySymbol,
    formatCurrency,
  }
}
