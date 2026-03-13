'use client'

import { Printer, BluetoothOff, Wifi } from 'lucide-react'
import type { BluetoothPrinterState } from '@/lib/bluetooth-printer'

interface PrinterStatusIndicatorProps {
  method: 'browser' | 'bluetooth' | 'network'
  bluetoothState?: BluetoothPrinterState
  deviceName?: string | null
}

export function PrinterStatusIndicator({ method, bluetoothState, deviceName }: PrinterStatusIndicatorProps) {
  if (method === 'browser') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Printer className="h-3.5 w-3.5" />
        <span>Browser</span>
      </div>
    )
  }

  if (method === 'bluetooth') {
    const isConnected = bluetoothState === 'connected'
    const isConnecting = bluetoothState === 'connecting'
    return (
      <div className="flex items-center gap-1.5 text-xs">
        {isConnected ? (
          <>
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-green-700">{deviceName || 'Connected'}</span>
          </>
        ) : isConnecting ? (
          <>
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-yellow-700">Connecting...</span>
          </>
        ) : (
          <>
            <BluetoothOff className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Disconnected</span>
          </>
        )}
      </div>
    )
  }

  if (method === 'network') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wifi className="h-3.5 w-3.5" />
        <span>Network</span>
      </div>
    )
  }

  return null
}
