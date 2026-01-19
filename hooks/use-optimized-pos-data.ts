'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { MenuItem, Table, CashierSession, Customer } from '@/types/database'
import { format, formatDistanceToNow } from 'date-fns'

type Discount = {
  id: string
  tenant_id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  is_active: boolean
  created_at: string
}

type KitchenDisplay = {
  id: string
  tenant_id: string
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

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const allowedRoles = new Set(['owner', 'manager', 'staff'])
const allowedStatuses = new Set(['active', 'deactivated'])

async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

async function resolveTenantId(userId: string): Promise<string | null> {
  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userId)
    .maybeSingle()

  if (existingUserError) throw existingUserError
  if (existingUser?.tenant_id) return existingUser.tenant_id

  const user = await getUser()
  if (!user) return null

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const metaTenantIdRaw = typeof meta.tenant_id === 'string' ? meta.tenant_id : null
  const metaTenantId = metaTenantIdRaw && uuidRegex.test(metaTenantIdRaw) ? metaTenantIdRaw : null
  const email = user.email

  if (!email || !metaTenantId) return null

  const fullName = typeof meta.full_name === 'string' ? meta.full_name : null
  const role = typeof meta.role === 'string' && allowedRoles.has(meta.role) ? meta.role : 'staff'
  const status = typeof meta.status === 'string' && allowedStatuses.has(meta.status) ? meta.status : 'active'

  const { data: insertedUser, error: insertError } = await supabase
    .from('users')
    .insert({
      id: user.id,
      tenant_id: metaTenantId,
      email,
      full_name: fullName,
      role,
      status,
    })
    .select('tenant_id')
    .single()

  if (insertError) {
    const { data: reloadedUser, error: reloadError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!reloadError && reloadedUser?.tenant_id) return reloadedUser.tenant_id
    throw insertError
  }

  return insertedUser?.tenant_id ?? null
}

async function fetchWalkInCustomer(tenantId: string): Promise<Customer | null> {
  const { data: walkInCandidates } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
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

async function fetchMenuItems(tenantId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("name")

  if (error) throw error
  return data || []
}

async function fetchTables(tenantId: string): Promise<Table[]> {
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("status", ["available", "reserved"])
    .order("table_number")

  if (error) throw error
  return data || []
}

async function fetchKitchenDisplays(tenantId: string): Promise<KitchenDisplay[]> {
  const { data, error } = await supabase
    .from('kitchen_displays')
    .select('id, tenant_id, name')
    .eq('tenant_id', tenantId)

  if (error) throw error
  return data || []
}

async function fetchDiscounts(tenantId: string): Promise<Discount[]> {
  const { data, error } = await supabase
    .from('discounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data || []
}

async function fetchTaxRate(tenantId: string): Promise<number> {
  const { data } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  if (data?.settings && typeof data.settings === 'object' && 'tax_rate' in data.settings) {
    return Number((data.settings as { tax_rate?: unknown }).tax_rate) || 0
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

async function fetchActiveOrders(tenantId: string): Promise<ActiveOrder[]> {
  const { data: kdsRes, error: kdsError } = await supabase
    .from("kds_orders")
    .select("*")
    .eq("tenant_id", tenantId)
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

async function fetchHeldOrders(tenantId: string): Promise<HeldOrder[]> {
  const { data: heldSales, error: heldError } = await supabase
    .from("sales")
    .select("*, sale_items(quantity)")
    .eq("tenant_id", tenantId)
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
      itemsCount: s.sale_items?.reduce((acc: number, item: { quantity?: number | null }) => acc + (item.quantity || 0), 0) || 0,
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
  tenantId: string | null
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
  const [tenantId, setTenantId] = useState<string | null>(null)
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

      const tid = await resolveTenantId(user.id)
      if (!tid) {
        setError('No tenant found')
        return
      }

      setTenantId(tid)

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
        fetchWalkInCustomer(tid),
        fetchMenuItems(tid),
        fetchTables(tid),
        fetchKitchenDisplays(tid),
        fetchDiscounts(tid),
        fetchTaxRate(tid),
        fetchCashierSession(user.id),
        fetchActiveOrders(tid),
        fetchHeldOrders(tid),
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
    tenantId,
    loading,
    error,
    refresh,
  }
}

export { resolveTenantId, fetchWalkInCustomer, fetchMenuItems, fetchTables }
