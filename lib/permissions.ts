export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;

export type Role = string;

// Expanded Permissions List based on application structure
export const PERMISSIONS = {
  // Overview
  VIEW_DASHBOARD: 'view_dashboard',
  
  // Operations
  OPERATIONS_POS: 'operations_pos',
  OPERATIONS_SALES: 'operations_sales',
  OPERATIONS_SALES_VOID: 'operations_sales_void',
  OPERATIONS_SALES_VOID_APPROVE: 'operations_sales_void_approve',
  OPERATIONS_SALES_DELETE: 'operations_sales_delete',
  OPERATIONS_SALES_HISTORY: 'operations_sales_history',
  OPERATIONS_RESERVATIONS: 'operations_reservations',
  OPERATIONS_CUSTOMERS: 'operations_customers',
  
  // Menu
  MENU_ITEMS: 'menu_items',
  MENU_TABLES: 'menu_tables',
  
  // Inventory
  INVENTORY_INGREDIENTS: 'inventory_ingredients',
  INVENTORY_STOCK: 'inventory_stock',
  INVENTORY_PURCHASES: 'inventory_purchases',
  INVENTORY_SUPPLIERS: 'inventory_suppliers',
  INVENTORY_LOCATIONS: 'inventory_locations',
  
  // Finance
  FINANCE_EXPENSES: 'finance_expenses',
  FINANCE_REPORTS: 'finance_reports',
  FINANCE_REGISTER_SESSIONS: 'finance_register_sessions',
  
  // Configuration
  CONFIG_USERS: 'config_users',
  CONFIG_SETTINGS: 'config_settings',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type RolePermissionRow = { role: string; permissions: Permission[] }

export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.VIEW_DASHBOARD]: 'View Dashboard',
  [PERMISSIONS.OPERATIONS_POS]: 'Access POS',
  [PERMISSIONS.OPERATIONS_SALES]: 'View Sales',
  [PERMISSIONS.OPERATIONS_SALES_VOID]: 'Void Sales',
  [PERMISSIONS.OPERATIONS_SALES_VOID_APPROVE]: 'Approve Void Requests',
  [PERMISSIONS.OPERATIONS_SALES_DELETE]: 'Delete Sales',
  [PERMISSIONS.OPERATIONS_SALES_HISTORY]: 'View Sales History',
  [PERMISSIONS.OPERATIONS_RESERVATIONS]: 'Manage Reservations',
  [PERMISSIONS.OPERATIONS_CUSTOMERS]: 'Manage Customers',
  [PERMISSIONS.MENU_ITEMS]: 'Manage Menu Items',
  [PERMISSIONS.MENU_TABLES]: 'Manage Tables',
  [PERMISSIONS.INVENTORY_INGREDIENTS]: 'Manage Ingredients',
  [PERMISSIONS.INVENTORY_STOCK]: 'Manage Stock',
  [PERMISSIONS.INVENTORY_PURCHASES]: 'Manage Purchases',
  [PERMISSIONS.INVENTORY_SUPPLIERS]: 'Manage Suppliers',
  [PERMISSIONS.INVENTORY_LOCATIONS]: 'Manage Locations',
  [PERMISSIONS.FINANCE_EXPENSES]: 'Manage Expenses',
  [PERMISSIONS.FINANCE_REPORTS]: 'View Reports',
  [PERMISSIONS.FINANCE_REGISTER_SESSIONS]: 'View Register Sessions',
  [PERMISSIONS.CONFIG_USERS]: 'Manage Users',
  [PERMISSIONS.CONFIG_SETTINGS]: 'Manage Settings',
};

// Default Permissions
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.OWNER]: Object.values(PERMISSIONS), // Owner has everything
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.OPERATIONS_POS,
    PERMISSIONS.OPERATIONS_SALES,
    PERMISSIONS.OPERATIONS_SALES_VOID,
    PERMISSIONS.OPERATIONS_SALES_VOID_APPROVE,
    PERMISSIONS.OPERATIONS_SALES_DELETE,
    PERMISSIONS.OPERATIONS_SALES_HISTORY,
    PERMISSIONS.OPERATIONS_RESERVATIONS,
    PERMISSIONS.OPERATIONS_CUSTOMERS,
    PERMISSIONS.MENU_ITEMS,
    PERMISSIONS.MENU_TABLES,
    PERMISSIONS.INVENTORY_INGREDIENTS,
    PERMISSIONS.INVENTORY_STOCK,
    PERMISSIONS.INVENTORY_PURCHASES,
    PERMISSIONS.INVENTORY_SUPPLIERS,
    PERMISSIONS.FINANCE_EXPENSES,
    PERMISSIONS.FINANCE_REPORTS,
    PERMISSIONS.FINANCE_REGISTER_SESSIONS,
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.OPERATIONS_POS,
    PERMISSIONS.OPERATIONS_SALES_VOID, // Staff can request voids
    PERMISSIONS.OPERATIONS_RESERVATIONS, // Often staff take reservations
    PERMISSIONS.INVENTORY_STOCK, // Simple stock checks
  ],
};

export const buildPermissionsByRole = (customPermissions?: RolePermissionRow[] | null) => {
  const permissionsByRole: Record<string, Permission[]> = {
    [ROLES.OWNER]: [...DEFAULT_ROLE_PERMISSIONS[ROLES.OWNER]],
    [ROLES.MANAGER]: [...DEFAULT_ROLE_PERMISSIONS[ROLES.MANAGER]],
    [ROLES.STAFF]: [...DEFAULT_ROLE_PERMISSIONS[ROLES.STAFF]],
  }

  customPermissions?.forEach((permissionRow) => {
    const role = permissionRow.role
    if (!role || role === ROLES.OWNER) return
    const permissions = Array.isArray(permissionRow.permissions) ? permissionRow.permissions : []
    permissionsByRole[role] = permissions
  })

  return permissionsByRole
}

export const PERMISSION_GROUPS = {
  'Overview': [PERMISSIONS.VIEW_DASHBOARD],
  'Operations': [
    PERMISSIONS.OPERATIONS_POS,
    PERMISSIONS.OPERATIONS_SALES,
    PERMISSIONS.OPERATIONS_SALES_VOID,
    PERMISSIONS.OPERATIONS_SALES_VOID_APPROVE,
    PERMISSIONS.OPERATIONS_SALES_DELETE,
    PERMISSIONS.OPERATIONS_SALES_HISTORY,
    PERMISSIONS.OPERATIONS_RESERVATIONS,
    PERMISSIONS.OPERATIONS_CUSTOMERS
  ],
  'Menu': [
    PERMISSIONS.MENU_ITEMS,
    PERMISSIONS.MENU_TABLES
  ],
  'Inventory': [
    PERMISSIONS.INVENTORY_INGREDIENTS,
    PERMISSIONS.INVENTORY_STOCK,
    PERMISSIONS.INVENTORY_PURCHASES,
    PERMISSIONS.INVENTORY_SUPPLIERS,
    PERMISSIONS.INVENTORY_LOCATIONS
  ],
  'Finance': [
    PERMISSIONS.FINANCE_EXPENSES,
    PERMISSIONS.FINANCE_REPORTS,
    PERMISSIONS.FINANCE_REGISTER_SESSIONS
  ],
  'Configuration': [
    PERMISSIONS.CONFIG_USERS,
    PERMISSIONS.CONFIG_SETTINGS
  ]
};
