// lib/constants/permissions.ts
export const PERMISSIONS = {
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMERS_LIST: 'customers:list',
  
  TRANSACTIONS_CREATE: 'transactions:create',
  TRANSACTIONS_READ: 'transactions:read',
  TRANSACTIONS_UPDATE: 'transactions:update',
  TRANSACTIONS_DELETE: 'transactions:delete',
  TRANSACTIONS_LIST: 'transactions:list',
  
  STOCK_CREATE: 'stock:create',
  STOCK_READ: 'stock:read',
  STOCK_UPDATE: 'stock:update',
  STOCK_DELETE: 'stock:delete',
  STOCK_LIST: 'stock:list',
  STOCK_TRANSFER: 'stock:transfer',
  
  ANNOUNCEMENTS_CREATE: 'announcements:create',
  ANNOUNCEMENTS_READ: 'announcements:read',
  ANNOUNCEMENTS_UPDATE: 'announcements:update',
  ANNOUNCEMENTS_DELETE: 'announcements:delete',
  ANNOUNCEMENTS_LIST: 'announcements:list',
  ANNOUNCEMENTS_PUBLISH: 'announcements:publish',
  
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_LIST: 'users:list',
  
  REPORTS_CREATE: 'reports:create',
  REPORTS_READ: 'reports:read',
  REPORTS_LIST: 'reports:list',
  
  AUDIT_LOG_READ: 'audit_log:read',
  SETTINGS_UPDATE: 'settings:update',
  BRANCHES_MANAGE: 'branches:manage',
} as const;
