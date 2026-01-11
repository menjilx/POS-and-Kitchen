'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export type TenantSettings = {
  currency: string
  timezone: string
  tax_rate: number
  receipt?: {
    showLogo: boolean
    logoUrl?: string
    headerText: string
    address: string
    phoneNumber: string
    footerText: string
    showCashier: boolean
    showOrderNumber: boolean
    showDate: boolean
    showCustomerName: boolean
    showTax: boolean
    showDiscount: boolean
    showQrCode: boolean
  }
}

type UseTenantSettingsResult = {
  settings: TenantSettings
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  currencySymbol: string
  formatCurrency: (value: number) => string
}

const defaultSettings: TenantSettings = {
  currency: 'USD',
  timezone: 'UTC',
  tax_rate: 0,
  receipt: {
    showLogo: false,
    headerText: 'SHOP NAME',
    address: 'Address: Lorem Ipsum, 23-10\nTelp. 11223344',
    phoneNumber: '11223344',
    footerText: 'THANK YOU!',
    showCashier: true,
    showOrderNumber: true,
    showDate: true,
    showCustomerName: true,
    showTax: true,
    showDiscount: true,
    showQrCode: true
  }
}

export function useTenantSettings(): UseTenantSettingsResult {
  const [settings, setSettings] = useState<TenantSettings>(defaultSettings)
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

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (userError) throw userError
      if (!userData?.tenant_id) {
        setError('No tenant found')
        return
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', userData.tenant_id)
        .single()

      if (tenantError) throw tenantError

      if (tenantData?.settings) {
        setSettings(tenantData.settings as unknown as TenantSettings)
      } else {
        setSettings(defaultSettings)
      }
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

