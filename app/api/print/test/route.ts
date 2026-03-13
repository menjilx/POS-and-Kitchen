import { NextResponse } from 'next/server'
import net from 'net'
import { createClient } from '@/lib/supabase/server'
import { createESCPOSBuilder, CASH_DRAWER } from '@/lib/escpos'

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
// POST /api/print/test
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
    const { printerId } = body as { printerId: string }

    if (!printerId) {
      return NextResponse.json(
        { success: false, error: 'Missing printerId' },
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

    // ---- Resolve target printer ----
    const printer = printerSettings.network?.printers?.find(
      (p) => p.id === printerId && p.enabled,
    )

    if (!printer) {
      return NextResponse.json(
        { success: false, error: `Printer "${printerId}" not found or disabled.` },
        { status: 404 },
      )
    }

    // ---- Build test receipt ----
    const now = new Date()
    const timestamp = now.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const builder = createESCPOSBuilder(printer.paperWidth)
    builder
      .center()
      .bold()
      .text('*** PRINTER TEST ***')
      .bold(false)
      .feed()
      .text(`Printer: ${printer.name}`)
      .text(`IP: ${printer.ipAddress}:${printer.port}`)
      .text(`Paper: ${printer.paperWidth}mm`)
      .text(`Role: ${printer.role}`)
      .feed()
      .separator('=')
      .text('If you can read this,')
      .text('the printer is working!')
      .separator('=')
      .feed()
      .left()
      .text(`Test time: ${timestamp}`)
      .feed(3)
      .cut()

    const escposData = builder.build()

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
    console.error('[POST /api/print/test] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
