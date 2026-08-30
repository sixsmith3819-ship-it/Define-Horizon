// app/api/products/[id]/route.ts - Individual product endpoints

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateProductSchema } from '@/lib/validations/product';
import { calculateProfitMargin, calculateStockValue, getStockStatus } from '@/lib/utils/stock-calculations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/products/[id] - Get single product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const productId = (await params).id;

    // Validate UUID format
    if (!isValidUUID(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (error) throw error;

    // Calculate metrics
    const productWithMetrics = {
      ...data,
      profit_margin: calculateProfitMargin(data.buying_price, data.selling_price),
      stock_value: calculateStockValue(data.quantity, data.buying_price),
      stock_status: getStockStatus(data.quantity, data.reorder_level),
    };

    return NextResponse.json(productWithMetrics);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id] - Update product
 */
export async function PUT(
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
    const validatedData = updateProductSchema.parse(body);

    // If SKU is being updated, check for uniqueness
    if (validatedData.sku) {
      const { data: existingSku } = await supabase
        .from('products')
        .select('id')
        .eq('sku', validatedData.sku)
        .neq('id', productId)
        .single();

      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    // Update product
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (error) throw error;

    // Calculate metrics
    const productWithMetrics = {
      ...data,
      profit_margin: calculateProfitMargin(data.buying_price, data.selling_price),
      stock_value: calculateStockValue(data.quantity, data.buying_price),
      stock_status: getStockStatus(data.quantity, data.reorder_level),
    };

    return NextResponse.json(productWithMetrics);
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id] - Soft delete product (mark as inactive)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const productId = (await params).id;

    // Validate UUID format
    if (!isValidUUID(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    // Soft delete by marking as inactive
    const { data, error } = await supabase
      .from('products')
      .update({
        status: 'discontinued',
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (error) throw error;

    return NextResponse.json({
      message: 'Product deleted successfully',
      product: data,
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
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
