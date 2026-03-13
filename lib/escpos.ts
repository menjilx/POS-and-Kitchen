import type { ReceiptSettings, ReceiptData } from '@/components/receipt/printable-receipt'

// ---------------------------------------------------------------------------
// ESC/POS command constants
// ---------------------------------------------------------------------------

const ESC = 0x1b
const GS = 0x1d

/** Initialise printer */
export const INIT = new Uint8Array([ESC, 0x40])

/** Text alignment */
export const ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00])
export const ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01])
export const ALIGN_RIGHT = new Uint8Array([ESC, 0x61, 0x02])

/** Bold emphasis */
export const BOLD_ON = new Uint8Array([ESC, 0x45, 0x01])
export const BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00])

/** Line feed */
export const LINE_FEED = new Uint8Array([0x0a])

/** Full cut */
export const CUT = new Uint8Array([GS, 0x56, 0x00])

/** Open cash drawer (pin 2, 100ms on / 100ms off) */
export const CASH_DRAWER = new Uint8Array([ESC, 0x70, 0x00, 0x19, 0x19])

// ---------------------------------------------------------------------------
// Paper width helpers
// ---------------------------------------------------------------------------

const CHARS_PER_LINE: Record<58 | 80, number> = {
  58: 32,
  80: 48,
}

// ---------------------------------------------------------------------------
// Utility: two-column justified line
// ---------------------------------------------------------------------------

/**
 * Build a single line with `left` text flush-left and `right` text flush-right,
 * padded with spaces to fill `width` characters. If the combined length exceeds
 * `width`, the left side is truncated.
 */
export function justifyLine(left: string, right: string, width: number): string {
  const gap = width - left.length - right.length
  if (gap < 1) {
    const trimmed = left.slice(0, width - right.length - 1)
    return `${trimmed} ${right}`
  }
  return `${left}${' '.repeat(gap)}${right}`
}

// ---------------------------------------------------------------------------
// Fluent ESC/POS builder
// ---------------------------------------------------------------------------

export interface ESCPOSBuilder {
  center(): ESCPOSBuilder
  left(): ESCPOSBuilder
  right(): ESCPOSBuilder
  bold(on?: boolean): ESCPOSBuilder
  text(str: string): ESCPOSBuilder
  separator(char?: string): ESCPOSBuilder
  feed(lines?: number): ESCPOSBuilder
  cut(): ESCPOSBuilder
  openCashDrawer(): ESCPOSBuilder
  qrCode(data: string, moduleSize?: number): ESCPOSBuilder
  rasterImage(imageData: Uint8Array, widthBytes: number, height: number): ESCPOSBuilder
  build(): Uint8Array
}

export function createESCPOSBuilder(paperWidth: 58 | 80 = 80): ESCPOSBuilder {
  const lineWidth = CHARS_PER_LINE[paperWidth]
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []

  const push = (...parts: Uint8Array[]) => {
    for (const p of parts) chunks.push(p)
  }

  // Always start with an INIT sequence
  push(INIT)

  const builder: ESCPOSBuilder = {
    center() {
      push(ALIGN_CENTER)
      return builder
    },

    left() {
      push(ALIGN_LEFT)
      return builder
    },

    right() {
      push(ALIGN_RIGHT)
      return builder
    },

    bold(on = true) {
      push(on ? BOLD_ON : BOLD_OFF)
      return builder
    },

    text(str: string) {
      push(encoder.encode(str), LINE_FEED)
      return builder
    },

    separator(char = '-') {
      push(encoder.encode(char.repeat(lineWidth)), LINE_FEED)
      return builder
    },

    feed(lines = 1) {
      for (let i = 0; i < lines; i++) {
        push(LINE_FEED)
      }
      return builder
    },

    cut() {
      push(CUT)
      return builder
    },

    openCashDrawer() {
      push(CASH_DRAWER)
      return builder
    },

    qrCode(qrData: string, moduleSize = 6) {
      const dataBytes = encoder.encode(qrData)
      const storeLen = dataBytes.length + 3 // pL, pH count payload bytes

      // Function 165: Select QR model (Model 2)
      push(new Uint8Array([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]))
      // Function 167: Set module size
      push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize]))
      // Function 169: Set error correction level (M = 49)
      push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]))
      // Function 180: Store QR data
      push(new Uint8Array([
        GS, 0x28, 0x6b,
        storeLen & 0xff, (storeLen >> 8) & 0xff,
        0x31, 0x50, 0x30,
        ...dataBytes,
      ]))
      // Function 181: Print stored QR
      push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]))

      return builder
    },

    rasterImage(imageData: Uint8Array, widthBytes: number, height: number) {
      // GS v 0 — Print raster bit image
      // m=0 (normal), xL/xH = widthBytes, yL/yH = height
      const header = new Uint8Array([
        GS, 0x76, 0x30, 0x00,
        widthBytes & 0xff, (widthBytes >> 8) & 0xff,
        height & 0xff, (height >> 8) & 0xff,
      ])
      push(header, imageData)
      return builder
    },

    build(): Uint8Array {
      let totalLength = 0
      for (const c of chunks) totalLength += c.length

      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const c of chunks) {
        result.set(c, offset)
        offset += c.length
      }
      return result
    },
  }

  return builder
}

// ---------------------------------------------------------------------------
// Build a full receipt as ESC/POS binary
// ---------------------------------------------------------------------------

