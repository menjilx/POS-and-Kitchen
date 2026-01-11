'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Clock, CheckCircle2, ChefHat, AlertCircle, XCircle } from 'lucide-react'
import type { KDSOrder, KDSOrderStatus, KDSOrderItem } from '@/types/database'

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
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async (tid: string) => {
    const { data: ordersData } = await supabase
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

    setOrders(((ordersData ?? []) as unknown as OrderWithItems[]))
    setLoading(false)
  }, [])

  const init = useCallback(async () => {
    try {
      let tid: string | null = null

      if (token) {
        // Authenticate with token
        const { data, error } = await supabase
          .from('kitchen_displays')
          .select('tenant_id')
          .eq('token', token)
          .single()

        if (error || !data) {
          setError('Invalid KDS Token')
          setLoading(false)
          return
        }
        tid = data.tenant_id
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
        }
      }

      if (tid) {
        setTenantId(tid)
        await loadOrders(tid)
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
          void loadOrders(tenantId)
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
          void loadOrders(tenantId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadOrders, tenantId])

  useEffect(() => {
    const unsubscribe = subscribeToOrders()
    return () => {
      unsubscribe()
    }
  }, [subscribeToOrders])

  const updateOrderStatus = async (orderId: string, status: KDSOrderStatus) => {
    const updateData: Partial<Pick<KDSOrder, 'status' | 'started_at' | 'completed_at'>> = { status }
    if (status === 'preparing') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'ready' || status === 'served') {
      updateData.completed_at = new Date().toISOString()
    }

    await supabase.from('kds_orders').update(updateData).eq('id', orderId)
  }

  const updateItemStatus = async (itemId: string, status: string) => {
    await supabase.from('kds_order_items').update({ status }).eq('id', itemId)
  }

  const getStatusColor = (status: KDSOrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      default:
        return 'bg-gray-400'
    }
  }

  const groupedOrders = {
    pending: orders.filter(o => o.status === 'pending'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
         <div className="bg-white rounded-lg shadow p-8 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Kitchen Display System</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-sm">Pending: {groupedOrders.pending.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
            <span className="text-sm">Preparing: {groupedOrders.preparing.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="text-sm">Ready: {groupedOrders.ready.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">No active orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(['pending', 'preparing', 'ready'] as const).map((status) => (
            <div key={status} className="space-y-4">
              <h2 className="text-xl font-bold capitalize mb-4 flex items-center gap-2">
                {getStatusIcon(status as KDSOrderStatus)}
                {status}
                <span className="text-sm font-normal text-gray-500">
                  ({groupedOrders[status].length})
                </span>
              </h2>

              {groupedOrders[status].map((order) => (
                <div
                  key={order.id}
                  className={`bg-white rounded-lg shadow border-l-4 ${getStatusColor(order.status)} overflow-hidden`}
                >
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">#{order.order_number}</span>
                        {order.priority !== 'normal' && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs text-white ${getPriorityColor(order.priority)}`}
                          >
                            {order.priority}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {order.assigned_station && (
                          <span className="text-xs text-gray-600">
                            {order.assigned_station}
                          </span>
                        )}
                        {getStatusIcon(order.status)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {order.kds_order_items?.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <span className="font-bold">{item.quantity}x</span>
                        <div className="flex-1">
                          <p className="font-medium">{item.menu_items?.name}</p>
                          {item.notes && (
                            <p className="text-sm text-gray-600">{item.notes}</p>
                          )}
                        </div>
                        {status === 'preparing' && item.status !== 'ready' && (
                          <button
                            onClick={() => updateItemStatus(item.id, 'ready')}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            Ready
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-gray-50 border-t flex gap-2">
                    {status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Start Cooking
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {status === 'preparing' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Mark Ready
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Mark Served
                      </button>
                    )}
                  </div>
                </div>
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <KDSContent />
    </Suspense>
  )
}
