// lib/utils/stock-calculations.ts - Stock calculation utilities

/**
 * Calculate profit margin percentage
 * Formula: (selling_price - buying_price) / buying_price * 100
 */
export function calculateProfitMargin(buyingPrice: number, sellingPrice: number): number {
  if (buyingPrice === 0) return 0;
  const margin = ((sellingPrice - buyingPrice) / buyingPrice) * 100;
  return Math.round(margin * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate total stock value
 * Formula: quantity * buying_price
 */
export function calculateStockValue(quantity: number, buyingPrice: number): number {
  const value = quantity * buyingPrice;
  return Math.round(value * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine stock status based on quantity and reorder level
 */
export function getStockStatus(
  quantity: number,
  reorderLevel: number
): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity === 0) {
    return 'out_of_stock';
  }
  if (quantity <= reorderLevel) {
    return 'low_stock';
  }
  return 'in_stock';
}

/**
 * Get status badge color
 */
export function getStatusBadgeColor(
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
): string {
  const colors = {
    in_stock: 'bg-green-100 text-green-800 border-green-300',
    low_stock: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    out_of_stock: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[status];
}

/**
 * Get status label
 */
export function getStatusLabel(
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
): string {
  const labels = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
  };
  return labels[status];
}

/**
 * Calculate stock percentage for visual indicator
 */
export function calculateStockPercentage(quantity: number, maxQuantity: number): number {
  if (maxQuantity === 0) return 0;
  const percentage = (quantity / maxQuantity) * 100;
  return Math.min(100, Math.max(0, percentage)); // Clamp between 0-100
}

/**
 * Validate stock adjustment
 * Ensures quantity won't go negative
 */
export function validateStockAdjustment(
  currentQuantity: number,
  adjustmentQuantity: number,
  movementType: 'in' | 'out'
): { valid: boolean; error?: string } {
  if (adjustmentQuantity <= 0) {
    return { valid: false, error: 'Adjustment quantity must be positive' };
  }

  if (movementType === 'out') {
    if (currentQuantity < adjustmentQuantity) {
      return { valid: false, error: 'Insufficient stock for this operation' };
    }
  }

  return { valid: true };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}
