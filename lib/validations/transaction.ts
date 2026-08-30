// lib/validations/transaction.ts - Zod validation schemas for transactions

import { z } from 'zod';

export const TransactionTypeEnum = z.enum(['domestic', 'international']);
export const TransactionStatusEnum = z.enum(['pending', 'completed', 'failed']);
export const PaymentMethodEnum = z.enum(['bank_transfer', 'cash', 'mobile_money', 'cheque']);

export const createTransactionSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  amount: z.number().positive('Amount must be greater than 0'),
  transaction_type: TransactionTypeEnum,
  payment_method: PaymentMethodEnum,
  description: z.string().optional().default(''),
  reference: z.string().optional().default(''),
});

export const updateTransactionStatusSchema = z.object({
  status: TransactionStatusEnum,
  reason: z.string().optional(),
});

export const transactionFiltersSchema = z.object({
  status: TransactionStatusEnum.optional(),
  transaction_type: TransactionTypeEnum.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionStatusInput = z.infer<typeof updateTransactionStatusSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
export type TransactionType = z.infer<typeof TransactionTypeEnum>;
export type TransactionStatus = z.infer<typeof TransactionStatusEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

// Response types
export interface Transaction {
  id: string;
  customer_id: string;
  amount: number;
  service_charge: number;
  total_amount: number;
  transaction_type: TransactionType;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  description: string;
  reference: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
}

export interface TransactionWithCustomer extends Transaction {
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone_number?: string;
  };
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
}

export interface ServiceChargeRate {
  id: string;
  transaction_type: TransactionType;
  rate_percentage: number;
  effective_date: string;
}
