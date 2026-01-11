"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase/client"
import { Search } from "lucide-react"
import type { MenuItem, Table, SaleType } from "@/types/database"
import { useTenantSettings } from "@/hooks/use-tenant-settings"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { OrderQueue } from "@/components/pos/order-queue"
import { CategoryFilter } from "@/components/pos/category-filter"
import { ProductGrid } from "@/components/pos/product-grid"
import { OrderSidebar } from "@/components/pos/order-sidebar"

type CartItem = {
  item: MenuItem
  quantity: number
}

type OrderStatus = "ready" | "in_kitchen" | "pending"

type ActiveOrder = {
  id: string
  orderNumber: string
  customerName: string
  status: OrderStatus
  tableNumber?: string
}

type Discount = {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  is_active: boolean
}

export default function POSPage() {
  const { toast } = useToast()
  const { currencySymbol, formatCurrency } = useTenantSettings()

  // Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [taxRate, setTaxRate] = useState(0)
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null)
  const [customDiscount, setCustomDiscount] = useState<{ type: 'percentage' | 'fixed', value: number }>({ type: 'percentage', value: 0 })

  // Order State
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<SaleType>("dine_in")
  const [customerName, setCustomerName] = useState("")
  const [tableId, setTableId] = useState("")
  const [currentOrderId, setCurrentOrderId] = useState("")
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    setCurrentOrderId(`#ORD-${Math.floor(Math.random() * 10000)}`)
    void loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!userData?.tenant_id) return
    setTenantId(userData.tenant_id)

    // Fetch tenant settings for tax rate
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', userData.tenant_id)
      .single()

    if (tenantData?.settings && typeof tenantData.settings === 'object' && 'tax_rate' in tenantData.settings) {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       setTaxRate(Number((tenantData.settings as any).tax_rate) || 0)
    }

    // Fetch Discounts
    const { data: discountsRes } = await supabase
      .from('discounts')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .eq('is_active', true)
      .order('name')
    
    if (discountsRes) setDiscounts(discountsRes as Discount[])

    // Fetch Menu Items
    const { data: menuRes } = await supabase
      .from("menu_items")
      .select("*")
      .eq("tenant_id", userData.tenant_id)
      .eq("status", "active")
      .order("name")
    
    if (menuRes) {
      setMenuItems(menuRes)
      // Extract categories
      const uniqueCategories = Array.from(new Set(menuRes.map(i => i.category).filter(Boolean) as string[]))
      setCategories(uniqueCategories)
    }

    // Fetch Tables
    const { data: tablesRes } = await supabase
      .from("tables")
      .select("*")
      .eq("tenant_id", userData.tenant_id)
      .in("status", ["available", "reserved"])
      .order("table_number")
    
    if (tablesRes) setTables(tablesRes)

    // Fetch Active Orders (KDS)
    // Note: This requires complex join, simplifying for now
    const { data: kdsRes } = await supabase
      .from("kds_orders")
      .select("*")
      .eq("tenant_id", userData.tenant_id)
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: false })

    if (kdsRes && kdsRes.length > 0) {
        const saleIds = kdsRes.map(k => k.sale_id)
        const { data: salesRes } = await supabase
            .from("sales")
            .select("id, notes")
            .in("id", saleIds)
        
        const salesMap = new Map(salesRes?.map(s => [s.id, s]))

        const orders: ActiveOrder[] = kdsRes.map(kds => {
            const sale = salesMap.get(kds.sale_id)
            let name = "Guest"
            if (sale?.notes?.startsWith("Customer: ")) {
                name = sale.notes.replace("Customer: ", "")
            }
            
            return {
                id: kds.id,
                orderNumber: kds.order_number,
                customerName: name,
                status: kds.status === 'ready' ? 'ready' : 'in_kitchen'
            }
        })
        setActiveOrders(orders)
    } else {
        setActiveOrders([])
    }
  }

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

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal)
    
    const taxableAmount = subtotal - discountAmount
    const tax = taxableAmount * (taxRate / 100)
    
    return { subtotal, discount: discountAmount, tax, total: taxableAmount + tax }
  }, [cartItems, taxRate, selectedDiscountId, discounts, customDiscount])

  const handleOrderSubmit = async (status: 'hold' | 'pay') => {
    if (!tenantId) return
    if (cartItems.length === 0) return
    
    setIsProcessing(true)

    try {
      const paymentStatus = status === 'pay' ? 'paid' : 'pending'
      
      // 1. Create Sale
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          tenant_id: tenantId,
          order_number: currentOrderId,
          sale_type: orderType,
          table_id: tableId || null,
          total_amount: cartTotal.total,
          payment_status: paymentStatus,
          payment_method: status === 'pay' ? 'cash' : null, // Default to cash for now
          notes: `Customer: ${customerName}`, // Storing customer name in notes
          discount_amount: cartTotal.discount,
          discount_name: selectedDiscountId === 'custom' 
            ? `Custom (${customDiscount.type === 'percentage' ? `${customDiscount.value}%` : `$${customDiscount.value}`})`
            : discounts.find(d => d.id === selectedDiscountId)?.name,
          tax_amount: cartTotal.tax,
          sale_date: new Date().toISOString().split('T')[0],
          sale_time: new Date().toLocaleTimeString(),
          created_by: (await supabase.auth.getUser()).data.user?.id || 'system'
        })
        .select()
        .single()

      if (saleError) throw saleError

      // 2. Create Sale Items
      const saleItemsData = cartItems.map(i => ({
        sale_id: saleData.id,
        menu_item_id: i.item.id,
        quantity: i.quantity,
        unit_price: i.item.selling_price,
        total_price: i.item.selling_price * i.quantity
      }))

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItemsData)

      if (itemsError) throw itemsError

      // 3. Create KDS Order (for both Hold and Pay, we send to kitchen)
      const { data: kdsData, error: kdsError } = await supabase
        .from("kds_orders")
        .insert({
          tenant_id: tenantId,
          sale_id: saleData.id,
          order_number: currentOrderId,
          status: 'pending',
          priority: 'normal'
        })
        .select()
        .single()
      
      if (kdsError) throw kdsError

      // 4. Create KDS Items
      const kdsItemsData = cartItems.map(i => ({
        kds_order_id: kdsData.id,
        menu_item_id: i.item.id,
        quantity: i.quantity,
        status: 'pending' as const
      }))

       const { error: kdsItemsError } = await supabase
        .from("kds_order_items")
        .insert(kdsItemsData)

       if (kdsItemsError) throw kdsItemsError


      toast({
        title: status === 'pay' ? "Order Paid" : "Order Held",
        description: `Order ${currentOrderId} has been ${status === 'pay' ? 'processed' : 'held'}.`,
      })

      // Reset
      setCartItems([])
      setCustomerName("")
      setTableId("")
      setCurrentOrderId(`#ORD-${Math.floor(Math.random() * 10000)}`)
      
      // Refresh Orders
      loadData()

    } catch (err: unknown) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : "Failed to process order"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const clearCart = () => {
    setCartItems([])
    setCustomerName("")
    setTableId("")
  }

  return (
    <div className="absolute top-[var(--header-height)] left-0 right-0 bottom-0 flex overflow-hidden bg-background md:rounded-b-xl">
      {/* Left Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Header / Search */}
        <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search something here..." 
                    className="pl-9 bg-background" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            {/* Filter button could go here */}
        </div>

        {/* Order Queue */}
        <OrderQueue orders={activeOrders} />

        {/* Main Content Scroll Area */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {/* Categories */}
            <CategoryFilter 
                categories={categories} 
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
            />

            {/* Product Grid */}
            <ProductGrid 
                items={filteredItems}
                cart={cartItems.reduce((acc, curr) => ({ ...acc, [curr.item.id]: curr.quantity }), {})}
                onAdd={addToCart}
                onRemove={(item) => {
                    // Logic to decrease or remove
                    const existing = cartItems.find(i => i.item.id === item.id)
                    if (existing && existing.quantity > 1) {
                         updateQuantity(item.id, -1)
                    } else {
                        removeFromCart(item.id)
                    }
                }}
                currency={currencySymbol}
            />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[400px] flex-shrink-0">
        <OrderSidebar 
            orderId={currentOrderId}
            orderType={orderType}
            setOrderType={setOrderType}
            customerName={customerName}
            setCustomerName={setCustomerName}
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
        />
      </div>
    </div>
  )
}
