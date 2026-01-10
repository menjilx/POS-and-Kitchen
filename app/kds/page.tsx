'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Clock, CheckCircle2, ChefHat, AlertCircle, XCircle } from 'lucide-react'
import type { KDSOrder, KDSOrderStatus, KDSOrderItem } from '@/types/database'

type OrderWithItems = KDSOrder & {
  kds_order_items: (KDSOrderItem & {
    menu_items: { name: string } | null
  })[]
}

export default function KDSPage() {
  
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
    subscribeToOrders()
  }, [])

  const loadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userData) return

    const { data: ordersData } = await supabase
      .from('kds_orders')
      .select(`
        *,
        kds_order_items (
          *,
          menu_items (name)
        )
      `)
      .eq('tenant_id', userData.tenant_id)
      .not('status', 'eq', 'served')
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: true })

    setOrders((ordersData as any) || [])
    setLoading(false)
  }

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('kds_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kds_orders',
        },
        () => loadOrders()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kds_order_items',
        },
        () => loadOrders()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const updateOrderStatus = async (orderId: string, status: KDSOrderStatus) => {
    const updateData: any = { status }
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
