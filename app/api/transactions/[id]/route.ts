// app/api/transactions/[id]/route.ts - Individual transaction API endpoints

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { updateTransactionStatusSchema } from '@/lib/validations/transaction';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/transactions/[id] - Get single transaction
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        customer:customers(id, first_name, last_name, email, phone_number)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}

/**
 * PATCH /api/transactions/[id] - Update transaction status
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateTransactionStatusSchema.parse(body);

    // Fetch current transaction
    const { data: currentTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!currentTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Validate status transition (one-way state machine)
    const validTransitions: Record<string, string[]> = {
      pending: ['completed', 'failed'],
      completed: [],
      failed: [],
    };

    if (!validTransitions[currentTransaction.status]?.includes(validatedData.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentTransaction.status} to ${validatedData.status}` },
        { status: 400 }
      );
    }

    // Record status change in history
    const { error: historyError } = await supabase.from('transaction_status_history').insert([
      {
        transaction_id: id,
        old_status: currentTransaction.status,
        new_status: validatedData.status,
        reason: validatedData.reason || null,
        changed_at: new Date().toISOString(),
      },
    ]);

    if (historyError) throw historyError;

    // Update transaction status
    const { data, error: updateError } = await supabase
      .from('transactions')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        customer:customers(id, first_name, last_name, email, phone_number)
      `
      )
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating transaction:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

/**
 * DELETE /api/transactions/[id] - Delete transaction (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if transaction exists
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Soft delete by updating status if not already completed/failed
    const { error: deleteError } = await supabase
      .from('transactions')
      .update({
        status: 'failed',
        description: 'Deleted by user',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
