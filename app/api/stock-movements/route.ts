// app/api/stock-movements/route.ts - General stock movements API

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stockMovementFiltersSchema, recordStockMovementSchema } from '@/lib/validations/product';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/stock-movements - Fetch stock movements with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate filters
    const filters = {
      product_id: searchParams.get('product_id') || undefined,
      movement_type: searchParams.get('movement_type') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
    };

    const validatedFilters = stockMovementFiltersSchema.parse(filters);

    let query = supabase
      .from('stock_movements')
      .select(
        `
        *,
        product:products(id, sku, name, category)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Apply product filter
    if (validatedFilters.product_id) {
      query = query.eq('product_id', validatedFilters.product_id);
    }

    // Apply movement type filter
    if (validatedFilters.movement_type) {
      query = query.eq('movement_type', validatedFilters.movement_type);
    }

    // Apply date filters
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
    console.error('Error fetching stock movements:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 });
  }
}

/**
 * POST /api/stock-movements - Record a stock movement
 * Note: This endpoint is an alternative to using /api/products/[id]/stock/route.ts
 * Both endpoints achieve the same result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = recordStockMovementSchema.parse(body);

    // Get current product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', validatedData.product_id)
      .single();

    if (productError && productError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (productError) throw productError;

    // Validate sufficient stock for removal
    if (validatedData.movement_type === 'out' && product.quantity < validatedData.quantity) {
      return NextResponse.json({ error: 'Insufficient stock for this operation' }, { status: 400 });
    }

    // Calculate new quantity
    const quantityChange =
      validatedData.movement_type === 'in' ? validatedData.quantity : -validatedData.quantity;
    const newQuantity = product.quantity + quantityChange;

    // Update product quantity
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.product_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record stock movement
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert([
        {
          product_id: validatedData.product_id,
          movement_type: validatedData.movement_type,
          quantity: validatedData.quantity,
          reason: validatedData.reason || null,
          reference: validatedData.reference || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select(
        `
        *,
        product:products(id, sku, name, category)
      `
      )
      .single();

    if (movementError) throw movementError;

    return NextResponse.json(
      {
        message: 'Stock movement recorded successfully',
        movement,
        product: updatedProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording stock movement:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to record stock movement' }, { status: 500 });
  }
}
