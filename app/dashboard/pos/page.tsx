"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Search, Clock, LogOut, X, List } from "lucide-react"
import type { MenuItem, SaleType, Customer, PaymentAdditionalData } from "@/types/database"
import { useTenantSettings } from "@/hooks/use-tenant-settings"
import { useOptimizedPOSData } from "@/hooks/use-optimized-pos-data"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderQueue } from "@/components/pos/order-queue"
import { CategoryFilter } from "@/components/pos/category-filter"
import { ProductGrid } from "@/components/pos/product-grid"
import { OrderSidebar } from "@/components/pos/order-sidebar"
import { RegisterModal, SessionSummary } from "@/components/pos/register-modal"
import { HeldOrdersModal } from "@/components/pos/held-orders-modal"
import { PaymentModal } from "@/components/pos/payment-modal"
import { TransactionsModal, Transaction } from "@/components/pos/transactions-modal"
import { OrderDetailsModal } from "@/components/pos/order-details-modal"

type CartItem = {
  item: MenuItem
  quantity: number
}

type OrderStatus = "ready" | "preparing" | "pending" | "served" | "cancelled"

type ActiveOrder = {
  id: string
  saleId?: string
  orderNumber: string
  customerName: string
  status: OrderStatus
  tableNumber?: string
  assignedStation?: string | null
}

type SaleReportItem = {
  quantity: number | null
}

type SaleReportTable = {
  table_number: string | number | null
}

type SaleReportRow = {
  order_number: string
  total_amount: number
  payment_status: string
  payment_method: string | null
  sale_date: string
  sale_time: string
  notes: string | null
  tables: SaleReportTable | SaleReportTable[] | null
  sale_items: SaleReportItem[] | null
}

function OrderQueueSkeleton() {
  return (
    <div className="w-full mb-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-[72px] rounded-full" />
        </div>
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="flex overflow-x-auto gap-4 pb-2 -mx-1 px-1">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="min-w-50 w-50 shrink-0 overflow-hidden border-2 shadow-sm">
            <CardContent className="p-0">
              <Skeleton className="h-7 w-full rounded-none" />
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center gap-3">
                  <Skeleton className="h-5 w-[104px]" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-sm" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="pt-1 flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-[88px] rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CategoryFilterSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-6 w-28 mb-3" />
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center h-auto py-3 px-4 min-w-24 gap-2 rounded-xl border bg-background"
          >
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div>
      <Skeleton className="h-6 w-[120px] mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <Card key={idx} className="overflow-hidden">
            <Skeleton className="aspect-4/3 w-full rounded-none" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-6 w-24 mb-3" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function OrderSidebarSkeleton() {
  return (
    <div className="h-full flex flex-col bg-card border-l">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
      </div>
      <div className="p-4 space-y-4 overflow-hidden">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-5 w-[88px]" />
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-[72px]" />
            </div>
          ))}
        </div>
        <div className="pt-4 grid grid-cols-2 gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}

