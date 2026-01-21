import React from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'

export interface ReceiptSettings {
  showLogo: boolean
  logoUrl?: string
  headerText: string
  receiptTitle: string
  address: string
  phoneNumber: string
  footerText: string
  showCashier: boolean
  showOrderNumber: boolean
  showDate: boolean
  showCustomerName: boolean
  showTax: boolean
  showDiscount: boolean
  showChange: boolean
  showReceiptAfterPayment: boolean
  showQrCode: boolean
}

export const defaultReceiptSettings: ReceiptSettings = {
  showLogo: false,
  headerText: 'SHOP NAME',
  receiptTitle: 'CASH RECEIPT',
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
  showQrCode: true,
}

export function normalizeReceiptSettings(settings?: Partial<ReceiptSettings> | null): ReceiptSettings {
  return {
    ...defaultReceiptSettings,
    ...(settings ?? {}),
  }
}

export interface ReceiptData {
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  tax: number
  discount: number
  discountName?: string | null
  total: number
  cashierName?: string
  customerName?: string
  orderNumber: string
  date: string
  paymentMethod?: string
  paymentStatus?: string
  paymentRef?: string
  paymentNotes?: string
  receivedAmount?: number
  changeAmount?: number
  currency?: string
}

export function buildReceiptText(settings: ReceiptSettings, data: ReceiptData) {
  const lines: string[] = []

  const formatMoney = (price: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: data.currency || 'USD',
      }).format(price)
    } catch {
      return `${data.currency || '$'}${price.toFixed(2)}`
    }
  }

  const add = (value?: string) => {
    if (!value) return
    lines.push(value)
  }

  add((settings.headerText || '').toUpperCase())
  if (settings.address) {
    settings.address.split('\n').forEach((l) => add(l))
  }
  if (settings.phoneNumber) {
    add(`Tel. ${settings.phoneNumber}`)
  }

  add('')
  add('********************************')
  add((settings.receiptTitle || '').toUpperCase())
  add('********************************')
  add('')

  if (settings.showDate) add(`Date: ${data.date}`)
  if (settings.showOrderNumber) add(`Order #: ${data.orderNumber}`)
  if (settings.showCashier) add(`Cashier: ${data.cashierName || 'N/A'}`)
  if (settings.showCustomerName) add(`Customer: ${data.customerName || 'Walk-in'}`)
  add('')
  add('Description')

  data.items.forEach((item) => {
    const label = `${item.name}${item.quantity > 1 ? ` x ${item.quantity}` : ''}`
    add(`${label}  ${formatMoney(item.price * item.quantity)}`)
  })

  add('')
  add('********************************')
  add(`Total: ${formatMoney(data.total)}`)
  add(`Subtotal: ${formatMoney(data.subtotal)}`)
  if (settings.showTax) add(`Tax: ${formatMoney(data.tax)}`)
  if (settings.showDiscount && data.discount > 0) {
    const suffix = data.discountName ? ` (${data.discountName})` : ''
    add(`Discount${suffix}: -${formatMoney(data.discount)}`)
  }
  add('')
  add('********************************')
  if (data.paymentStatus) add(`Payment Status: ${data.paymentStatus.toUpperCase()}`)
  if (data.paymentMethod) add(`Payment Method: ${data.paymentMethod.toUpperCase()}`)
  if (settings.showChange && typeof data.receivedAmount === 'number') add(`Received: ${formatMoney(data.receivedAmount)}`)
  if (settings.showChange && typeof data.changeAmount === 'number' && data.changeAmount > 0) add(`Change: ${formatMoney(data.changeAmount)}`)
  if (data.paymentRef) add(`Ref: ${data.paymentRef}`)
  add('')
  if (settings.footerText) {
    settings.footerText.split('\n').forEach((l) => add(l.toUpperCase()))
  }

  return lines.join('\n')
}

interface PrintableReceiptProps {
  settings: ReceiptSettings
  data: ReceiptData
}

