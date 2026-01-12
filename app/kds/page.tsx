'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Clock, CheckCircle2, ChefHat, AlertCircle, XCircle, Timer } from 'lucide-react'
import type { KDSOrder, KDSOrderStatus, KDSOrderItem, KDSOrderItemStatus } from '@/types/database'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function CurrentTime() {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="text-right">
            <div className="text-2xl font-bold font-mono">
                {time.toLocaleTimeString()}
            </div>
            <div className="text-sm text-muted-foreground">
                {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
    )
}

function OrderTimer({ start, end, label }: { start: string, end?: string | null, label?: string }) {
    const [elapsed, setElapsed] = useState("")

    useEffect(() => {
        const calculate = () => {
            const endDate = end ? new Date(end) : new Date()
            const diff = Math.floor((endDate.getTime() - new Date(start).getTime()) / 1000)
            const mins = Math.floor(diff / 60)
            const secs = diff % 60
            setElapsed(`${mins}m ${secs}s`)
        }

        calculate() // Initial calculation
        
        if (end) return

        const interval = setInterval(calculate, 1000)
        return () => clearInterval(interval)
    }, [start, end])

    return (
        <div className="flex items-center gap-1 text-xs font-mono bg-muted/50 px-2 py-1 rounded">
            <Timer className="w-3 h-3" />
            {label && <span className="mr-1">{label}:</span>}
            <span>{elapsed}</span>
        </div>
    )
}

type OrderWithItems = KDSOrder & {
  kds_order_items: (KDSOrderItem & {
    menu_items: { name: string } | null
  })[]
}

function KDSContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [stationName, setStationName] = useState<string | null>(null)
  const [availableStations, setAvailableStations] = useState<{name: string, id: string}[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async (tid: string, station?: string | null) => {
    let query = supabase
      .from('kds_orders')
      .select(`
        *,
        kds_order_items (
          *,
          menu_items (name)
        )
      `)
      .eq('tenant_id', tid)
      .not('status', 'eq', 'served')
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: true })

    if (station) {
      const stationLower = station.trim().toLowerCase()
      if (stationLower.includes('kitchen')) {
        query = query.or('assigned_station.is.null,assigned_station.ilike.*kitchen*')
      } else {
        query = query.eq('assigned_station', station)
      }
    }

    const { data: ordersData } = await query

    setOrders(((ordersData ?? []) as unknown as OrderWithItems[]))
    setLoading(false)
  }, [])

  const init = useCallback(async () => {
    try {
      let tid: string | null = null
      let sName: string | null = null

      if (token) {
        // Authenticate with token
        const { data, error } = await supabase
          .from('kitchen_displays')
          .select('tenant_id, name')
          .eq('token', token)
          .single()

        if (error || !data) {
          setError('Invalid KDS Token')
          setLoading(false)
          return
        }
        tid = data.tenant_id
        sName = data.name
      } else {
        // Fallback to user auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Authentication required')
          setLoading(false)
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single()

        if (userData) {
          tid = userData.tenant_id
          // Fetch available stations for Admin
          const { data: stations } = await supabase
            .from('kitchen_displays')
            .select('id, name')
            .eq('tenant_id', tid)
          
          if (stations) {
             setAvailableStations(stations)
          }
        }
      }

      if (tid) {
        setTenantId(tid)
        setStationName(sName)
        await loadOrders(tid, sName)
      } else {
        setError('No tenant found')
        setLoading(false)
      }
    } catch (err) {
      console.error('KDS Init Error:', err)
      setError('Failed to initialize KDS')
      setLoading(false)
    }
  }, [token, loadOrders])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void init()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [init])

  const subscribeToOrders = useCallback(() => {
    if (!tenantId) return () => {}

    const channel = supabase
      .channel('kds_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kds_orders',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          void loadOrders(tenantId, stationName)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kds_order_items',
        },
        () => {
          // Ideally check tenant_id here too via relation, but straightforward reload is safe
          void loadOrders(tenantId, stationName)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadOrders, tenantId, stationName])

  useEffect(() => {
    const unsubscribe = subscribeToOrders()
    return () => {
      unsubscribe()
    }
  }, [subscribeToOrders])

  const updateOrderStatus = async (orderId: string, status: KDSOrderStatus) => {
    // Optimistic Update
    setOrders(currentOrders => 
      currentOrders.map(order => {
        if (order.id === orderId) {
            return {
                ...order,
                status,
                started_at: status === 'preparing' ? new Date().toISOString() : order.started_at,
                completed_at: (status === 'ready' || status === 'served') ? new Date().toISOString() : order.completed_at
            }
        }
        return order
      })
    )

    const updateData: Partial<Pick<KDSOrder, 'status' | 'started_at' | 'completed_at'>> = { status }
    if (status === 'preparing') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'ready' || status === 'served') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase.from('kds_orders').update(updateData).eq('id', orderId)
    
    if (error) {
        console.error("Failed to update order status", error)
        // Revert or reload if failed
        if (tenantId) loadOrders(tenantId)
    }
  }

  const updateItemStatus = async (itemId: string, status: string) => {
    // Optimistic Update
    setOrders(currentOrders => 
        currentOrders.map(order => ({
            ...order,
            kds_order_items: order.kds_order_items.map(item => 
                item.id === itemId ? { ...item, status: status as KDSOrderItemStatus } : item
            )
        }))
    )

    const { error } = await supabase.from('kds_order_items').update({ status }).eq('id', itemId)
    
    if (error) {
        console.error("Failed to update item status", error)
        if (tenantId) loadOrders(tenantId, stationName)
    }
  }

  const getStatusColor = (status: KDSOrderStatus) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-500 bg-yellow-50'
      case 'preparing':
        return 'border-blue-500 bg-blue-50'
      case 'ready':
        return 'border-green-500 bg-green-50'
      case 'cancelled':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-gray-200'
    }
  }

  const getStatusIcon = (status: KDSOrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />
      case 'preparing':
        return <ChefHat className="w-5 h-5" />
      case 'ready':
        return <CheckCircle2 className="w-5 h-5" />
      case 'cancelled':
        return <XCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'destructive' // or a custom variant if available, fallback to destructive for visibility
      default:
        return 'secondary'
    }
  }

  const groupedOrders = {
    pending: orders.filter(o => o.status === 'pending'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
         <Card className="max-w-md w-full">
            <CardContent className="pt-6 flex flex-col items-center text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600">{error}</p>
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{stationName && stationName !== 'All' ? `${stationName} Display` : 'Kitchen Display System'}</h1>
            <CurrentTime />
            {!token && availableStations.length > 0 && (
                <Select 
                    value={stationName || 'All'} 
                    onValueChange={(val) => {
                        setStationName(val)
                        if (tenantId) loadOrders(tenantId, val)
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Station" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Stations</SelectItem>
                        {availableStations.map(s => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-sm font-medium">Pending: {groupedOrders.pending.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
            <span className="text-sm font-medium">Preparing: {groupedOrders.preparing.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="text-sm font-medium">Ready: {groupedOrders.ready.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card className="max-w-lg mx-auto mt-12">
            <CardContent className="pt-6 flex flex-col items-center text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-xl text-gray-500">No active orders</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(['pending', 'preparing', 'ready'] as const).map((status) => (
            <div key={status} className="space-y-4">
              <h2 className="text-xl font-bold capitalize mb-4 flex items-center gap-2 text-gray-800">
                {getStatusIcon(status as KDSOrderStatus)}
                {status}
                <Badge variant="outline" className="ml-2">
                  {groupedOrders[status].length}
                </Badge>
              </h2>

              {groupedOrders[status].map((order) => (
                <Card 
                  key={order.id} 
                  className={`border-l-4 overflow-hidden ${getStatusColor(order.status)}`}
                >
                  <CardHeader className="p-4 pb-2 bg-white/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{order.order_number}</span>
                        {order.status === 'ready' || order.status === 'served' ? (
                            <OrderTimer start={order.started_at || order.created_at} end={order.completed_at} label="Prep" />
                        ) : order.status === 'preparing' ? (
                            <OrderTimer start={order.started_at || order.created_at} label="Running" />
                        ) : (
                            <OrderTimer start={order.created_at} label="Wait" />
                        )}
                        {order.priority !== 'normal' && (
                          <Badge variant={getPriorityBadgeVariant(order.priority)}>
                            {order.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {order.assigned_station && (
                          <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                            {order.assigned_station}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 bg-white/30 space-y-3">
                    {order.kds_order_items?.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <Badge variant="outline" className="font-bold h-6 min-w-8 flex items-center justify-center bg-white">
                            {item.quantity}x
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.menu_items?.name}</p>
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-0.5 italic">Note: {item.notes}</p>
                          )}
                        </div>
                        {status === 'preparing' && item.status !== 'ready' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateItemStatus(item.id, 'ready')}
                            className="h-7 text-xs bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
                          >
                            Ready
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>

                  <CardFooter className="p-4 pt-3 bg-white/50 border-t border-gray-100 flex gap-2">
                    {status === 'pending' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Start Cooking
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {status === 'preparing' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Mark Ready
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {status === 'ready' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Mark Served
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function KDSPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <KDSContent />
    </Suspense>
  )
}
