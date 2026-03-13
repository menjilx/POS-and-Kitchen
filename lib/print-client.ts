import type { ReceiptData, ReceiptSettings } from '@/components/receipt/printable-receipt'

export type PrintResult = {
  success: boolean
  error?: string
}

export async function printToNetwork(
  data: ReceiptData,
  settings: ReceiptSettings,
  printerId?: string
): Promise<PrintResult> {
  try {
    const res = await fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptData: data, receiptSettings: settings, printerId }),
    })
    const json = await res.json()
    if (!res.ok) {
      return { success: false, error: json.error || 'Print failed' }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Print failed' }
  }
}

export async function testNetworkPrint(printerId: string): Promise<PrintResult> {
  try {
    const res = await fetch('/api/print/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printerId }),
    })
    const json = await res.json()
    if (!res.ok) {
      return { success: false, error: json.error || 'Test print failed' }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Test print failed' }
  }
}