export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(
  ({ settings, data }, ref) => {
    const formatPrice = (price: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: data.currency || 'USD',
        }).format(price)
      } catch {
        // Fallback for invalid currency codes (e.g. symbols like $)
        return `${data.currency || '$'}${price.toFixed(2)}`
      }
    }

    return (
      <div
        ref={ref}
        className="bg-white text-black p-4 w-[80mm] mx-auto font-mono text-xs leading-tight shadow-none print:shadow-none print:w-full print:m-0"
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        <div className="flex flex-col items-center text-center mb-4">
          {settings.showLogo && settings.logoUrl && (
            <div className="mb-2 relative w-16 h-16">
              <Image
                src={settings.logoUrl}
                alt="Logo"
                width={64}
                height={64}
                sizes="64px"
                priority
                unoptimized
                className="object-contain w-16 h-16"
              />
            </div>
          )}
          <h1 className="text-xl font-bold uppercase mb-1">{settings.headerText}</h1>
          <p className="whitespace-pre-line mb-1">{settings.address}</p>
          <p>Tel. {settings.phoneNumber}</p>
        </div>

        <div className="text-center mb-2">
          <p className="mb-2">********************************</p>
          <h2 className="text-lg font-bold uppercase">{settings.receiptTitle}</h2>
          <p>********************************</p>
        </div>

        {/* Order Details */}
        <div className="mb-2">
            {settings.showDate && (
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{data.date}</span>
                </div>
            )}
             {settings.showOrderNumber && (
                <div className="flex justify-between">
                    <span>Order #:</span>
                    <span>{data.orderNumber}</span>
                </div>
            )}
             {settings.showCashier && (
                <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{data.cashierName || 'N/A'}</span>
                </div>
            )}
            {settings.showCustomerName && (
                <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{data.customerName || 'Walk-in'}</span>
                </div>
            )}
        </div>

        <div className="mb-2 border-b border-black pb-1">
          <div className="flex justify-between font-bold mb-1">
            <span className="flex-1">Description</span>
            <span className="w-16 text-right">Price</span>
          </div>
          {data.items.map((item, index) => (
            <div key={index} className="flex justify-between mb-1">
              <span className="flex-1">
                {item.name} {item.quantity > 1 && `x ${item.quantity}`}
              </span>
              <span className="w-16 text-right">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-2">
           <p className="text-center mb-2">********************************</p>
          <div className="flex justify-between font-bold text-lg mb-2">
            <span>Total</span>
            <span>{formatPrice(data.total)}</span>
          </div>
          
          <div className="space-y-1">
             <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(data.subtotal)}</span>
             </div>
             {settings.showTax && (
                <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice(data.tax)}</span>
                </div>
             )}
              {settings.showDiscount && data.discount > 0 && (
                <div className="flex justify-between">
                    <span>Discount{data.discountName ? ` (${data.discountName})` : ''}</span>
                    <span>-{formatPrice(data.discount)}</span>
                </div>
             )}
          </div>
        </div>

        <div className="mb-4">
           <p className="text-center mb-2">********************************</p>
           {data.paymentStatus && (
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span>{data.paymentStatus.toUpperCase()}</span>
              </div>
           )}
           {data.paymentMethod && (
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span>{data.paymentMethod.toUpperCase()}</span>
              </div>
           )}
           {settings.showChange && typeof data.receivedAmount === 'number' && (
              <div className="flex justify-between">
                <span>Received</span>
                <span>{formatPrice(data.receivedAmount)}</span>
              </div>
           )}
           {settings.showChange && typeof data.changeAmount === 'number' && data.changeAmount > 0 && (
              <div className="flex justify-between">
                <span>Change</span>
                <span>{formatPrice(data.changeAmount)}</span>
              </div>
           )}
           {data.paymentRef && (
              <div className="flex justify-between">
                <span>Ref</span>
                <span className="text-right">{data.paymentRef}</span>
              </div>
           )}
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="font-bold mb-4 uppercase whitespace-pre-line">{settings.footerText}</p>
          
          {settings.showQrCode && (
            <div className="mb-2">
              <QRCodeSVG value={data.orderNumber} size={100} />
            </div>
          )}
        </div>
      </div>
    )
  }
)

PrintableReceipt.displayName = 'PrintableReceipt'