export interface RasterizedLogo {
  data: Uint8Array
  widthBytes: number
  height: number
}

export function buildReceiptESCPOS(
  settings: ReceiptSettings,
  data: ReceiptData,
  paperWidth: 58 | 80 = 80,
  logo?: RasterizedLogo,
): Uint8Array {
  const w = CHARS_PER_LINE[paperWidth]
  const b = createESCPOSBuilder(paperWidth)

  const formatMoney = (price: number): string => {
    const code = data.currency || 'USD'
    try {
      const parts = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
      }).formatToParts(price)
      return parts.map(p => {
        if (p.type === 'currency' && /[^\x20-\x7E]/.test(p.value)) {
          return code
        }
        return p.value
      }).join('')
    } catch {
      return `${code} ${price.toFixed(2)}`
    }
  }

  // ---- Logo ----
  if (settings.showLogo && logo) {
    b.center().rasterImage(logo.data, logo.widthBytes, logo.height).feed()
  }

  // ---- Header ----
  b.center().bold()
  if (settings.headerText) {
    b.text(settings.headerText.toUpperCase())
  }
  b.bold(false)

  if (settings.address) {
    settings.address.split('\n').forEach((line) => {
      if (line) b.text(line)
    })
  }
  if (settings.phoneNumber) {
    b.text(`Tel. ${settings.phoneNumber}`)
  }

  b.feed()
  b.separator('*')
  b.bold().text((settings.receiptTitle || '').toUpperCase()).bold(false)
  b.separator('*')
  b.feed()

  // ---- Order info ----
  b.left()
  if (settings.showDate) b.text(`Date: ${data.date}`)
  if (settings.showOrderNumber) b.text(`Order #: ${data.orderNumber}`)
  if (settings.showCashier) b.text(`Cashier: ${data.cashierName || 'N/A'}`)
  if (settings.showCustomerName) b.text(`Customer: ${data.customerName || 'Walk-in'}`)

  b.feed()

  // ---- Items ----
  b.bold().text('Description').bold(false)

  data.items.forEach((item) => {
    const label = `${item.name}${item.quantity > 1 ? ` x ${item.quantity}` : ''}`
    const price = formatMoney(item.price * item.quantity)
    b.text(justifyLine(label, price, w))
  })

  b.feed()

  // ---- Totals ----
  b.separator('*')
  b.bold().text(justifyLine('Total:', formatMoney(data.total), w)).bold(false)
  b.text(justifyLine('Subtotal:', formatMoney(data.subtotal), w))

  if (settings.showTax) {
    b.text(justifyLine('Tax:', formatMoney(data.tax), w))
  }

  if (settings.showDiscount && data.discount > 0) {
    const suffix = data.discountName ? ` (${data.discountName})` : ''
    b.text(justifyLine(`Discount${suffix}:`, `-${formatMoney(data.discount)}`, w))
  }

  b.feed()

  // ---- Payment info ----
  b.separator('*')
  if (data.paymentStatus) b.text(`Payment Status: ${data.paymentStatus.toUpperCase()}`)
  if (data.paymentMethod) b.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`)
  if (settings.showChange && typeof data.receivedAmount === 'number') {
    b.text(justifyLine('Received:', formatMoney(data.receivedAmount), w))
  }
  if (settings.showChange && typeof data.changeAmount === 'number' && data.changeAmount > 0) {
    b.text(justifyLine('Change:', formatMoney(data.changeAmount), w))
  }
  if (data.paymentRef) b.text(`Ref: ${data.paymentRef}`)

  b.feed()

  // ---- Footer ----
  if (settings.footerText) {
    b.center()
    settings.footerText.split('\n').forEach((line) => {
      if (line) b.text(line.toUpperCase())
    })
  }

  // ---- QR Code ----
  if (settings.showQrCode && data.orderNumber) {
    b.center().feed().qrCode(data.orderNumber).feed()
  }

  b.feed(3).cut()

  return b.build()
}

// ---------------------------------------------------------------------------
// Logo rasterization helper (browser only — uses canvas)
// ---------------------------------------------------------------------------

/**
 * Fetch an image URL and convert it to a 1-bit raster bitmap suitable for
 * ESC/POS `GS v 0` printing. Must be called in a browser environment.
 */
export async function rasterizeLogo(
  url: string,
  maxWidth = 384,
): Promise<RasterizedLogo> {
  const img = new Image()
  img.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load logo image'))
    img.src = url
  })

  // Scale down while preserving aspect ratio
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > maxWidth) {
    h = Math.round(h * (maxWidth / w))
    w = maxWidth
  }

  // Width must be a multiple of 8 for raster format
  w = Math.ceil(w / 8) * 8

  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const pixels = imageData.data
  const widthBytes = w / 8
  const rasterData = new Uint8Array(widthBytes * h)

  for (let y = 0; y < h; y++) {
    for (let byteX = 0; byteX < widthBytes; byteX++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        const x = byteX * 8 + bit
        const idx = (y * w + x) * 4
        // Convert to grayscale and threshold (dark = 1, light = 0)
        const gray = (pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114)
        if (gray < 128) {
          byte |= (0x80 >> bit)
        }
      }
      rasterData[y * widthBytes + byteX] = byte
    }
  }

  return { data: rasterData, widthBytes, height: h }
}
