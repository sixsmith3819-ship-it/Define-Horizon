// app/api/transactions/route.ts - Transaction API endpoints

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createTransactionSchema, transactionFiltersSchema } from '@/lib/validations/transaction';
import { calculateServiceCharge, calculateTotalAmount } from '@/lib/utils/service-charge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/transactions - Fetch all transactions with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse and validate filters
    const filters = {
      status: searchParams.get('status') || undefined,
      transaction_type: searchParams.get('transaction_type') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      customer_id: searchParams.get('customer_id') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
    };

    const validatedFilters = transactionFiltersSchema.parse(filters);

    let query = supabase
      .from('transactions')
      .select(`
        *,
        customer:customers(id, first_name, last_name, email, phone_number)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status);
    }

    if (validatedFilters.transaction_type) {
      query = query.eq('transaction_type', validatedFilters.transaction_type);
    }

    if (validatedFilters.customer_id) {
      query = query.eq('customer_id', validatedFilters.customer_id);
    }

    if (validatedFilters.start_date) {
      query = query.gte('created_at', validatedFilters.start_date);
    }

    if (validatedFilters.end_date) {
      query = query.lte('created_at', validatedFilters.end_date);
    }

    // Apply pagination
    const from = (validatedFilters.page - 1) * validatedFilters.limit;
    const to = from + validatedFilters.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total: count || 0,
        pages: count ? Math.ceil(count / validatedFilters.limit) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions - Create new transaction
 * Automatically calculates service charge
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createTransactionSchema.parse(body);

    // Fetch service charge rates for the transaction type
    const { data: rateData, error: rateError } = await supabase
      .from('transaction_rates')
      .select('rate_percentage')
      .eq('transaction_type', validatedData.transaction_type)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (rateError && rateError.code !== 'PGRST116') {
      // PGRST116 is "no rows found" error, which is acceptable
      throw rateError;
    }

    // Use custom rate if available, otherwise use default
    const rates = rateData
      ? {
          [validatedData.transaction_type]: rateData.rate_percentage / 100,
        }
      : {};

    // Calculate service charge and total
    const serviceCharge = calculateServiceCharge(
      validatedData.amount,
      validatedData.transaction_type,
      rates
    );
    const totalAmount = calculateTotalAmount(
      validatedData.amount,
      validatedData.transaction_type,
      rates
    );

    // Create transaction record
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          customer_id: validatedData.customer_id,
          amount: validatedData.amount,
          service_charge: serviceCharge,
          total_amount: totalAmount,
          transaction_type: validatedData.transaction_type,
          payment_method: validatedData.payment_method,
          status: 'pending',
          description: validatedData.description || null,
          reference: validatedData.reference || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select(`
        *,
        customer:customers(id, first_name, last_name, email, phone_number)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
