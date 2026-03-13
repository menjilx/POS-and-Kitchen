import { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']

export type User = Tables['users']['Row'] & {
  email: string
}

export type IngredientCategory = Tables['ingredient_categories']['Row']
export type Ingredient = Tables['ingredients']['Row']

export type Location = Tables['locations']['Row']

export type Stock = Tables['stock']['Row']
export type StockAdjustment = Tables['stock_adjustments']['Row']

export type Stocktake = Tables['stocktakes']['Row']
export type StocktakeItem = Tables['stocktake_items']['Row']

export type MenuItem = Tables['menu_items']['Row'] & {
  item_type: 'standard' | 'simple'
}
export type RecipeItem = Tables['recipe_items']['Row']

export type Supplier = Tables['suppliers']['Row']

export type Purchase = Tables['purchases']['Row']
export type PurchaseItem = Tables['purchase_items']['Row']

export type Table = Tables['tables']['Row']
export type Reservation = Tables['reservations']['Row']

export type Sale = Tables['sales']['Row'] & {
  customer_id?: string | null
}
export type SaleItem = Tables['sale_items']['Row']

export type KDSOrder = Tables['kds_orders']['Row']
export type KDSOrderItem = Tables['kds_order_items']['Row']

export type ExpenseCategory = Tables['expense_categories']['Row']
export type Expense = Tables['expenses']['Row']

export type CashierSession = Tables['cashier_sessions']['Row']

export type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UserRole = string
export type UserStatus = 'active' | 'deactivated'

export type PaymentMethod = string
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'voided'

export type VoidRequestStatus = 'pending' | 'approved' | 'denied'

export type VoidRequest = {
  id: string
  sale_id: string
  reason: string
  status: VoidRequestStatus
  requested_by: string
  reviewed_by: string | null
  review_notes: string | null
  created_at: string
  reviewed_at: string | null
}

export type SaleType = 'dine_in' | 'takeout' | 'delivery'

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'
export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'

export type KDSOrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type KDSOrderPriority = 'normal' | 'high' | 'urgent'
export type KDSOrderItemStatus = 'pending' | 'preparing' | 'ready'

export type StockAdjustmentType = 'purchase' | 'sale' | 'waste' | 'stocktake' | 'adjustment'

export type PaymentAdditionalData = {
  ref?: string
  notes?: string
  attachment?: string | null
  receivedAmount?: number
  changeAmount?: number
}
