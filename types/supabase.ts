export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          tenant_id: string | null
          email: string
          full_name: string | null
          role: 'owner' | 'manager' | 'staff' | 'superadmin'
          status: 'active' | 'deactivated'
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['users']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      tenants: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at'>>
      }
      ingredient_categories: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ingredient_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['ingredient_categories']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      ingredients: {
        Row: {
          id: string
          tenant_id: string
          category_id: string | null
          name: string
          unit: string
          cost_per_unit: number
          reorder_level: number
          status: 'active' | 'deactivated'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ingredients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['ingredients']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      locations: {
        Row: {
          id: string
          tenant_id: string
          name: string
          address: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      stock: {
        Row: {
          id: string
          tenant_id: string
          ingredient_id: string
          location_id: string
          quantity: number
          last_updated: string
        }
        Insert: Omit<Database['public']['Tables']['stock']['Row'], 'id' | 'last_updated'>
        Update: Partial<Omit<Database['public']['Tables']['stock']['Row'], 'id' | 'tenant_id' | 'ingredient_id' | 'location_id'>>
      }
      stock_adjustments: {
        Row: {
          id: string
          tenant_id: string
          ingredient_id: string
          location_id: string
          adjustment_type: 'purchase' | 'sale' | 'waste' | 'stocktake' | 'adjustment'
          quantity: number
          reference_id: string | null
          notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['stock_adjustments']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['stock_adjustments']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      stocktakes: {
        Row: {
          id: string
          tenant_id: string
          location_id: string
          date: string
          performed_by: string
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stocktakes']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['stocktakes']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      stocktake_items: {
        Row: {
          id: string
          stocktake_id: string
          ingredient_id: string
          expected_quantity: number
          actual_quantity: number
          variance: number
          variance_percentage: number
        }
        Insert: Omit<Database['public']['Tables']['stocktake_items']['Row'], 'id' | 'variance' | 'variance_percentage'>
        Update: Partial<Omit<Database['public']['Tables']['stocktake_items']['Row'], 'id' | 'stocktake_id' | 'variance' | 'variance_percentage'>>
      }
      menu_items: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          category: string | null
          selling_price: number
          waste_percentage: number
          labor_cost: number
          total_cost: number
          contribution_margin: number
          status: 'active' | 'deactivated'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['menu_items']['Row'], 'id' | 'total_cost' | 'contribution_margin' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['menu_items']['Row'], 'id' | 'tenant_id' | 'total_cost' | 'contribution_margin' | 'created_at'>>
      }
      recipe_items: {
        Row: {
          id: string
          menu_item_id: string
          ingredient_id: string
          quantity: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['recipe_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['recipe_items']['Row'], 'id' | 'menu_item_id' | 'created_at'>>
      }
      suppliers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      purchases: {
        Row: {
          id: string
          tenant_id: string
          supplier_id: string | null
          invoice_number: string | null
          invoice_date: string
          total_amount: number
          notes: string | null
          created_at: string
          created_by: string
        }
        Insert: Omit<Database['public']['Tables']['purchases']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['purchases']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          ingredient_id: string
          quantity: number
          unit_price: number
          total_price: number
          location_id: string
        }
        Insert: Omit<Database['public']['Tables']['purchase_items']['Row'], 'id' | 'total_price'>
        Update: Partial<Omit<Database['public']['Tables']['purchase_items']['Row'], 'id' | 'purchase_id' | 'total_price'>>
      }
      tables: {
        Row: {
          id: string
          tenant_id: string
          table_number: string
          capacity: number
          location: string | null
          status: 'available' | 'occupied' | 'reserved' | 'cleaning'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tables']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['tables']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      reservations: {
        Row: {
          id: string
          tenant_id: string
          table_id: string
          customer_name: string
          customer_phone: string | null
          customer_email: string | null
          party_size: number
          reservation_time: string
          duration_minutes: number
          status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
          special_requests: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['reservations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['reservations']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      sales: {
        Row: {
          id: string
          tenant_id: string
          order_number: string
          sale_type: 'dine_in' | 'takeout' | 'delivery'
          table_id: string | null
          reservation_id: string | null
          total_amount: number
          payment_method: 'cash' | 'card' | 'ewallet' | 'bank_transfer' | null
          payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
          payment_notes: string | null
          tip_amount: number
          payment_data: any
          notes: string | null
          sale_date: string
          sale_time: string
          created_at: string
          created_by: string
        }
        Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          menu_item_id: string
          quantity: number
          unit_price: number
          total_price: number
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['sale_items']['Row'], 'id' | 'total_price'>
        Update: Partial<Omit<Database['public']['Tables']['sale_items']['Row'], 'id' | 'sale_id' | 'total_price'>>
      }
      kds_orders: {
        Row: {
          id: string
          tenant_id: string
          sale_id: string
          order_number: string
          status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
          priority: 'normal' | 'high' | 'urgent'
          assigned_station: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['kds_orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['kds_orders']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      kds_order_items: {
        Row: {
          id: string
          kds_order_id: string
          menu_item_id: string
          quantity: number
          notes: string | null
          status: 'pending' | 'preparing' | 'ready'
        }
        Insert: Omit<Database['public']['Tables']['kds_order_items']['Row'], 'id'>
        Update: Partial<Omit<Database['public']['Tables']['kds_order_items']['Row'], 'id' | 'kds_order_id'>>
      }
      expense_categories: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['expense_categories']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
      expenses: {
        Row: {
          id: string
          tenant_id: string
          category_id: string
          description: string
          amount: number
          expense_date: string
          notes: string | null
          created_at: string
          created_by: string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'tenant_id' | 'created_at'>>
      }
    }
  }
}
