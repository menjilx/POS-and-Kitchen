import { supabase } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'

interface AppSetting {
  value: string
  value_type: 'string' | 'number' | 'boolean'
  description: string
  category: string
  options?: { options?: string[] } | string[]
}

interface AppSettings {
  [key: string]: AppSetting
}

interface UseAppSettingsReturn {
  settings: AppSettings | null
  loading: boolean
  error: string | null
  fetchSettings: () => Promise<void>
  updateSetting: (key: string, value: string) => Promise<{ success: boolean; error?: string }>
  bulkUpdateSettings: (updates: Record<string, string>) => Promise<{ success: boolean; error?: string }>
  getSetting: (key: string, defaultValue?: string) => string
}

export function useAppSettings(): UseAppSettingsReturn {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.rpc('get_all_settings')
      
      if (error) {
        console.error('Error fetching settings:', error)
        setError(error.message)
        return
      }
      
      if (data) {
        setSettings(data as AppSettings)
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSetting = useCallback(async (key: string, value: string) => {
    try {
      const { error } = await supabase.rpc('update_app_setting', {
        p_key: key,
        p_value: value
      })
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      await fetchSettings()
      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update setting' 
      }
    }
  }, [fetchSettings])

  const bulkUpdateSettings = useCallback(async (updates: Record<string, string>) => {
    try {
      const { error } = await supabase.rpc('bulk_update_settings', {
        p_settings: updates
      })
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      await fetchSettings()
      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update settings' 
      }
    }
  }, [fetchSettings])

  const getSetting = useCallback((key: string, defaultValue: string = '') => {
    if (!settings) return defaultValue
    const setting = settings[key]
    if (!setting) return defaultValue
    return setting.value !== undefined ? setting.value : defaultValue
  }, [settings])

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSetting,
    bulkUpdateSettings,
    getSetting
  }
}
