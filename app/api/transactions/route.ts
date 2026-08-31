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

// Helper function to decode JWT token
function decodeJWT(token: string): { sub?: string; [key: string]: unknown } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

async function getAuthenticatedUser(request: NextRequest) {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return null;
  }

  // Decode token to get user ID
  const tokenPayload = decodeJWT(token);
  if (!tokenPayload?.sub) {
    return null;
  }

  const userId = tokenPayload.sub;

  // Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, branch_id, role_id, is_active')
    .eq('id', userId)
    .single();

  if (error || !profile || !profile.is_active) {
    return null;
  }

  return profile;
}

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
      recorded_by: searchParams.get('recorded_by') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
    };

    const validatedFilters = transactionFiltersSchema.parse({
      status: filters.status,
      transaction_type: filters.transaction_type,
      start_date: filters.start_date,
      end_date: filters.end_date,
      customer_id: filters.customer_id,
      page: filters.page,
      limit: filters.limit,
    });

    const selectFields =
      '*, customer:customers(id, first_name, last_name, email, phone_number)';

    let query = supabase
      .from('transactions')
      .select(selectFields, { count: 'exact' })
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

    // Filter by recorded_by for employees
    if (filters.recorded_by) {
      query = query.eq('recorded_by', filters.recorded_by);
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

    if (error) {
      console.error('Database error fetching transactions:', error);
      throw error;
    }

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
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

/**
 * POST /api/transactions - Create new transaction
 * Automatically calculates service charge and requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received transaction data:', body);

    // Validate input
    const validatedData = createTransactionSchema.parse(body);

    // Fetch service charge rates for the transaction type
    const { data: rateData, error: rateError } = await supabase
      .from('transaction_rates')
      .select('rate_percentage')
      .eq('transaction_type', validatedData.transaction_type)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateError && rateError.code !== 'PGRST116') {
      console.error('Error fetching rates:', rateError);
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

    const selectFields =
      '*, customer:customers(id, first_name, last_name, email, phone_number)';

    // Create transaction record with recorded_by from authenticated user
    const transactionData = {
      customer_id: validatedData.customer_id,
      amount: validatedData.amount,
      service_charge: serviceCharge,
      total_amount: totalAmount,
      transaction_type: validatedData.transaction_type,
      payment_method: validatedData.payment_method,
      status: 'pending',
      description: validatedData.description || null,
      reference: validatedData.reference || null,
      recorded_by: user.id, // Add authenticated user's ID
      direction: 'outbound', // Default direction for new transactions
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Inserting transaction:', transactionData);

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select(selectFields)
      .single();

    if (error) {
      console.error('Database error creating transaction:', error);
      throw error;
    }

    console.log('Transaction created successfully:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}