'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  Settings, 
  Monitor, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Save, 
  Loader2,
  TicketPercent,
  Receipt as ReceiptIcon,
  Upload
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useToast } from '@/hooks/use-toast'
import { PrintableReceipt, ReceiptSettings } from '@/components/receipt/printable-receipt'
import { uploadFile } from '@/app/actions/storage'

interface TenantSettings {
  currency: string
  timezone: string
  tax_rate: number
  receipt?: ReceiptSettings
}

interface KitchenDisplay {
  id: string
  name: string
  token: string
  created_at: string
}

interface Discount {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  is_active: boolean
}

export default function SettingsPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<TenantSettings>({
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
      showChange: true,
      showReceiptAfterPayment: true,
      showQrCode: true
    }
  })
  const [displays, setDisplays] = useState<KitchenDisplay[]>([])
  const [newDisplayName, setNewDisplayName] = useState('')
  const [creatingDisplay, setCreatingDisplay] = useState(false)
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [newDiscount, setNewDiscount] = useState<{name: string, type: 'percentage' | 'fixed', value: string}>({
    name: '',
    type: 'percentage',
    value: ''
  })
  const [creatingDiscount, setCreatingDiscount] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get tenant info
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
      
      if (!userData?.tenant_id) return
      setTenantId(userData.tenant_id)

      // Fetch tenant settings
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', userData.tenant_id)
        .single()

      if (tenantData?.settings) {
        const loadedSettings = tenantData.settings as unknown as TenantSettings
        setSettings(prev => ({
          ...prev,
          ...loadedSettings,
          receipt: {
            ...prev.receipt!,
            ...loadedSettings.receipt
          }
        }))
      }

      // Fetch kitchen displays
      const { data: displaysData } = await supabase
        .from('kitchen_displays')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })

      if (displaysData) {
        setDisplays(displaysData)
      }

      // Fetch discounts
      const { data: discountsData } = await supabase
        .from('discounts')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false })

      if (discountsData) {
        setDiscounts(discountsData as Discount[])
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'general' || tab === 'kds' || tab === 'discounts') {
      setActiveTab(tab)
    }
  }, [searchParams])

  const currencyOptions = useMemo(() => {
    type IntlSupportedValuesKey = 'currency' | 'timeZone'
    type IntlSupportedValuesOf = (key: IntlSupportedValuesKey) => string[]
    type IntlWithSupportedValuesOf = typeof Intl & { supportedValuesOf?: IntlSupportedValuesOf }

    const supportedValuesOf = (Intl as IntlWithSupportedValuesOf).supportedValuesOf

    const fallback = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'SGD', 'INR', 'KRW']
    const options = supportedValuesOf ? supportedValuesOf('currency') : fallback
    const normalized = Array.from(new Set(options.map((c) => c.toUpperCase())))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))

    if (settings.currency && !normalized.includes(settings.currency.toUpperCase())) {
      return [settings.currency.toUpperCase(), ...normalized]
    }

    return normalized
  }, [settings.currency])

  const timezoneOptions = useMemo(() => {
    type IntlSupportedValuesKey = 'currency' | 'timeZone'
    type IntlSupportedValuesOf = (key: IntlSupportedValuesKey) => string[]
    type IntlWithSupportedValuesOf = typeof Intl & { supportedValuesOf?: IntlSupportedValuesOf }

    const supportedValuesOf = (Intl as IntlWithSupportedValuesOf).supportedValuesOf

    const fallback = [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Australia/Sydney',
    ]

    const options = supportedValuesOf ? supportedValuesOf('timeZone') : fallback
    const normalized = Array.from(new Set(options))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))

    const current = settings.timezone
    const withCurrent = current && !normalized.includes(current) ? [current, ...normalized] : normalized

    if (!withCurrent.includes('UTC')) return ['UTC', ...withCurrent]
    if (withCurrent[0] !== 'UTC') return ['UTC', ...withCurrent.filter((z) => z !== 'UTC')]
    return withCurrent
  }, [settings.timezone])

  const handleSaveSettings = async () => {
    if (!tenantId) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update({ settings: settings as unknown as Record<string, unknown> })
        .eq('id', tenantId)
        .select('settings')
        .maybeSingle()

      if (error) throw error
      if (!data) {
        throw new Error('Tenant settings update was blocked (RLS)')
      }

      if (data.settings) {
        setSettings((prev) => {
          const next = data.settings as unknown as TenantSettings
          const nextReceipt = (next.receipt ?? {}) as Partial<ReceiptSettings>
          return {
            ...prev,
            ...next,
            receipt: prev.receipt
              ? {
                  ...prev.receipt,
                  ...nextReceipt,
                }
              : (next.receipt as ReceiptSettings | undefined),
          }
        })
      }

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings. Your role may not have permission.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDisplay = async () => {
    if (!tenantId || !newDisplayName.trim()) return
    setCreatingDisplay(true)
    try {
      const { data, error } = await supabase
        .from('kitchen_displays')
        .insert({
          tenant_id: tenantId,
          name: newDisplayName,
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setDisplays([data, ...displays])
        setNewDisplayName('')
        toast({
          title: 'Success',
          description: 'Kitchen Display created',
        })
      }
    } catch (error) {
      console.error('Error creating display:', error)
      toast({
        title: 'Error',
        description: 'Failed to create display',
        variant: 'destructive',
      })
    } finally {
      setCreatingDisplay(false)
    }
  }

  const handleDeleteDisplay = async (id: string) => {
    if (!confirm('Are you sure you want to delete this display?')) return
    try {
      const { error } = await supabase
        .from('kitchen_displays')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDisplays(displays.filter(d => d.id !== id))
      toast({
        title: 'Success',
        description: 'Display deleted',
      })
    } catch (error) {
      console.error('Error deleting display:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete display',
        variant: 'destructive',
      })
    }
  }

  const handleCreateDiscount = async () => {
    if (!tenantId || !newDiscount.name.trim() || !newDiscount.value) return
    setCreatingDiscount(true)
    try {
      const { data, error } = await supabase
        .from('discounts')
        .insert({
          tenant_id: tenantId,
          name: newDiscount.name,
          type: newDiscount.type,
          value: parseFloat(newDiscount.value),
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setDiscounts([data as Discount, ...discounts])
        setNewDiscount({ name: '', type: 'percentage', value: '' })
        toast({
          title: 'Success',
          description: 'Discount created',
        })
      }
    } catch (error) {
      console.error('Error creating discount:', error)
      toast({
        title: 'Error',
        description: 'Failed to create discount',
        variant: 'destructive',
      })
    } finally {
      setCreatingDiscount(false)
    }
  }

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDiscounts(discounts.filter(d => d.id !== id))
      toast({
        title: 'Success',
        description: 'Discount deleted',
      })
    } catch (error) {
      console.error('Error deleting discount:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete discount',
        variant: 'destructive',
      })
    }
  }

  const handleRefreshToken = async (id: string) => {
    if (!confirm('This will invalidate the current token. Continue?')) return
    try {
      // We can't use gen_random_uuid() in client-side update easily without RPC, 
      // but we can let the server handle it or generate one here if we import uuid.
      // For simplicity let's assume we trigger an update that changes the token.
      // Since we don't have uuid package imported here, let's rely on SQL default if we were inserting,
      // but for update we need a new value.
      // Let's use crypto.randomUUID() if available
      const newToken = crypto.randomUUID()
      
      const { error } = await supabase
        .from('kitchen_displays')
        .update({ token: newToken })
        .eq('id', id)

      if (error) throw error

      setDisplays(displays.map(d => d.id === id ? { ...d, token: newToken } : d))
      toast({
        title: 'Success',
        description: 'Token refreshed',
      })
    } catch (error) {
      console.error('Error refreshing token:', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh token',
        variant: 'destructive',
      })
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!tenantId) {
        toast({
            title: 'Error',
            description: 'Tenant ID not found',
            variant: 'destructive'
        })
        return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const result = await uploadFile(formData)
      
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed')
      }

      setSettings({
        ...settings,
        receipt: { ...settings.receipt!, logoUrl: result.url }
      })

      toast({
        title: 'Success',
        description: 'Logo uploaded successfully',
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive',
      })
    } finally {
      setUploadingLogo(false)
      // Reset the input
      e.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-muted-foreground">Manage your restaurant settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'general'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Settings size={20} />
              <span>General</span>
            </button>
            <button
              onClick={() => setActiveTab('kds')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'kds'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Monitor size={20} />
              <span>Kitchen Displays</span>
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'discounts'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <TicketPercent size={20} />
              <span>Discounts</span>
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'receipt'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ReceiptIcon size={20} />
              <span>Receipt</span>
            </button>
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <h2 className="text-xl font-bold text-slate-800">General Settings</h2>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {timezoneOptions.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.tax_rate}
                    onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kds' && (
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Kitchen Displays</h2>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Display Name (e.g. Main Kitchen)"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleCreateDisplay}
                  disabled={creatingDisplay || !newDisplayName}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
                >
                  {creatingDisplay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                  Create
                </button>
              </div>

              <div className="space-y-4">
                {displays.map((display) => (
                  <div key={display.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{display.name}</h3>
                        <p className="text-sm text-muted-foreground">Created: {new Date(display.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRefreshToken(display.id)}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                          title="Refresh Token"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteDisplay(display.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                          title="Delete Display"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md">
                      <div>
                        <p className="text-sm font-medium mb-2">Connection Link</p>
                        <div className="p-2 bg-white border rounded text-xs font-mono break-all">
                          {`${window.location.origin}/kds?token=${display.token}`}
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="bg-white p-2 rounded shadow-sm">
                          <QRCodeSVG 
                            value={`${window.location.origin}/kds?token=${display.token}`}
                            size={100}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {displays.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No kitchen displays created yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'discounts' && (
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Discounts</h2>
              </div>

              <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-lg">
                <input
                  type="text"
                  placeholder="Discount Name (e.g. Employee Discount)"
                  value={newDiscount.name}
                  onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <select
                  value={newDiscount.type}
                  onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value as 'percentage' | 'fixed' })}
                  className="px-3 py-2 border rounded-md w-full md:w-32"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
                <input
                  type="number"
                  placeholder="Value"
                  value={newDiscount.value}
                  onChange={(e) => setNewDiscount({ ...newDiscount, value: e.target.value })}
                  className="w-full md:w-24 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleCreateDiscount}
                  disabled={creatingDiscount || !newDiscount.name || !newDiscount.value}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 min-w-25"
                >
                  {creatingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                  Add
                </button>
              </div>

              <div className="space-y-4">
                {discounts.map((discount) => (
                  <div key={discount.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <h3 className="font-bold text-lg">{discount.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Type: {discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'} • 
                        Value: {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                      title="Delete Discount"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {discounts.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No discounts created yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'receipt' && settings.receipt && (
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Left Column: Settings Form */}
              <div className="flex-1 bg-white rounded-lg border p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">Receipt Settings</h2>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Header Section */}
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-semibold text-lg">Header</h3>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show Logo</label>
                      <input
                        type="checkbox"
                        checked={settings.receipt.showLogo}
                        onChange={(e) => setSettings({
                          ...settings,
                          receipt: { ...settings.receipt!, showLogo: e.target.checked }
                        })}
                        className="h-5 w-5"
                      />
                    </div>
                    {settings.receipt.showLogo && (
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Logo</label>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                                <label 
                                    htmlFor="logo-upload" 
                                    className={`flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border rounded-md cursor-pointer text-sm font-medium transition-colors ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {uploadingLogo ? 'Uploading...' : 'Upload Image'}
                                </label>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    disabled={uploadingLogo}
                                />
                                <span className="text-xs text-muted-foreground">or enter URL below</span>
                            </div>
                            <input
                            type="text"
                            value={settings.receipt.logoUrl || ''}
                            onChange={(e) => setSettings({
                                ...settings,
                                receipt: { ...settings.receipt!, logoUrl: e.target.value }
                            })}
                            placeholder="https://example.com/logo.png"
                            className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Header Text</label>
                      <input
                        type="text"
                        value={settings.receipt.headerText}
                        onChange={(e) => setSettings({
                          ...settings,
                          receipt: { ...settings.receipt!, headerText: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Address</label>
                      <textarea
                        value={settings.receipt.address}
                        onChange={(e) => setSettings({
                          ...settings,
                          receipt: { ...settings.receipt!, address: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-md min-h-20"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <input
                        type="text"
                        value={settings.receipt.phoneNumber}
                        onChange={(e) => setSettings({
                          ...settings,
                          receipt: { ...settings.receipt!, phoneNumber: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  {/* Content Options */}
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-semibold text-lg">Content Options</h3>
                    {[
                      { label: 'Show Cashier Name', key: 'showCashier' },
                      { label: 'Show Order Number', key: 'showOrderNumber' },
                      { label: 'Show Date', key: 'showDate' },
                      { label: 'Show Customer Name', key: 'showCustomerName' },
                      { label: 'Show Tax', key: 'showTax' },
                      { label: 'Show Discount', key: 'showDiscount' },
                      { label: 'Show Change', key: 'showChange' },
                      { label: 'Show Receipt After Payment', key: 'showReceiptAfterPayment' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <label className="text-sm font-medium">{item.label}</label>
                        <input
                          type="checkbox"
                          checked={settings.receipt![item.key as keyof ReceiptSettings] as boolean}
                          onChange={(e) => setSettings({
                            ...settings,
                            receipt: { ...settings.receipt!, [item.key]: e.target.checked }
                          })}
                          className="h-5 w-5"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Footer Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Footer</h3>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Footer Text</label>
                      <textarea
                        value={settings.receipt.footerText}
                        onChange={(e) => setSettings({
                          ...settings,
                          receipt: { ...settings.receipt!, footerText: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-md min-h-20"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Show QR Code</label>
                      <input
                        type="checkbox"
                        checked={settings.receipt.showQrCode}
                        onChange={(e) => setSettings({
                          ...settings,
                          receipt: { ...settings.receipt!, showQrCode: e.target.checked }
                        })}
                        className="h-5 w-5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Preview */}
              <div className="xl:w-100 shrink-0">
                <div className="bg-slate-100 rounded-lg border p-6 sticky top-6">
                  <h3 className="font-semibold text-lg mb-4 text-center">Live Preview</h3>
                  <div className="bg-white shadow-lg mx-auto overflow-hidden">
                    <PrintableReceipt
                      settings={settings.receipt}
                      data={{
                        items: [
                          { name: 'Double Cheeseburger', quantity: 1, price: 12.99 },
                          { name: 'French Fries (L)', quantity: 2, price: 4.50 },
                          { name: 'Coke Zero', quantity: 2, price: 2.00 },
                        ],
                        subtotal: 25.99,
                        tax: 2.08,
                        discount: 0,
                        total: 28.07,
                        cashierName: 'Sarah M.',
                        customerName: 'John Doe',
                        orderNumber: '#ORD-000000042',
                        date: new Date().toLocaleString(),
                        paymentMethod: 'cash',
                        receivedAmount: 30,
                        changeAmount: 1.93,
                        currency: settings.currency
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