export default function POSPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currencySymbol, formatCurrency } = useTenantSettings()
  const {
    menuItems,
    tables,
    activeOrders,
    heldOrders,
    categories,
    discounts,
    taxRate,
    cashierSession,
    selectedCustomer,
    kitchenDisplays,
    tenantId,
    loading: isPosDataLoading,
    refresh: refreshPOSData,
  } = useOptimizedPOSData()

  const createFallbackOrderNumber = () => `#ORD-${Math.floor(Math.random() * 10000)}`

  const fetchNextOrderNumber = async (tid: string) => {
    const { data, error } = await supabase.rpc('get_next_order_number', { p_tenant_id: tid })
    if (error || !data) throw error ?? new Error('Failed to generate order number')
    return data as string
  }

  // UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null)
  const [customDiscount, setCustomDiscount] = useState<{ type: 'percentage' | 'fixed', value: number }>({ type: 'percentage', value: 0 })
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<ActiveOrder | null>(null)

  // Cashier Session State
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerModalMode, setRegisterModalMode] = useState<'open' | 'close'>('open')
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)

  // Order State
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<SaleType>("dine_in")
  const [currentSelectedCustomer, setCurrentSelectedCustomer] = useState<Customer | null>(null)
  const [orderNote, setOrderNote] = useState("")
  const [tableId, setTableId] = useState("")
  const [currentOrderId, setCurrentOrderId] = useState("")
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const initialLoadCompleteRef = useRef(false)

  useEffect(() => {
    if (selectedCustomer) {
      setCurrentSelectedCustomer(selectedCustomer)
    }
  }, [selectedCustomer])

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (data?.role) {
        setCurrentUserRole(data.role)
      }
    }

    void fetchRole()
  }, [])

  useEffect(() => {
    if (isPosDataLoading) return

    if (!initialLoadCompleteRef.current) {
      initialLoadCompleteRef.current = true
      if (!cashierSession) {
        setRegisterModalMode('open')
        setShowRegisterModal(true)
      }
    }
  }, [cashierSession, isPosDataLoading])

  // Poll for KDS updates
  useEffect(() => {
    if (!tenantId) return

    const fetchKDSUpdates = async () => {
      try {
        const { data: kdsRes, error } = await supabase
          .from("kds_orders")
          .select("*")
          .eq("tenant_id", tenantId)
          .in("status", ["pending", "preparing", "ready"])
          .order("created_at", { ascending: false })

        if (error) throw error

        if (kdsRes && kdsRes.length > 0) {
            const saleIds = kdsRes.map(k => k.sale_id)
            const { data: salesRes } = await supabase
              .from("sales")
              .select("id, notes, tables(table_number)")
              .in("id", saleIds)
    
            const salesMap = new Map(salesRes?.map(s => [s.id, s]))
    
            const orders: ActiveOrder[] = kdsRes.map(kds => {
              const sale = salesMap.get(kds.sale_id)
              let name = "Guest"
              if (sale?.notes?.startsWith("Customer: ")) {
                name = sale.notes.replace("Customer: ", "")
              }
    
              const tableData = sale?.tables as unknown as { table_number: string } | null
              const tableNumber = tableData?.table_number
    
              return {
                id: kds.id,
                saleId: kds.sale_id,
                orderNumber: kds.order_number,
                customerName: name,
                status: kds.status as OrderStatus,
                assignedStation: kds.assigned_station,
                tableNumber: tableNumber ? String(tableNumber) : undefined,
              }
            })
            activeOrdersRef.current = orders
        } else {
            activeOrdersRef.current = []
        }
      } catch (err) {
        console.error("Error polling KDS:", err)
      }
    }

    const intervalId = setInterval(fetchKDSUpdates, 5000)

    return () => clearInterval(intervalId)
  }, [tenantId])

  const activeOrdersRef = useRef(activeOrders)
  useEffect(() => {
    activeOrdersRef.current = activeOrders
  }, [activeOrders])

  useEffect(() => {
    const ensureOrderNumber = async () => {
      if (!tenantId) return
      if (activeSaleId) return
      if (currentOrderId) return

      try {
        const next = await fetchNextOrderNumber(tenantId)
        setCurrentOrderId(next)
      } catch {
        setCurrentOrderId(createFallbackOrderNumber())
      }
    }

    void ensureOrderNumber()
  }, [tenantId, activeSaleId, currentOrderId])

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [menuItems, selectedCategory, searchQuery])

  const addToCart = (item: MenuItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.item.id === item.id)
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(i => i.item.id !== itemId))
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(i => {
        if (i.item.id === itemId) {
          const newQty = Math.max(0, i.quantity + delta)
          return { ...i, quantity: newQty }
        }
        return i
      }).filter(i => i.quantity > 0)
    })
  }

  const handleRegisterAction = async (amount: number, notes: string) => {
    setIsProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: "Authentication Required", description: "Please sign in again to open the register.", variant: "destructive" })
        return
      }
      if (!tenantId) {
        toast({ title: "No Tenant Found", description: "Unable to resolve tenant for this account.", variant: "destructive" })
        return
      }

      if (registerModalMode === 'open') {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('open_cashier_session', {
            p_tenant_id: tenantId,
            p_user_id: user.id,
            p_opening_amount: amount,
            p_notes: notes
          })

        if (rpcError) {
          const rpcMessage = rpcError.message || 'Failed to open register session'
          if (rpcMessage.includes('OPEN_SESSION_EXISTS') || rpcMessage.includes('already have an open register session')) {
            await refreshPOSData()
            setShowRegisterModal(false)
            toast({ 
              title: "Register Already Open", 
              description: "You already have an open register session.",
              variant: "destructive" 
            })
            return
          }
          toast({ title: "Open Register Failed", description: rpcMessage, variant: "destructive" })
          return
        }

        if (rpcResult && typeof rpcResult === 'object' && 'success' in rpcResult && !rpcResult.success) {
          await refreshPOSData()
          setShowRegisterModal(false)
          toast({ 
            title: "Open Register Failed", 
            description: rpcResult.message || "Failed to open register session.",
            variant: "destructive" 
          })
          return
        }

        await refreshPOSData()
        setShowRegisterModal(false)
        toast({ title: "Register Opened", description: `Register opened with ${formatCurrency(amount)}` })
      } else {
        const { data: closeResult, error: closeError } = await supabase
          .rpc('close_cashier_session', {
            p_user_id: user.id,
            p_closing_amount: amount,
            p_notes: notes
          })

        if (closeError) {
          if (closeError.message.includes('NO_OPEN_SESSION') || closeError.message.includes('No open register session')) {
            await refreshPOSData()
            setShowRegisterModal(false)
            toast({ 
              title: "No Open Register", 
              description: "You don't have any open register session to close.",
              variant: "destructive" 
            })
            return
          }
          throw closeError
        }

        if (closeResult && typeof closeResult === 'object' && 'success' in closeResult && !closeResult.success) {
          await refreshPOSData()
          setShowRegisterModal(false)
          toast({ 
            title: "No Open Register", 
            description: closeResult.message || "You don't have any open register session to close.",
            variant: "destructive" 
          })
          return
        }

        await refreshPOSData()
        setShowRegisterModal(false)
        toast({ title: "Register Closed", description: `Register closed with ${formatCurrency(amount)}` })
        
        setRegisterModalMode('open')
        setShowRegisterModal(true)
        setSessionSummary(null)
      }
    } catch (error) {
      console.error(error)
      const message = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Failed to update register status'
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const openCloseRegisterModal = async () => {
    if (!cashierSession) return

    setRegisterModalMode('close')
    setShowRegisterModal(true)

    setIsProcessing(true)
    try {
        const toNumber = (value: unknown) => {
          if (typeof value === 'number') return Number.isFinite(value) ? value : 0
          if (typeof value === 'string') {
            const parsed = Number.parseFloat(value)
            return Number.isFinite(parsed) ? parsed : 0
          }
          return 0
        }

        const { data: sales, error } = await supabase
          .from('sales')
          .select('id, total_amount, payment_method, payment_status, discount_amount, tax_amount')
          .eq('tenant_id', cashierSession.tenant_id)
          .eq('created_by', cashierSession.user_id)
          .gte('created_at', cashierSession.opening_time)
          .in('payment_status', ['paid', 'refunded'])

        if (error) throw error

        const rows = Array.isArray(sales) ? sales : []

        const paidRows = rows.filter((s) => s?.payment_status === 'paid')
        const refundedRows = rows.filter((s) => s?.payment_status === 'refunded')

        const refundedSaleIds = refundedRows.map((s) => String(s.id)).filter(Boolean)
        const voidedSaleIdSet = new Set<string>()

        if (refundedSaleIds.length > 0) {
          const { data: kdsOrders, error: kdsError } = await supabase
            .from('kds_orders')
            .select('sale_id, status')
            .eq('tenant_id', cashierSession.tenant_id)
            .in('sale_id', refundedSaleIds)

          if (kdsError) throw kdsError

          const kdsRows = Array.isArray(kdsOrders) ? kdsOrders : []
          kdsRows.forEach((k) => {
            if (k?.status === 'cancelled' && k?.sale_id) {
              voidedSaleIdSet.add(String(k.sale_id))
            }
          })
        }

        const voidedRows = refundedRows.filter((s) => voidedSaleIdSet.has(String(s.id)))
        const nonVoidedRefundRows = refundedRows.filter((s) => !voidedSaleIdSet.has(String(s.id)))

        let totalSales = 0
        let cashSales = 0
        let cardSales = 0
        let discountAmount = 0
        let taxAmount = 0
        let netSales = 0

        paidRows.forEach((s) => {
          const totalAmount = toNumber(s?.total_amount)
          const tax = toNumber(s?.tax_amount)
          const discount = toNumber(s?.discount_amount)

          totalSales += totalAmount
          taxAmount += tax
          discountAmount += discount
          netSales += totalAmount - tax

          if (s?.payment_method === 'cash') cashSales += totalAmount
          if (s?.payment_method === 'card') cardSales += totalAmount
        })

        const refundedAmount = nonVoidedRefundRows.reduce(
          (acc, s) => acc + toNumber(s?.total_amount),
          0
        )
        const voidedAmount = voidedRows.reduce((acc, s) => acc + toNumber(s?.total_amount), 0)

        const transactionCount = paidRows.length

        setSessionSummary({
          totalSales: totalSales || 0,
          cashSales: cashSales || 0,
          cardSales: cardSales || 0,
          transactionCount: transactionCount || 0,
          refundedAmount: refundedAmount || 0,
          refundedCount: nonVoidedRefundRows.length || 0,
          voidedAmount: voidedAmount || 0,
          voidedCount: voidedRows.length || 0,
          discountAmount: discountAmount || 0,
          taxAmount: taxAmount || 0,
          netSales: netSales || 0,
        })

    } catch (err) {
        console.error("Error calculating session summary:", err)
        toast({ title: "Warning", description: "Could not calculate session summary", variant: "destructive" })
    } finally {
        setIsProcessing(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!cashierSession) return

    try {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                order_number,
                total_amount,
                payment_status,
                payment_method,
                sale_date,
                sale_time,
                notes,
                discount_amount,
                tax_amount,
                tables (table_number),
                sale_items (quantity)
            `)
            .eq('tenant_id', cashierSession.tenant_id)
            .eq('created_by', cashierSession.user_id)
            .gte('created_at', cashierSession.opening_time)
            .order('created_at', { ascending: false })

        if (error) throw error

        if (!data || data.length === 0) {
            toast({ title: "No Data", description: "No transactions found for this session." })
            return
        }

        const rows = (data as unknown) as (SaleReportRow & { discount_amount: number, tax_amount: number })[]

        const headers = ["Order #", "Date", "Time", "Customer", "Table", "Items", "Total", "Discount", "Tax", "Payment Method", "Status"]
        const csvContent = [
            headers.join(","),
            ...rows.map((s) => {
                let name = "Guest"
                if (s.notes?.startsWith("Customer: ")) {
                    name = s.notes.replace("Customer: ", "")
                    if (name.includes(" | Note: ")) {
                        name = name.split(" | Note: ")[0]
                    }
                }

                const itemsCount =
                  s.sale_items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0
                const tableRel = s.tables
                const tableNum = Array.isArray(tableRel)
                  ? tableRel[0]?.table_number
                  : tableRel?.table_number

                let status = s.payment_status
                if (s.payment_status === 'refunded' && !s.payment_method) {
                    status = 'void'
                }

                return [
                    s.order_number,
                    new Date(s.sale_date).toLocaleDateString(),
                    new Date(s.sale_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    `"${name.replace(/"/g, '""')}"`,
                    tableNum || "",
                    itemsCount,
                    s.total_amount,
                    s.discount_amount || 0,
                    s.tax_amount || 0,
                    s.payment_method || "",
                    status
                ].join(",")
            })
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `session_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

    } catch (err) {
        console.error("Error generating report:", err)
        toast({ title: "Error", description: "Failed to generate report", variant: "destructive" })
    }
  }

  const handleVoid = async (t: Transaction) => {
      if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
          toast({ title: "Unauthorized", description: "Only admins can void orders", variant: "destructive" })
          return
      }
      try {
          const { error: saleError } = await supabase
              .from('sales')
              .update({ payment_status: 'refunded' })
              .eq('id', t.id)
          
          if (saleError) throw saleError

          const { data: kdsOrder } = await supabase
            .from('kds_orders')
            .select('id')
            .eq('sale_id', t.id)
            .single()
            
          if (kdsOrder) {
              await supabase
                  .from('kds_orders')
                  .update({ status: 'cancelled' })
                  .eq('id', kdsOrder.id)
          }

          toast({ title: "Order Voided", description: `Order ${t.orderNumber} has been voided.` })
          await refreshPOSData()
      } catch (err) {
          console.error("Error voiding order:", err)
          toast({ title: "Error", description: "Failed to void order", variant: "destructive" })
          throw err
      }
  }

  const handleRefund = async (t: Transaction) => {
      if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
          toast({ title: "Unauthorized", description: "Only admins can refund orders", variant: "destructive" })
          return
      }
      try {
          const { error } = await supabase
              .from('sales')
              .update({ payment_status: 'refunded' })
              .eq('id', t.id)
          
          if (error) throw error

          toast({ title: "Order Refunded", description: `Order ${t.orderNumber} has been refunded.` })
          await refreshPOSData()
      } catch (err) {
          console.error("Error refunding order:", err)
          toast({ title: "Error", description: "Failed to refund order", variant: "destructive" })
          throw err
      }
  }

  const handleDeleteHeldOrder = async (orderId: string) => {
    if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
      toast({ title: "Unauthorized", description: "Only admins can delete orders", variant: "destructive" })
      return
    }

    if (!confirm('Are you sure you want to delete this held order? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      toast({ title: "Order Deleted", description: "Held order has been deleted." })
      await refreshPOSData()
    } catch (err) {
      console.error("Error deleting held order:", err)
      toast({ title: "Error", description: "Failed to delete held order", variant: "destructive" })
    }
  }

  const cartTotal = useMemo(() => {
    const subtotal = cartItems.reduce((acc, curr) => acc + (curr.item.selling_price * curr.quantity), 0)
    
    let discountAmount = 0
    
    if (selectedDiscountId === 'custom') {
        if (customDiscount.type === 'percentage') {
            discountAmount = subtotal * (customDiscount.value / 100)
        } else {
            discountAmount = customDiscount.value
        }
    } else {
        const selectedDiscount = discounts.find(d => d.id === selectedDiscountId)
        if (selectedDiscount) {
          if (selectedDiscount.type === 'percentage') {
            discountAmount = subtotal * (selectedDiscount.value / 100)
          } else {
            discountAmount = selectedDiscount.value
          }
        }
    }

    discountAmount = Math.min(discountAmount, subtotal)
    
    const taxableAmount = subtotal - discountAmount
    const tax = taxableAmount * (taxRate / 100)
    
    return { subtotal, discount: discountAmount, tax, total: taxableAmount + tax }
  }, [cartItems, taxRate, selectedDiscountId, discounts, customDiscount])

  const discountName = useMemo(() => {
    if (selectedDiscountId === 'custom') {
        return `Custom (${customDiscount.type === 'percentage' ? `${customDiscount.value}%` : `$${customDiscount.value}`})`
    }
    return discounts.find(d => d.id === selectedDiscountId)?.name
  }, [selectedDiscountId, customDiscount, discounts])

  const handleSendToKitchen = async (destination?: string, options?: { holdAfterSend?: boolean }) => {
    if (!tenantId) return
    if (cartItems.length === 0) return

    setIsProcessing(true)
    try {
       await saveOrder('pending', null, destination)
       
       const destinationName = destination 
         ? kitchenDisplays.find(d => d.id === destination)?.name || destination
         : 'Kitchen'

       toast({
        title: "Sent",
        description: `Order sent to ${destinationName}.`,
       })

       if (options?.holdAfterSend) {
         clearCart()
         await refreshPOSData()
       }
    } catch (err: unknown) {
        console.error("Error sending to kitchen:", JSON.stringify(err, null, 2))
        toast({ title: "Error", description: "Failed to send order", variant: "destructive" })
    } finally {
        setIsProcessing(false)
    }
  }

  const handleOrderSubmit = async (status: 'hold' | 'pay') => {
    if (!tenantId) return
    if (cartItems.length === 0) return
    
    if (status === 'pay') {
        setShowPaymentModal(true)
        return
    }

    setIsProcessing(true)
    try {
       await saveOrder('pending')
       
       toast({
        title: "Order Held",
        description: `Order has been held.`,
       })
       
       clearCart()
       await refreshPOSData()
    } catch (err: unknown) {
        console.error("Error holding order:", JSON.stringify(err, null, 2))
        toast({ title: "Error", description: "Failed to hold order", variant: "destructive" })
    } finally {
        setIsProcessing(false)
    }
  }

  const saveOrder = async (paymentStatus: 'pending' | 'paid', paymentMethod: string | null = null, destination?: string, additionalData?: PaymentAdditionalData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!tenantId || !user) throw new Error("No user or tenant")

      let orderNumber = currentOrderId
      if (!orderNumber) {
        try {
          orderNumber = await fetchNextOrderNumber(tenantId)
        } catch {
          orderNumber = createFallbackOrderNumber()
        }
        setCurrentOrderId(orderNumber)
      }

      let saleId = activeSaleId
      
      let notes = `Customer: ${currentSelectedCustomer?.name || 'Walk-in Customer'}${orderNote ? ` | Note: ${orderNote}` : ''}`
      if (additionalData) {
          if (additionalData.ref) notes += ` | Ref: ${additionalData.ref}`
          if (additionalData.notes) notes += ` | PayNote: ${additionalData.notes}`
          if (additionalData.attachment) notes += ` | Attach: ${additionalData.attachment}`
      }

      const normalizedPaymentMethod = paymentMethod === 'house_account' ? null : paymentMethod
      const paymentNotes = additionalData?.notes ?? null
      const paymentData = additionalData ?? {}

      if (activeSaleId) {
          const { error: saleError } = await supabase
            .from("sales")
            .update({
                total_amount: cartTotal.total,
                payment_status: paymentStatus,
                payment_method: normalizedPaymentMethod,
                payment_notes: paymentNotes,
                payment_data: paymentData,
                notes: notes,
                customer_id: currentSelectedCustomer?.id || null,
                discount_amount: cartTotal.discount,
                discount_name: selectedDiscountId === 'custom' 
                    ? `Custom (${customDiscount.type === 'percentage' ? `${customDiscount.value}%` : `$${customDiscount.value}`})`
                    : discounts.find(d => d.id === selectedDiscountId)?.name,
                tax_amount: cartTotal.tax,
                table_id: tableId || null,
                sale_type: orderType
            })
            .eq('id', activeSaleId)
          
          if (saleError) throw saleError

          await supabase.from("sale_items").delete().eq("sale_id", activeSaleId)
      } else {
          const { data: saleData, error: saleError } = await supabase
            .from("sales")
            .insert({
              tenant_id: tenantId,
              order_number: orderNumber,
              sale_type: orderType,
              table_id: tableId || null,
              total_amount: cartTotal.total,
              payment_status: paymentStatus,
              payment_method: normalizedPaymentMethod,
              payment_notes: paymentNotes,
              payment_data: paymentData,
              notes: notes,
              customer_id: currentSelectedCustomer?.id || null,
              discount_amount: cartTotal.discount,
              discount_name: selectedDiscountId === 'custom' 
                  ? `Custom (${customDiscount.type === 'percentage' ? `${customDiscount.value}%` : `$${customDiscount.value}`})`
                  : discounts.find(d => d.id === selectedDiscountId)?.name,
              tax_amount: cartTotal.tax,
              sale_date: new Date().toISOString().split('T')[0],
              sale_time: new Date().toISOString(),
              created_by: user.id
            })
            .select()
            .single()

          if (saleError) throw saleError
          saleId = saleData.id
          setActiveSaleId(saleData.id)
      }

      const saleItemsData = cartItems.map(i => ({
        sale_id: saleId,
        menu_item_id: i.item.id,
        quantity: i.quantity,
        unit_price: i.item.selling_price,
        total_price: i.item.selling_price * i.quantity
      }))

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItemsData)

      if (itemsError) throw itemsError
      
      const { data: kdsOrder } = await supabase
        .from("kds_orders")
        .select("id")
        .eq("sale_id", saleId)
        .single()
        
      if (kdsOrder) {
           if (destination) {
               await supabase
                .from("kds_orders")
                .update({ assigned_station: destination })
                .eq("id", kdsOrder.id)
            }

           await supabase.from("kds_order_items").delete().eq("kds_order_id", kdsOrder.id)
           
           const kdsItemsData = cartItems.map(i => ({
                kds_order_id: kdsOrder.id,
                menu_item_id: i.item.id,
                quantity: i.quantity,
                status: 'pending' as const
             }))
             await supabase.from("kds_order_items").insert(kdsItemsData)
      } else {
           console.warn("KDS Order not found for sale", saleId)
      } 
      
      if (!saleId) throw new Error('Failed to save sale')
      return { saleId, orderNumber }
  }
  
  const handlePaymentComplete = async (method: string, receivedAmount: number, isHouseAccount: boolean, additionalData?: PaymentAdditionalData, destination?: string) => {
      setIsProcessing(true)
      try {
          const status = isHouseAccount ? 'pending' : 'paid'
          const mergedAdditionalData = {
            ...additionalData,
            receivedAmount: isHouseAccount ? undefined : receivedAmount,
          } satisfies PaymentAdditionalData

          const result = await saveOrder(status, method, destination, mergedAdditionalData)
          
          toast({
              title: "Payment Successful",
              description: isHouseAccount
                ? `Order has been charged to house account.`
                : `Order has been paid via ${method.replace('_', ' ')}.`,
          })
          
          clearCart()
          await refreshPOSData()

          return result
      } catch (err) {
          console.error(err)
          toast({ title: "Error", description: "Failed to process payment", variant: "destructive" })
          throw err
      } finally {
          setIsProcessing(false)
      }
  }

  const resumeOrder = async (saleId: string) => {
      setIsProcessing(true)
      try {
          const { data: sale } = await supabase
            .from("sales")
            .select("*, sale_items(*, menu_items(*))")
            .eq("id", saleId)
            .single()
            
          if (!sale) throw new Error("Order not found")
          
          setCurrentOrderId(sale.order_number)
          
          if (sale.customer_id) {
            const { data: customer } = await supabase
              .from('customers')
              .select('*')
              .eq('id', sale.customer_id)
              .single()
            if (customer) setCurrentSelectedCustomer(customer)
          } else {
            setCurrentSelectedCustomer(null)
          }

          setTableId(sale.table_id || "")
          setOrderType(sale.sale_type as SaleType)
          setActiveSaleId(sale.id)
          
          const menuItemsById = new Map(menuItems.map(item => [item.id, item]))
          const saleItemsFromSale = (sale.sale_items as Array<{
            menu_item_id?: string | null
            quantity?: number | null
            menu_items?: MenuItem | null
          }> | null) ?? []
          let saleItems = saleItemsFromSale

          if (saleItems.length === 0) {
            const { data: saleItemsData } = await supabase
              .from("sale_items")
              .select("menu_item_id, quantity")
              .eq("sale_id", saleId)
            saleItems = saleItemsData ?? []
          }

          const missingIds = saleItems
            .map(item => item.menu_item_id)
            .filter((id): id is string => !!id && !menuItemsById.has(id))

          const fetchedMenuItemsMap = new Map<string, MenuItem>()
          if (missingIds.length > 0) {
            const { data: fetchedMenuItems } = await supabase
              .from("menu_items")
              .select("*")
              .in("id", missingIds)
            for (const item of fetchedMenuItems ?? []) {
              fetchedMenuItemsMap.set(item.id, item)
            }
          }

          const items: CartItem[] = saleItems
            .map((si) => {
              const menuItem = si.menu_items
                ?? (si.menu_item_id ? menuItemsById.get(si.menu_item_id) : undefined)
                ?? (si.menu_item_id ? fetchedMenuItemsMap.get(si.menu_item_id) : undefined)
              if (!menuItem) return null
              return {
                item: menuItem,
                quantity: si.quantity ?? 0
              }
            })
            .filter((item): item is CartItem => item !== null)

          setCartItems(items)
          
          setShowHeldOrders(false)
          toast({ title: "Order Resumed", description: `Resumed order ${sale.order_number}` })
      } catch (err) {
          console.error(err)
          toast({ title: "Error", description: "Failed to resume order", variant: "destructive" })
      } finally {
          setIsProcessing(false)
      }
  }

  const clearCart = () => {
    setCartItems([])
    setCurrentSelectedCustomer(null)
    setTableId("")
    setActiveSaleId(null)
    setCurrentOrderId("")
  }

  return (
    <div className="print:hidden absolute top-(--header-height) left-0 right-0 bottom-0 flex overflow-hidden bg-background md:rounded-b-xl">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex gap-4 mb-6">
            <Button variant="secondary" onClick={() => router.push('/dashboard')} className="gap-2 shrink-0">
                <X className="h-4 w-4" />
                Exit POS
            </Button>
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search something here..." 
                    className="pl-9 bg-background" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="outline" onClick={() => setShowHeldOrders(true)} className="gap-2">
                <Clock className="h-4 w-4" />
                Held Orders
                {heldOrders.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                        {heldOrders.length}
                    </span>
                )}
            </Button>
            <Button variant="outline" onClick={() => setShowTransactionsModal(true)} className="gap-2">
                <List className="h-4 w-4" />
                All Orders
            </Button>
            {cashierSession && (
            <Button 
              variant="destructive" 
              size="icon"
              onClick={openCloseRegisterModal} 
              title="Close Register"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isPosDataLoading ? (
          <OrderQueueSkeleton />
        ) : (
          <OrderQueue
            orders={activeOrders}
            kitchenDisplays={kitchenDisplays}
            onOrderClick={(order) => setSelectedOrderDetails(order)}
          />
        )}

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {isPosDataLoading ? (
              <CategoryFilterSkeleton />
            ) : (
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
              />
            )}

            {isPosDataLoading ? (
              <ProductGridSkeleton />
            ) : (
              <ProductGrid
                items={filteredItems}
                cart={cartItems.reduce((acc, curr) => ({ ...acc, [curr.item.id]: curr.quantity }), {})}
                onAdd={addToCart}
                onRemove={(item) => {
                  const existing = cartItems.find(i => i.item.id === item.id)
                  if (existing && existing.quantity > 1) {
                    updateQuantity(item.id, -1)
                  } else {
                    removeFromCart(item.id)
                  }
                }}
                currency={currencySymbol}
              />
            )}
        </div>
      </div>

      <div className="w-100 shrink-0 flex-col border-l bg-background hidden lg:flex">
        {isPosDataLoading || !currentOrderId ? (
          <OrderSidebarSkeleton />
        ) : (
          <OrderSidebar
            orderId={currentOrderId}
            orderType={orderType}
            setOrderType={setOrderType}
            selectedCustomer={currentSelectedCustomer}
            onSelectCustomer={setCurrentSelectedCustomer}
            orderNote={orderNote}
            setOrderNote={setOrderNote}
            tableId={tableId}
            setTableId={setTableId}
            tables={tables}
            cartItems={cartItems}
            onRemoveItem={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onHoldOrder={() => handleOrderSubmit('hold')}
            onPay={() => handleOrderSubmit('pay')}
            onClearCart={clearCart}
            subtotal={cartTotal.subtotal}
            discount={cartTotal.discount}
            tax={cartTotal.tax}
            taxRate={taxRate}
            total={cartTotal.total}
            currency={currencySymbol}
            isProcessing={isProcessing}
            discounts={discounts}
            selectedDiscountId={selectedDiscountId}
            onSelectDiscount={setSelectedDiscountId}
            customDiscount={customDiscount}
            setCustomDiscount={setCustomDiscount}
            onTaxChange={() => {}}
            tenantId={tenantId}
            onSendToKitchen={handleSendToKitchen}
            kitchenDisplays={kitchenDisplays}
          />
        )}
      </div>

      <RegisterModal 
        isOpen={showRegisterModal}
        mode={registerModalMode}
        onSubmit={handleRegisterAction}
        onCancel={registerModalMode === 'close' ? () => setShowRegisterModal(false) : () => router.push('/dashboard')}
        isLoading={isProcessing}
        sessionSummary={sessionSummary}
        onDownloadReport={handleDownloadReport}
        currency={currencySymbol}
        openingTime={cashierSession?.opening_time}
      />

      <HeldOrdersModal 
        isOpen={showHeldOrders}
        onClose={() => setShowHeldOrders(false)}
        heldOrders={heldOrders}
        onResumeOrder={resumeOrder}
        onDeleteOrder={handleDeleteHeldOrder}
        canDelete={currentUserRole === 'owner' || currentUserRole === 'manager'}
        isLoading={isProcessing}
        currency={currencySymbol}
      />

      <TransactionsModal
        isOpen={showTransactionsModal}
        onClose={() => setShowTransactionsModal(false)}
        onRefund={handleRefund}
        onVoid={handleVoid}
        session={cashierSession}
        canManageOrders={currentUserRole === 'owner' || currentUserRole === 'manager'}
        currency={currencySymbol}
      />

      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        totalAmount={cartTotal.total}
        customerName={currentSelectedCustomer?.name || 'Walk-in Customer'}
        orderNumber={currentOrderId}
        items={cartItems.map(i => ({ name: i.item.name, quantity: i.quantity, price: i.item.selling_price }))}
        subtotal={cartTotal.subtotal}
        tax={cartTotal.tax}
        discount={cartTotal.discount}
        discountName={discountName}
        currency={currencySymbol}
        isLoading={isProcessing}
        kitchenDisplays={kitchenDisplays}
      />

      <OrderDetailsModal 
        isOpen={!!selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
        order={selectedOrderDetails}
        currency={currencySymbol}
      />
    </div>
  )
}
