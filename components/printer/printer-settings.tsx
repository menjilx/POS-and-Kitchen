'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useBluetoothPrinter } from '@/hooks/use-bluetooth-printer'
import { testNetworkPrint } from '@/lib/print-client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Printer,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Loader2,
  Save,
  CheckCircle,
  XCircle,
  Pencil,
} from 'lucide-react'

type NetworkPrinterConfig = {
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

type PrinterSettings = {
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

const defaultNewPrinter: Omit<NetworkPrinterConfig, 'id'> = {
  name: '',
  ipAddress: '',
  port: 9100,
  paperWidth: 80,
  role: 'receipt',
  isDefault: false,
  openCashDrawer: false,
  enabled: true,
}

export function PrinterSettingsPanel() {
  const { toast } = useToast()
  const bt = useBluetoothPrinter()
  const btSupported = bt.isSupported
  const btConnected = bt.state === 'connected'
  const btDeviceName = bt.deviceInfo?.name ?? null
  const btState = bt.state

  const [settings, setSettings] = useState<PrinterSettings>(defaultPrinterSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [testingBt, setTestingBt] = useState(false)
  const [testingNetworkId, setTestingNetworkId] = useState<string | null>(null)
  const [showAddPrinter, setShowAddPrinter] = useState(false)
  const [newPrinter, setNewPrinter] = useState(defaultNewPrinter)
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'printer_settings')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data?.value) {
        try {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
          setSettings({ ...defaultPrinterSettings, ...parsed })
        } catch {
          // ignore parse error, use defaults
        }
      }
    } catch (err) {
      console.error('Failed to load printer settings:', err)
      toast({
        title: 'Error',
        description: 'Failed to load printer settings.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const saveSettings = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'printer_settings', value: JSON.stringify(settings), category: 'printer', value_type: 'json' }, { onConflict: 'key' })

      if (error) throw error

      toast({ title: 'Saved', description: 'Printer settings saved successfully.' })
    } catch (err) {
      console.error('Failed to save printer settings:', err)
      toast({
        title: 'Error',
        description: 'Failed to save printer settings.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleScanBluetooth = async () => {
    try {
      setScanning(true)
      await bt.scan()
      toast({ title: 'Bluetooth', description: 'Printer connected successfully.' })
    } catch (err) {
      console.error('Bluetooth scan failed:', err)
      toast({
        title: 'Scan failed',
        description: 'Could not find a Bluetooth printer.',
        variant: 'destructive',
      })
    } finally {
      setScanning(false)
    }
  }

  const handleTestBluetooth = async () => {
    try {
      setTestingBt(true)
      await bt.testPrint()
      toast({ title: 'Test Print', description: 'Test page sent to Bluetooth printer.' })
    } catch (err) {
      console.error('Bluetooth test print failed:', err)
      toast({
        title: 'Test failed',
        description: 'Could not print test page.',
        variant: 'destructive',
      })
    } finally {
      setTestingBt(false)
    }
  }

  const handleTestNetwork = async (printer: NetworkPrinterConfig) => {
    setTestingNetworkId(printer.id)
    try {
      // Auto-save settings before testing so the API can find the printer
      const { error: saveError } = await supabase
        .from('app_settings')
        .upsert({ key: 'printer_settings', value: JSON.stringify(settings), category: 'printer', value_type: 'json' }, { onConflict: 'key' })

      if (saveError) {
        toast({
          title: 'Save failed',
          description: 'Could not save printer settings before testing.',
          variant: 'destructive',
        })
        return
      }

      const result = await testNetworkPrint(printer.id)
      if (!result.success) {
        toast({
          title: 'Test failed',
          description: result.error || `Could not print to ${printer.name}.`,
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Test Print', description: `Test page sent to ${printer.name}.` })
    } catch (err) {
      console.error('Network test print failed:', err)
      toast({
        title: 'Test failed',
        description: `Could not print to ${printer.name}.`,
        variant: 'destructive',
      })
    } finally {
      setTestingNetworkId(null)
    }
  }

  const addNetworkPrinter = () => {
    if (!newPrinter.name.trim() || !newPrinter.ipAddress.trim()) {
      toast({
        title: 'Validation',
        description: 'Printer name and IP address are required.',
        variant: 'destructive',
      })
      return
    }

    const printer: NetworkPrinterConfig = {
      ...newPrinter,
      id: crypto.randomUUID(),
    }

    if (printer.isDefault) {
      settings.network.printers.forEach((p) => (p.isDefault = false))
    }

    setSettings((prev) => ({
      ...prev,
      network: {
        printers: [...prev.network.printers, printer],
      },
    }))

    setNewPrinter(defaultNewPrinter)
    setShowAddPrinter(false)
  }

  const removeNetworkPrinter = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      network: {
        printers: prev.network.printers.filter((p) => p.id !== id),
      },
    }))
  }

  const updateNetworkPrinter = (id: string, updates: Partial<NetworkPrinterConfig>) => {
    setSettings((prev) => ({
      ...prev,
      network: {
        printers: prev.network.printers.map((p) => {
          if (p.id !== id) {
            // If the updated printer is being set as default, unset others
            if (updates.isDefault) return { ...p, isDefault: false }
            return p
          }
          return { ...p, ...updates }
        }),
      },
    }))
  }

  const updateSetting = <K extends keyof PrinterSettings>(key: K, value: PrinterSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateBluetooth = <K extends keyof PrinterSettings['bluetooth']>(
    key: K,
    value: PrinterSettings['bluetooth'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      bluetooth: { ...prev.bluetooth, [key]: value },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Print Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select print method</Label>
            <Select
              value={settings.method}
              onValueChange={(val) => updateSetting('method', val as PrinterSettings['method'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="browser">Browser (Default)</SelectItem>
                <SelectItem value="bluetooth">Bluetooth</SelectItem>
                <SelectItem value="network">Network</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-print">Auto-print after payment</Label>
            <Switch
              id="auto-print"
              checked={settings.autoPrintOnPayment}
              onChange={(e) => updateSetting('autoPrintOnPayment', e.target.checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bluetooth Section */}
      {settings.method === 'bluetooth' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {btConnected ? (
                <Bluetooth className="h-5 w-5 text-blue-500" />
              ) : (
                <BluetoothOff className="h-5 w-5 text-muted-foreground" />
              )}
              Bluetooth Printer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
              Bluetooth printing is only supported in Chrome and Edge browsers via the Web Bluetooth API.
            </div>

            {!btSupported && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                Web Bluetooth is not supported in this browser. Please use Chrome or Edge.
              </div>
            )}

            <div className="space-y-2">
              <Label>Paper Width</Label>
              <Select
                value={String(settings.bluetooth.paperWidth)}
                onValueChange={(val) => updateBluetooth('paperWidth', Number(val) as 58 | 80)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58mm</SelectItem>
                  <SelectItem value="80">80mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="bt-auto-reconnect">Auto-reconnect</Label>
              <Switch
                id="bt-auto-reconnect"
                checked={settings.bluetooth.autoReconnect}
                onChange={(e) => updateBluetooth('autoReconnect', e.target.checked)}
              />
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-3 rounded-md border p-3">
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  btConnected
                    ? 'bg-green-500'
                    : btState === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {btConnected
                    ? btDeviceName || 'Connected'
                    : btState === 'error'
                      ? 'Connection error'
                      : 'Disconnected'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {btConnected ? 'Ready to print' : 'No printer connected'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!btConnected && (
                <Button
                  onClick={handleScanBluetooth}
                  disabled={!btSupported || scanning}
                  variant="outline"
                >
                  {scanning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bluetooth className="mr-2 h-4 w-4" />
                  )}
                  Scan for Printer
                </Button>
              )}
              {btConnected && (
                <>
                  <Button
                    onClick={handleTestBluetooth}
                    disabled={testingBt}
                    variant="outline"
                  >
                    {testingBt ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Printer className="mr-2 h-4 w-4" />
                    )}
                    Test Print
                  </Button>
                  <Button onClick={bt.disconnect} variant="destructive">
                    <BluetoothOff className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Section */}
      {settings.method === 'network' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Network Printers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.network.printers.length === 0 && !showAddPrinter && (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
                <WifiOff className="h-8 w-8" />
                <p className="text-sm">No network printers configured.</p>
              </div>
            )}

            {/* Printer Cards */}
            {settings.network.printers.map((printer) =>
              editingPrinterId === printer.id ? (
                <div key={printer.id} className="space-y-3 rounded-md border p-4">
                  <p className="text-sm font-medium">Edit Printer</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Printer Name</Label>
                      <Input
                        value={printer.name}
                        onChange={(e) => updateNetworkPrinter(printer.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>IP Address</Label>
                      <Input
                        value={printer.ipAddress}
                        onChange={(e) => updateNetworkPrinter(printer.id, { ipAddress: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Port</Label>
                      <Input
                        type="number"
                        value={printer.port}
                        onChange={(e) => updateNetworkPrinter(printer.id, { port: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Paper Width</Label>
                      <Select
                        value={String(printer.paperWidth)}
                        onValueChange={(val) => updateNetworkPrinter(printer.id, { paperWidth: Number(val) as 58 | 80 })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="58">58mm</SelectItem>
                          <SelectItem value="80">80mm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Role</Label>
                      <Select
                        value={printer.role}
                        onValueChange={(val) => updateNetworkPrinter(printer.id, { role: val as NetworkPrinterConfig['role'] })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receipt">Receipt</SelectItem>
                          <SelectItem value="kitchen">Kitchen</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Set as default</Label>
                    <Switch
                      checked={printer.isDefault}
                      onChange={(e) => updateNetworkPrinter(printer.id, { isDefault: e.target.checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Open cash drawer</Label>
                    <Switch
                      checked={printer.openCashDrawer}
                      onChange={(e) => updateNetworkPrinter(printer.id, { openCashDrawer: e.target.checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Enabled</Label>
                    <Switch
                      checked={printer.enabled}
                      onChange={(e) => updateNetworkPrinter(printer.id, { enabled: e.target.checked })}
                    />
                  </div>
                  <Button variant="outline" onClick={() => setEditingPrinterId(null)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Done
                  </Button>
                </div>
              ) : (
                <div
                  key={printer.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{printer.name}</p>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {printer.role}
                      </span>
                      {printer.isDefault && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          Default
                        </span>
                      )}
                      {!printer.enabled && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {printer.ipAddress}:{printer.port} &middot; {printer.paperWidth}mm
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPrinterId(printer.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={testingNetworkId === printer.id}
                      onClick={() => handleTestNetwork(printer)}
                    >
                      {testingNetworkId === printer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeNetworkPrinter(printer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            )}

            {/* Add Printer Form */}
            {showAddPrinter && (
              <div className="space-y-3 rounded-md border p-4">
                <p className="text-sm font-medium">Add Network Printer</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="np-name">Printer Name</Label>
                    <Input
                      id="np-name"
                      placeholder="e.g. Kitchen Printer"
                      value={newPrinter.name}
                      onChange={(e) =>
                        setNewPrinter((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="np-ip">IP Address</Label>
                    <Input
                      id="np-ip"
                      placeholder="192.168.1.100"
                      value={newPrinter.ipAddress}
                      onChange={(e) =>
                        setNewPrinter((p) => ({ ...p, ipAddress: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="np-port">Port</Label>
                    <Input
                      id="np-port"
                      type="number"
                      value={newPrinter.port}
                      onChange={(e) =>
                        setNewPrinter((p) => ({ ...p, port: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Paper Width</Label>
                    <Select
                      value={String(newPrinter.paperWidth)}
                      onValueChange={(val) =>
                        setNewPrinter((p) => ({ ...p, paperWidth: Number(val) as 58 | 80 }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58">58mm</SelectItem>
                        <SelectItem value="80">80mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Select
                      value={newPrinter.role}
                      onValueChange={(val) =>
                        setNewPrinter((p) => ({
                          ...p,
                          role: val as NetworkPrinterConfig['role'],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="np-default">Set as default</Label>
                  <Switch
                    id="np-default"
                    checked={newPrinter.isDefault}
                    onChange={(e) =>
                      setNewPrinter((p) => ({ ...p, isDefault: e.target.checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="np-cash-drawer">Open cash drawer</Label>
                  <Switch
                    id="np-cash-drawer"
                    checked={newPrinter.openCashDrawer}
                    onChange={(e) =>
                      setNewPrinter((p) => ({ ...p, openCashDrawer: e.target.checked }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={addNetworkPrinter}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Add Printer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddPrinter(false)
                      setNewPrinter(defaultNewPrinter)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!showAddPrinter && (
              <Button variant="outline" onClick={() => setShowAddPrinter(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Printer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
