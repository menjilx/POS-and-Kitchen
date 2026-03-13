'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { BluetoothPrinterTransport, type BluetoothPrinterState, type PrinterDeviceInfo } from '@/lib/bluetooth-printer'
import { buildReceiptESCPOS, rasterizeLogo } from '@/lib/escpos'
import type { ReceiptData, ReceiptSettings } from '@/components/receipt/printable-receipt'
import { useToast } from '@/hooks/use-toast'

const LAST_DEVICE_KEY = 'pos-bt-printer-device-id'

export function useBluetoothPrinter(paperWidth: 58 | 80 = 80) {
  const { toast } = useToast()
  const transportRef = useRef<BluetoothPrinterTransport | null>(null)
  const [state, setState] = useState<BluetoothPrinterState>('disconnected')
  const [deviceInfo, setDeviceInfo] = useState<PrinterDeviceInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  const getTransport = useCallback(() => {
    if (!transportRef.current) {
      transportRef.current = new BluetoothPrinterTransport()
      transportRef.current.onStateChange = (newState) => {
        setState(newState)
        if (newState === 'disconnected') {
          setDeviceInfo(null)
        }
        if (newState === 'error') {
          setError(transportRef.current?.error ?? 'Unknown error')
        }
      }
    }
    return transportRef.current
  }, [])

  const isSupported = BluetoothPrinterTransport.isSupported()

  const scan = useCallback(async () => {
    try {
      setError(null)
      const transport = getTransport()
      const info = await transport.requestDevice()
      setDeviceInfo(info)
      localStorage.setItem(LAST_DEVICE_KEY, info.id)
      await transport.connect()
      toast({ title: 'Printer Connected', description: `Connected to ${info.name}` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to scan'
      setError(msg)
      toast({ title: 'Connection Failed', description: msg, variant: 'destructive' })
    }
  }, [getTransport, toast])

  const connect = useCallback(async () => {
    try {
      setError(null)
      const transport = getTransport()
      await transport.connect()
      setDeviceInfo(transport.deviceInfo)
      toast({ title: 'Printer Connected', description: `Connected to ${transport.deviceInfo?.name || 'printer'}` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect'
      setError(msg)
      toast({ title: 'Connection Failed', description: msg, variant: 'destructive' })
    }
  }, [getTransport, toast])

  const disconnect = useCallback(async () => {
    try {
      const transport = getTransport()
      await transport.disconnect()
      toast({ title: 'Disconnected', description: 'Printer disconnected' })
    } catch {
      // ignore disconnect errors
    }
  }, [getTransport, toast])

  const printReceipt = useCallback(async (
    data: ReceiptData,
    settings: ReceiptSettings,
    chunkSize = 512,
    chunkDelay = 50
  ) => {
    try {
      setIsPrinting(true)
      setError(null)
      const transport = getTransport()
      if (transport.state !== 'connected') {
        throw new Error('Printer not connected')
      }
      // Rasterize logo if enabled
      let logo
      if (settings.showLogo && settings.logoUrl) {
        try {
          logo = await rasterizeLogo(settings.logoUrl)
        } catch {
          // Logo rasterization failed — print without logo
        }
      }
      const escposData = buildReceiptESCPOS(settings, data, paperWidth, logo)
      await transport.print(escposData, chunkSize, chunkDelay)
      toast({ title: 'Printed', description: 'Receipt sent to printer' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Print failed'
      setError(msg)
      toast({ title: 'Print Failed', description: msg, variant: 'destructive' })
      throw err
    } finally {
      setIsPrinting(false)
    }
  }, [getTransport, paperWidth, toast])

  const testPrint = useCallback(async (chunkSize = 512, chunkDelay = 50) => {
    try {
      setIsPrinting(true)
      setError(null)
      const transport = getTransport()
      if (transport.state !== 'connected') {
        throw new Error('Printer not connected')
      }
      // Import dynamically to avoid importing on server
      const { createESCPOSBuilder } = await import('@/lib/escpos')
      const builder = createESCPOSBuilder(paperWidth)
      const testData = builder
        .center()
        .bold(true)
        .text('*** TEST PRINT ***')
        .bold(false)
        .feed()
        .text('Printer is working correctly')
        .feed()
        .text(new Date().toLocaleString())
        .feed(2)
        .separator()
        .cut()
        .build()
      await transport.print(testData, chunkSize, chunkDelay)
      toast({ title: 'Test Print', description: 'Test page sent successfully' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Test print failed'
      setError(msg)
      toast({ title: 'Test Failed', description: msg, variant: 'destructive' })
    } finally {
      setIsPrinting(false)
    }
  }, [getTransport, paperWidth, toast])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect on unmount to preserve connection
    }
  }, [])

  return {
    isSupported,
    state,
    deviceInfo,
    error,
    isPrinting,
    scan,
    connect,
    disconnect,
    printReceipt,
    testPrint,
  }
}
