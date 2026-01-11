"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase/client"
import { Search, Clock, LogOut } from "lucide-react"
import type { MenuItem, Table, SaleType, CashierSession, Customer, PaymentAdditionalData } from "@/types/database"
import { useTenantSettings } from "@/hooks/use-tenant-settings"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OrderQueue } from "@/components/pos/order-queue"
import { CategoryFilter } from "@/components/pos/category-filter"
import { ProductGrid } from "@/components/pos/product-grid"
import { OrderSidebar } from "@/components/pos/order-sidebar"
import { RegisterModal } from "@/components/pos/register-modal"
import { HeldOrdersModal, HeldOrder } from "@/components/pos/held-orders-modal"
import { PaymentModal } from "@/components/pos/payment-modal"

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
  assignedStation?: string | null
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
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [taxRate, setTaxRate] = useState(0)
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null)
  const [customDiscount, setCustomDiscount] = useState<{ type: 'percentage' | 'fixed', value: number }>({ type: 'percentage', value: 0 })
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Cashier Session State
  const [cashierSession, setCashierSession] = useState<CashierSession | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerModalMode, setRegisterModalMode] = useState<'open' | 'close'>('open')

  // Order State
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<SaleType>("dine_in")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [orderNote, setOrderNote] = useState("")
  const [tableId, setTableId] = useState("")
  const [currentOrderId, setCurrentOrderId] = useState("")
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [kitchenDisplays, setKitchenDisplays] = useState<{ id: string, name: string }[]>([])

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

    // Fetch default Walk-in customer
    const { data: walkIn } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .eq('name', 'Walk-in')
      .single()
    
    if (walkIn) {
      setSelectedCustomer(walkIn)
    }

    // Fetch Kitchen Displays
    const { data: displays } = await supabase
      .from('kitchen_displays')
      .select('id, name')
      .eq('tenant_id', userData.tenant_id)
    
    if (displays) {
        setKitchenDisplays(displays)
    }

    // Check for open cashier session
    const { data: session } = await supabase
      .from('cashier_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .single()
    
    if (session) {
      setCashierSession(session)
    } else {
      setRegisterModalMode('open')
      setShowRegisterModal(true)
    }

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
                status: kds.status === 'ready' ? 'ready' : 'in_kitchen',
                assignedStation: kds.assigned_station
            }
        })
        setActiveOrders(orders)
    } else {
        setActiveOrders([])
    }

    // Fetch Held Orders
    const { data: heldSales } = await supabase
        .from("sales")
        .select("*, sale_items(quantity)")
        .eq("tenant_id", userData.tenant_id)
        .eq("payment_status", "pending")
        .order("created_at", { ascending: false })
    
    if (heldSales) {
        // Fetch KDS status for these sales
        const saleIds = heldSales.map(s => s.id)
        const { data: kdsStatus } = await supabase
            .from("kds_orders")
            .select("sale_id, status")
            .in("sale_id", saleIds)
            
        const statusMap = new Map(kdsStatus?.map(k => [k.sale_id, k.status]))

        const held: HeldOrder[] = heldSales.map(s => {
            let name = "Guest"
            if (s.notes?.startsWith("Customer: ")) {
                name = s.notes.replace("Customer: ", "")
                // Remove note part if exists for display
                if (name.includes(" | Note: ")) {
                    name = name.split(" | Note: ")[0]
                }
            }
            return {
                id: s.id,
                orderNumber: s.order_number,
                customerName: name,
                totalAmount: s.total_amount,
                date: new Date(s.sale_date).toLocaleDateString(),
                time: s.sale_time,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                itemsCount: s.sale_items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0,
                status: statusMap.get(s.id)
            }
        })
        setHeldOrders(held)
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

  const handleRegisterAction = async (amount: number, notes: string) => {
    setIsProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !tenantId) return

      if (registerModalMode === 'open') {
        const { data, error } = await supabase
          .from('cashier_sessions')
          .insert({
            tenant_id: tenantId,
            user_id: user.id,
            opening_amount: amount,
            notes: notes,
            status: 'open',
            opening_time: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) throw error
        setCashierSession(data)
        setShowRegisterModal(false)
        toast({ title: "Register Opened", description: `Register opened with ${formatCurrency(amount)}` })
      } else {
        // Close register
        if (!cashierSession) return
        
        const { error } = await supabase
          .from('cashier_sessions')
          .update({
            closing_amount: amount,
            closing_time: new Date().toISOString(),
            status: 'closed',
            notes: notes ? (cashierSession.notes ? `${cashierSession.notes}\nClosing Note: ${notes}` : `Closing Note: ${notes}`) : cashierSession.notes
          })
          .eq('id', cashierSession.id)
        
        if (error) throw error
        setCashierSession(null)
        setShowRegisterModal(false)
        toast({ title: "Register Closed", description: `Register closed with ${formatCurrency(amount)}` })
        
        // Re-open modal for next session
        setRegisterModalMode('open')
        setShowRegisterModal(true)
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to update register status", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const openCloseRegisterModal = () => {
    setRegisterModalMode('close')
    setShowRegisterModal(true)
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

  const handleSendToKitchen = async (destination?: string) => {
    if (!tenantId) return
    if (cartItems.length === 0) return

    setIsProcessing(true)
    try {
       await saveOrder('pending', null, destination)
       
       toast({
        title: "Sent to Kitchen",
        description: `Order ${currentOrderId} sent to ${destination || 'Kitchen'}.`,
       })
       
       clearCart()
       loadData()
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

    // Handle Hold Order
    setIsProcessing(true)
    try {
       await saveOrder('pending')
       
       toast({
        title: "Order Held",
        description: `Order ${currentOrderId} has been held.`,
       })
       
       clearCart()
       loadData()
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

      let saleId = activeSaleId
      
      let notes = `Customer: ${selectedCustomer?.name || 'Walk-in Customer'}${orderNote ? ` | Note: ${orderNote}` : ''}`
      if (additionalData) {
          if (additionalData.ref) notes += ` | Ref: ${additionalData.ref}`
          if (additionalData.notes) notes += ` | PayNote: ${additionalData.notes}`
          if (additionalData.attachment) notes += ` | Attach: ${additionalData.attachment}`
      }

      if (activeSaleId) {
          // Update existing sale
           const { error: saleError } = await supabase
            .from("sales")
            .update({
                total_amount: cartTotal.total,
                payment_status: paymentStatus,
                payment_method: paymentMethod,
                notes: notes,
                customer_id: selectedCustomer?.id || null,
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

          // Delete existing items
          await supabase.from("sale_items").delete().eq("sale_id", activeSaleId)
      } else {
          // Create new sale
          const { data: saleData, error: saleError } = await supabase
            .from("sales")
            .insert({
              tenant_id: tenantId,
              order_number: currentOrderId,
              sale_type: orderType,
              table_id: tableId || null,
              total_amount: cartTotal.total,
              payment_status: paymentStatus,
              payment_method: paymentMethod,
              notes: notes,
              customer_id: selectedCustomer?.id || null,
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
      }

      // Insert Items
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
      
      // Handle KDS (Robust implementation)
      // Check if KDS order exists for this sale (it should be created by trigger on sales insert)
      const { data: kdsOrder } = await supabase
        .from("kds_orders")
        .select("id")
        .eq("sale_id", saleId)
        .single()
        
      if (kdsOrder) {
           // If destination provided, update station
           if (destination) {
               await supabase
                .from("kds_orders")
                .update({ assigned_station: destination })
                .eq("id", kdsOrder.id)
           }

           // Ensure items are in KDS (Trigger might have missed them if sale_items weren't there yet)
           // First delete existing to avoid duplicates if we are updating
           await supabase.from("kds_order_items").delete().eq("kds_order_id", kdsOrder.id)
           
           const kdsItemsData = cartItems.map(i => ({
                kds_order_id: kdsOrder.id,
                menu_item_id: i.item.id,
                quantity: i.quantity,
                status: 'pending' as const
            }))
            await supabase.from("kds_order_items").insert(kdsItemsData)
      } else {
          // Fallback if trigger failed (though it shouldn't)
          // Manually create KDS order? 
          // For now assume trigger works for creating the order shell.
          console.warn("KDS Order not found for sale", saleId)
      } 
      
      return saleId
  }
  
  const handlePaymentComplete = async (method: string, _amount: number, _isHouseAccount: boolean, additionalData?: PaymentAdditionalData) => {
      setIsProcessing(true)
      try {
          // If house account, we might want to record it differently, but for now just 'house_account' method
          await saveOrder('paid', method, undefined, additionalData)
          
          toast({
              title: "Payment Successful",
              description: `Order ${currentOrderId} has been paid via ${method.replace('_', ' ')}.`,
          })
          
          clearCart()
          loadData()
          setShowPaymentModal(false) // Actually the modal handles showing receipt first
      } catch (err) {
          console.error(err)
          toast({ title: "Error", description: "Failed to process payment", variant: "destructive" })
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
          
          // Populate state
          setCurrentOrderId(sale.order_number)
          
          if (sale.customer_id) {
            const { data: customer } = await supabase
              .from('customers')
              .select('*')
              .eq('id', sale.customer_id)
              .single()
            if (customer) setSelectedCustomer(customer)
          } else {
            setSelectedCustomer(null)
          }

          setTableId(sale.table_id || "")
          setOrderType(sale.sale_type as SaleType)
          setActiveSaleId(sale.id)
          
          // Set Items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: CartItem[] = sale.sale_items.map((si: any) => ({
              item: si.menu_items,
              quantity: si.quantity
          }))
          setCartItems(items)
          
          // Set Discount/Tax if possible (simplified)
          // Note: Re-calculating discount might be tricky if it was custom.
          // For now, we rely on current cartTotal calculation. 
          // If the held order had specific discount/tax values, we might lose them if we don't store them in state properly.
          // But we are recalculating based on items.
          
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
    setSelectedCustomer(null)
    setTableId("")
    setActiveSaleId(null)
    setCurrentOrderId(`#ORD-${Math.floor(Math.random() * 10000)}`)
  }

  return (
    <div className="absolute top-(--header-height) left-0 right-0 bottom-0 flex overflow-hidden bg-background md:rounded-b-xl">
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
            <Button variant="outline" onClick={() => setShowHeldOrders(true)} className="gap-2">
                <Clock className="h-4 w-4" />
                Held Orders
                {heldOrders.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                        {heldOrders.length}
                    </span>
                )}
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
      <div className="w-100 shrink-0 flex-col border-l bg-background hidden lg:flex">
        <OrderSidebar 
            orderId={currentOrderId}
            orderType={orderType}
            setOrderType={setOrderType}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
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
            onTaxChange={setTaxRate}
            tenantId={tenantId}
            onSendToKitchen={handleSendToKitchen}
            kitchenDisplays={kitchenDisplays}
          />
      </div>

      <RegisterModal 
        isOpen={showRegisterModal}
        mode={registerModalMode}
        onSubmit={handleRegisterAction}
        onCancel={registerModalMode === 'close' ? () => setShowRegisterModal(false) : undefined}
        isLoading={isProcessing}
      />

      <HeldOrdersModal 
        isOpen={showHeldOrders}
        onClose={() => setShowHeldOrders(false)}
        heldOrders={heldOrders}
        onResumeOrder={resumeOrder}
        isLoading={isProcessing}
      />

      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        totalAmount={cartTotal.total}
        customerName={selectedCustomer?.name || 'Walk-in Customer'}
        orderNumber={currentOrderId}
        items={cartItems.map(i => ({ name: i.item.name, quantity: i.quantity, price: i.item.selling_price }))}
        subtotal={cartTotal.subtotal}
        tax={cartTotal.tax}
        discount={cartTotal.discount}
        currency={currencySymbol}
        isLoading={isProcessing}
      />
    </div>
  )
}
