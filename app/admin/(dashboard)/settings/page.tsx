'use client'

import { useState, useEffect } from 'react'
import { useAppSettings } from '@/hooks/useAppSettings'
import { Settings, Clock, Bell, Mail, Shield, Utensils, Monitor, Save, Loader2 } from 'lucide-react'

const categories = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'business', label: 'Business', icon: Utensils },
  { id: 'restaurant', label: 'Restaurant', icon: Clock },
  { id: 'kds', label: 'Kitchen Display', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'smtp', label: 'Email (SMTP)', icon: Mail },
  { id: 'security', label: 'Security', icon: Shield },
]

const popularTimezones = [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'America/Denver', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Dubai',
  'Australia/Sydney', 'Pacific/Auckland'
]

const popularCurrencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'SGD', 'INR', 'KRW', 'BRL', 'MXN'
]

const dateFormats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD']
const languages = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko']

interface SettingFieldProps {
  label: string
  description?: string
  children: React.ReactNode
  error?: string
}

function SettingField({ label, description, children, error }: SettingFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, className }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white ${className || ''}`}
    />
  )
}

function Select({ value, onChange, options, placeholder, className }: any) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent ${className || ''}`}
      >
        <option value="">{placeholder}</option>
        {options?.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
    </label>
  )
}

export default function SettingsPage() {
  const { settings, loading, bulkUpdateSettings, getSetting } = useAppSettings()
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (settings) {
      const data: Record<string, any> = {}
      Object.entries(settings).forEach(([key, setting]) => {
        let value: any = setting.value
        if (setting.value_type === 'boolean') {
          value = setting.value === 'true'
        } else if (setting.value_type === 'number') {
          value = parseFloat(setting.value) || 0
        }
        data[key] = value
      })
      setFormData(data)
    }
  }, [settings])

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validateForm = (category: string): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (category === 'general') {
      if (!formData.app_name?.trim()) newErrors.app_name = 'App name is required'
      if (!formData.timezone) newErrors.timezone = 'Timezone is required'
    }
    
    if (category === 'business') {
      if (!formData.currency) newErrors.currency = 'Currency is required'
      const taxRate = parseFloat(formData.tax_rate)
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        newErrors.tax_rate = 'Tax rate must be between 0 and 100'
      }
    }
    
    if (category === 'restaurant') {
      if (!formData.opening_time || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.opening_time)) {
        newErrors.opening_time = 'Invalid time format (HH:MM)'
      }
      if (!formData.closing_time || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.closing_time)) {
        newErrors.closing_time = 'Invalid time format (HH:MM)'
      }
    }
    
    if (category === 'smtp') {
      if (formData.smtp_from_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.smtp_from_email)) {
        newErrors.smtp_from_email = 'Invalid email format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (category: string) => {
    if (!validateForm(category)) return

    setSaving(true)
    const categorySettings = Object.entries(settings || {})
      .filter(([, setting]) => setting.category === category)
      .map(([key]) => key)

    const updates: Record<string, string> = {}
    categorySettings.forEach(key => {
      let value = formData[key]
      if (typeof value === 'boolean') {
        value = value.toString()
      }
      updates[key] = String(value)
    })

    const result = await bulkUpdateSettings(updates)
    setSaving(false)

    if (result.success) {
      alert(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully!`)
    } else {
      alert(`Failed to save settings: ${result.error}`)
    }
  }

  const getCategorySettings = (category: string) => {
    if (!settings) return []
    return Object.entries(settings)
      .filter(([, setting]) => setting.category === category)
      .sort((a, b) => a[0].localeCompare(b[0]))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-muted-foreground">Configure application settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {categories.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex-1">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              {(() => {
                const category = categories.find(c => c.id === activeTab)
                const Icon = category?.icon || Settings
                return <Icon size={24} className="text-slate-700" />
              })()}
              <h2 className="text-xl font-bold text-slate-800">
                {categories.find(c => c.id === activeTab)?.label} Settings
              </h2>
            </div>

            <div className="grid gap-6">
              {getCategorySettings(activeTab).map(([key, setting]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                const value = formData[key]
                const options = (setting.options as any)?.options || []
                const description = setting.description

                if (setting.value_type === 'boolean') {
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-700">{label}</p>
                        {description && (
                          <p className="text-sm text-slate-500">{description}</p>
                        )}
                      </div>
                      <Switch
                        checked={value === true}
                        onChange={(v) => handleChange(key, v)}
                      />
                    </div>
                  )
                }

                if (options.length > 0) {
                  return (
                    <SettingField
                      key={key}
                      label={label}
                      description={description}
                      error={errors[key]}
                    >
                      <Select
                        value={value || ''}
                        onChange={(e: any) => handleChange(key, e.target.value)}
                        options={options}
                        placeholder={`Select ${label.toLowerCase()}`}
                        className={errors[key] ? 'border-red-500' : ''}
                      />
                    </SettingField>
                  )
                }

                return (
                  <SettingField
                    key={key}
                    label={label}
                    description={description}
                    error={errors[key]}
                  >
                    <Input
                      value={value || ''}
                      onChange={(e: any) => handleChange(key, e.target.value)}
                      type={setting.value_type === 'number' ? 'number' : 'text'}
                      placeholder={`Enter ${label.toLowerCase()}`}
                      className={errors[key] ? 'border-red-500' : ''}
                    />
                  </SettingField>
                )
              })}
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => handleSave(activeTab)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
