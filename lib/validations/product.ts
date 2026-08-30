// lib/validations/product.ts - Zod validation schemas for products and stock management

import { z } from 'zod';

export const ProductCategoryEnum = z.enum(['Electronics', 'Software', 'Accessories', 'Services', 'Other']);
export const StockMovementTypeEnum = z.enum(['in', 'out', 'adjustment']);
export const StockMovementReasonEnum = z.enum(['purchase', 'sale', 'damage', 'loss', 'return', 'correction', 'other']);
export const ProductStatusEnum = z.enum(['active', 'inactive', 'discontinued']);

// Product creation/update schema
export const createProductSchema = z.object({
  sku: z.string().min(1).max(50, 'SKU must be 50 characters or less'),
  name: z.string().min(1).max(255, 'Product name is required'),
  category: ProductCategoryEnum,
  buying_price: z.number().positive('Buying price must be positive'),
  selling_price: z.number().positive('Selling price must be positive'),
  quantity: z.number().int().nonnegative('Quantity cannot be negative').default(0),
  reorder_level: z.number().int().nonnegative('Reorder level must be 0 or greater').default(5),
  description: z.string().optional().default(''),
  status: ProductStatusEnum.default('active'),
});

export const updateProductSchema = createProductSchema.partial();

// Stock movement schema
export const recordStockMovementSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  movement_type: StockMovementTypeEnum,
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

// Stock filters schema
export const productFiltersSchema = z.object({
  category: ProductCategoryEnum.optional(),
  status: ProductStatusEnum.optional(),
  stock_status: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export const stockMovementFiltersSchema = z.object({
  product_id: z.string().uuid().optional(),
  movement_type: StockMovementTypeEnum.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

// Type exports
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type RecordStockMovementInput = z.infer<typeof recordStockMovementSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;
export type StockMovementFilters = z.infer<typeof stockMovementFiltersSchema>;
export type ProductCategory = z.infer<typeof ProductCategoryEnum>;
export type StockMovementType = z.infer<typeof StockMovementTypeEnum>;
export type StockMovementReason = z.infer<typeof StockMovementReasonEnum>;
export type ProductStatus = z.infer<typeof ProductStatusEnum>;

// Response interfaces
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  buying_price: number;
  selling_price: number;
  quantity: number;
  reorder_level: number;
  description: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductWithMetrics extends Product {
  profit_margin: number;
  stock_value: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  created_at: string;
  created_by?: string;
}

export interface StockMovementWithProduct extends StockMovement {
  product?: Product;
}

// Utility types
export interface ProductCategory_Type {
  id: string;
  name: string;
  description?: string;
}
