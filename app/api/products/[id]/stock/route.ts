// app/api/products/[id]/stock/route.ts - Stock management for individual products

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordStockMovementSchema } from '@/lib/validations/product';
import { validateStockAdjustment } from '@/lib/utils/stock-calculations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/products/[id]/stock - Get stock movement history for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const productId = (await params).id;
    const searchParams = request.nextUrl.searchParams;

    // Validate UUID format
    if (!isValidUUID(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError && productError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get stock movements
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/stock - Record stock movement (add/remove stock)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const productId = (await params).id;
    const body = await request.json();

    // Validate UUID format
    if (!isValidUUID(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    // Validate input
    const validatedData = recordStockMovementSchema.parse({
      ...body,
      product_id: productId,
    });

    // Get current product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError && productError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (productError) throw productError;

    // Validate stock adjustment
    const validation = validateStockAdjustment(
      product.quantity,
      validatedData.quantity,
      validatedData.movement_type as 'in' | 'out'
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Calculate new quantity
    const quantityChange =
      validatedData.movement_type === 'in'
        ? validatedData.quantity
        : -validatedData.quantity;
    const newQuantity = product.quantity + quantityChange;

    // Start transaction: update product quantity and record movement
    // Update product quantity
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record stock movement
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert([
        {
          product_id: productId,
          movement_type: validatedData.movement_type,
          quantity: validatedData.quantity,
          reason: validatedData.reason || null,
          reference: validatedData.reference || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (movementError) throw movementError;

    return NextResponse.json(
      {
        message: 'Stock movement recorded successfully',
        movement,
        product: updatedProduct,
        previous_quantity: product.quantity,
        new_quantity: newQuantity,
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

    return NextResponse.json(
      { error: 'Failed to record stock movement' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
