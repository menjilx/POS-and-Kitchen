'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { MenuItem, Table, CashierSession, Customer } from '@/types/database'
import { format, formatDistanceToNow } from 'date-fns'

type Discount = {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  is_active: boolean
  created_at: string
}

type KitchenDisplay = {
  id: string
  name: string
}

type OrderStatus = 'ready' | 'preparing' | 'pending' | 'served' | 'cancelled'

type ActiveOrder = {
  id: string
  saleId?: string
  orderNumber: string
  customerName: string
  status: OrderStatus
  tableNumber?: string
  assignedStation?: string | null
}

type HeldOrder = {
  id: string
  orderNumber: string
  customerName: string
  totalAmount: number
  date: string
  time: string
  itemsCount: number
  status?: string
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

async function fetchWalkInCustomer(): Promise<Customer | null> {
  const { data: walkInCandidates } = await supabase
    .from('customers')
    .select('*')
    .in('name', ['Walk-in', 'Walk in', 'Walk-in Customer', 'Walkin', 'Walkin Customer'])
    .limit(10)

  if (!walkInCandidates || walkInCandidates.length === 0) return null

  const normalizeName = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')

  const isCanonical = (value: string) => normalizeName(value) === 'walk in'
  const active = walkInCandidates.filter((c) => c.is_active !== false)
  const candidates = active.length > 0 ? active : walkInCandidates
  const canonical = candidates.find((c) => isCanonical(String(c.name ?? '')))

  return (canonical ?? candidates[0]) as Customer
}

async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("status", "active")
    .order("name")

  if (error) throw error
  return data || []
}

async function fetchTables(): Promise<Table[]> {
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .in("status", ["available", "reserved"])
    .order("table_number")

  if (error) throw error
  return data || []
}

async function fetchKitchenDisplays(): Promise<KitchenDisplay[]> {
  const { data, error } = await supabase
    .from('kitchen_displays')
    .select('id, name')

  if (error) throw error
  return data || []
}

async function fetchDiscounts(): Promise<Discount[]> {
  const { data, error } = await supabase
    .from('discounts')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data || []
}

async function fetchTaxRate(): Promise<number> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'tax_rate')
    .single()

  if (data?.value) {
    return Number(data.value) || 0
  }
  return 0
}

async function fetchCashierSession(userId: string): Promise<CashierSession | null> {
  const { data, error } = await supabase
    .from('cashier_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

async function fetchActiveOrders(): Promise<ActiveOrder[]> {
  const { data: kdsRes, error: kdsError } = await supabase
    .from("kds_orders")
    .select("*")
    .in("status", ["pending", "preparing", "ready"])
    .order("created_at", { ascending: false })

  if (kdsError) throw kdsError
  if (!kdsRes || kdsRes.length === 0) return []

  const saleIds = kdsRes.map(k => k.sale_id)
  const { data: salesRes } = await supabase
    .from("sales")
    .select("id, notes, tables(table_number)")
    .in("id", saleIds)

  const salesMap = new Map(salesRes?.map(s => [s.id, s]) || [])

  return kdsRes.map(kds => {
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
      status: kds.status as 'ready' | 'preparing' | 'pending' | 'served' | 'cancelled',
      assignedStation: kds.assigned_station,
      tableNumber: tableNumber ? String(tableNumber) : undefined,
    }
  })
}

async function fetchHeldOrders(): Promise<HeldOrder[]> {
  const { data: heldSales, error: heldError } = await supabase
    .from("sales")
    .select("*")
    .eq("payment_status", "pending")
    .order("created_at", { ascending: false })

  if (heldError) throw heldError
  if (!heldSales || heldSales.length === 0) return []

  const saleIds = heldSales.map(s => s.id)
  const { data: kdsStatus } = await supabase
    .from("kds_orders")
    .select("sale_id, status")
    .in("sale_id", saleIds)

  const statusMap = new Map(kdsStatus?.map(k => [k.sale_id, k.status]) || [])
  const { data: saleItems } = await supabase
    .from("sale_items")
    .select("sale_id, quantity")
    .in("sale_id", saleIds)

  const itemsCountMap = new Map<string, number>()
  if (saleItems) {
    for (const item of saleItems) {
      const count = itemsCountMap.get(item.sale_id) ?? 0
      itemsCountMap.set(item.sale_id, count + (item.quantity || 0))
    }
  }

  return heldSales.map(s => {
    let name = "Guest"
    if (s.notes?.startsWith("Customer: ")) {
      name = s.notes.replace("Customer: ", "")
      if (name.includes(" | Note: ")) {
        name = name.split(" | Note: ")[0]
      }
    }
    return {
      id: s.id,
      orderNumber: s.order_number,
      customerName: name,
      totalAmount: s.total_amount,
      date: format(new Date(s.sale_time), "MMM-dd, yyyy h:mm a"),
      time: `Wait: ${formatDistanceToNow(new Date(s.sale_time))}`,
      itemsCount: itemsCountMap.get(s.id) ?? 0,
      status: statusMap.get(s.id),
    }
  })
}

type POSData = {
  menuItems: MenuItem[]
  tables: Table[]
  activeOrders: ActiveOrder[]
  heldOrders: HeldOrder[]
  categories: string[]
  discounts: Discount[]
  taxRate: number
  cashierSession: CashierSession | null
  selectedCustomer: Customer | null
  kitchenDisplays: KitchenDisplay[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useOptimizedPOSData(): POSData {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([])
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [taxRate, setTaxRate] = useState(0)
  const [cashierSession, setCashierSession] = useState<CashierSession | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [kitchenDisplays, setKitchenDisplays] = useState<KitchenDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const user = await getUser()
      if (!user) {
        setError('Authentication required')
        return
      }

      const [
        walkInCustomer,
        menuItemsData,
        tablesData,
        displaysData,
        discountsData,
        taxData,
        sessionData,
        activeOrdersData,
        heldOrdersData,
      ] = await Promise.all([
        fetchWalkInCustomer(),
        fetchMenuItems(),
        fetchTables(),
        fetchKitchenDisplays(),
        fetchDiscounts(),
        fetchTaxRate(),
        fetchCashierSession(user.id),
        fetchActiveOrders(),
        fetchHeldOrders(),
      ])

      setSelectedCustomer(walkInCustomer || null)
      setMenuItems(menuItemsData)
      setTables(tablesData)
      setKitchenDisplays(displaysData)
      setDiscounts(discountsData)
      setTaxRate(taxData)
      setCashierSession(sessionData)
      setActiveOrders(activeOrdersData)
      setHeldOrders(heldOrdersData)

      const uniqueCategories = Array.from(new Set(menuItemsData.map(i => i.category).filter(Boolean) as string[]))
      setCategories(uniqueCategories)

      hasLoadedRef.current = true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load POS data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
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
    loading,
    error,
    refresh,
  }
}

export { fetchWalkInCustomer, fetchMenuItems, fetchTables }
