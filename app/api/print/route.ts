import { NextResponse } from 'next/server'
import net from 'net'
import { createClient } from '@/lib/supabase/server'
import { buildReceiptESCPOS, CASH_DRAWER } from '@/lib/escpos'
import type { ReceiptSettings, ReceiptData } from '@/components/receipt/printable-receipt'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NetworkPrinter = {
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
    printers: NetworkPrinter[]
  }
}

// ---------------------------------------------------------------------------
// TCP send helper
// ---------------------------------------------------------------------------

function sendToTCPPrinter(
  ip: string,
  port: number,
  data: Uint8Array,
  timeoutMs = 5000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()

    const timer = setTimeout(() => {
      socket.destroy()
      reject(new Error(`Connection to ${ip}:${port} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    socket.connect(port, ip, () => {
      socket.write(Buffer.from(data), (err) => {
        clearTimeout(timer)
        if (err) {
          socket.destroy()
          reject(err)
        } else {
          socket.end(() => {
            resolve()
          })
        }
      })
    })

    socket.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

// ---------------------------------------------------------------------------
// POST /api/print
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // ---- Auth ----
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    // ---- Parse body ----
    const body = await request.json()
    const {
      receiptData,
      receiptSettings,
      printerId,
    } = body as {
      receiptData: ReceiptData
      receiptSettings: ReceiptSettings
      printerId?: string
    }

    if (!receiptData || !receiptSettings) {
      return NextResponse.json(
        { success: false, error: 'Missing receiptData or receiptSettings' },
        { status: 400 },
      )
    }

    // ---- Load printer settings from app_settings ----
    const { data: settingsRow, error: settingsError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'printer_settings')
      .single()

    if (settingsError || !settingsRow) {
      return NextResponse.json(
        { success: false, error: 'Printer settings not found. Please configure a network printer first.' },
        { status: 404 },
      )
    }

    const printerSettings = (typeof settingsRow.value === 'string'
      ? JSON.parse(settingsRow.value)
      : settingsRow.value) as PrinterSettings

    if (!printerSettings.network?.printers?.length) {
      return NextResponse.json(
        { success: false, error: 'No network printers configured.' },
        { status: 400 },
      )
    }

    // ---- Resolve target printer ----
    let printer: NetworkPrinter | undefined

    if (printerId) {
      printer = printerSettings.network.printers.find(
        (p) => p.id === printerId && p.enabled,
      )
    } else {
      printer = printerSettings.network.printers.find(
        (p) => p.isDefault && p.enabled,
      )
    }

    if (!printer) {
      return NextResponse.json(
        { success: false, error: printerId ? `Printer "${printerId}" not found or disabled.` : 'No default printer configured.' },
        { status: 404 },
      )
    }

    // ---- Build ESC/POS binary ----
    const escposData = buildReceiptESCPOS(receiptSettings, receiptData, printer.paperWidth)

    // Prepend cash drawer command if enabled
    let payload: Uint8Array
    if (printer.openCashDrawer) {
      const combined = new Uint8Array(CASH_DRAWER.length + escposData.length)
      combined.set(CASH_DRAWER, 0)
      combined.set(escposData, CASH_DRAWER.length)
      payload = combined
    } else {
      payload = escposData
    }

    // ---- Send to printer via TCP ----
    await sendToTCPPrinter(printer.ipAddress, printer.port, payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/print] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
