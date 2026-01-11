import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'

export interface ReceiptSettings {
  showLogo: boolean
  logoUrl?: string
  headerText: string
  address: string
  phoneNumber: string
  footerText: string
  showCashier: boolean
  showOrderNumber: boolean
  showDate: boolean
  showCustomerName: boolean
  showTax: boolean
  showDiscount: boolean
  showQrCode: boolean
}

export interface ReceiptData {
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  tax: number
  discount: number
  total: number
  cashierName?: string
  customerName?: string
  orderNumber: string
  date: string
  paymentMethod?: string
  currency?: string
}

interface PrintableReceiptProps {
  settings: ReceiptSettings
  data: ReceiptData
}

export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(
  ({ settings, data }, ref) => {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: data.currency || 'USD',
      }).format(price)
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
                fill
                className="object-contain"
              />
            </div>
          )}
          <h1 className="text-xl font-bold uppercase mb-1">{settings.headerText}</h1>
          <p className="whitespace-pre-line mb-1">{settings.address}</p>
          <p>Tel. {settings.phoneNumber}</p>
        </div>

        <div className="text-center mb-2">
          <p className="mb-2">********************************</p>
          <h2 className="text-lg font-bold uppercase">CASH RECEIPT</h2>
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
                    <span>Discount</span>
                    <span>-{formatPrice(data.discount)}</span>
                </div>
             )}
          </div>
        </div>

        <div className="mb-4">
           <p className="text-center mb-2">********************************</p>
           {data.paymentMethod && (
                <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span>{data.paymentMethod.toUpperCase()}</span>
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
